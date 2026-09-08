import { createHash } from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { evaluationSuites, evaluationReports, promptChangeRequests } from '@/drizzle/schema';
import { requireUserId } from '@/lib/auth';
import { resolveTeamContext } from '@/lib/team-request';
import { assert, ApiError } from '@/lib/api-error';
import { getPromptByScope } from '@/lib/prompt-workflow';
import { PROVIDER_BASE_URLS, getStoredProviderKey, runPlaygroundCompletion } from '@/lib/playground-provider';
import { EVALUATION_PROVIDERS, evaluationId, normalizeSuite, renderEvaluationPrompt, checkEvaluationOutput, estimateEvaluationCost } from '@/lib/prompt-evaluation';

export const maxDuration = 180;
const reply = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
// Do not log database/provider exceptions: they can contain prompt snapshots or credentials.
const failure = (error) => reply({ error: error instanceof ApiError ? error.message : 'Evaluation could not be saved or loaded', code: 'EVALUATION_ERROR' }, error instanceof ApiError ? error.status : 500);
const scope = (table, context) => context.teamId ? eq(table.teamId, context.teamId) : and(isNull(table.teamId), eq(table.createdBy, context.userId));
async function context(request) {
  const userId = await requireUserId(request);
  return { ...await resolveTeamContext(request, userId, { requireMembership: true, allowMissingTeam: true }), userId };
}
async function bodyOf(request) {
  const raw = await request.text();
  assert(raw.length <= 110000, 413, 'Request is too large');
  try { const body = JSON.parse(raw); assert(body && typeof body === 'object' && !Array.isArray(body), 400, 'Invalid body'); return body; }
  catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(400, 'Invalid JSON'); }
}
async function loadReport(ctx, id) {
  const [report] = await ctx.db.select().from(evaluationReports).where(and(eq(evaluationReports.id, evaluationId(id)), scope(evaluationReports, ctx))).limit(1);
  assert(report, 404, 'Report not found');
  return report;
}

export async function GET(request) {
  try {
    const ctx = await context(request);
    const query = new URL(request.url).searchParams;
    if (query.has('reportId')) return reply({ report: await loadReport(ctx, query.get('reportId')) });
    const requestId = query.get('changeRequestId');
    const reportScope = requestId ? and(scope(evaluationReports, ctx), eq(evaluationReports.changeRequestId, evaluationId(requestId))) : scope(evaluationReports, ctx);
    const [suites, reports] = await Promise.all([
      ctx.db.select().from(evaluationSuites).where(scope(evaluationSuites, ctx)).orderBy(desc(evaluationSuites.createdAt)).limit(50),
      ctx.db.select({ id: evaluationReports.id, status: evaluationReports.status, createdAt: evaluationReports.createdAt, changeRequestId: evaluationReports.changeRequestId })
        .from(evaluationReports).where(reportScope).orderBy(desc(evaluationReports.createdAt)).limit(50),
    ]);
    return reply({ suites, reports });
  } catch (error) { return failure(error); }
}

export async function POST(request) {
  try {
    const ctx = await context(request), body = await bodyOf(request);
    if (body.action === 'save_suite') {
      const [suite] = await ctx.db.insert(evaluationSuites).values({ ...normalizeSuite(body), teamId: ctx.teamId, createdBy: ctx.userId }).returning();
      return reply({ suite }, 201);
    }
    assert(body.action === 'run', 400, 'Unknown action');
    const [suite] = await ctx.db.select().from(evaluationSuites).where(and(eq(evaluationSuites.id, evaluationId(body.suiteId)), scope(evaluationSuites, ctx))).limit(1);
    assert(suite, 404, 'Test suite not found');
    const dataset = normalizeSuite(suite);
    const settings = body.settings || {};
    assert(EVALUATION_PROVIDERS.includes(settings.provider), 400, 'Unsupported provider');
    assert(typeof settings.model === 'string' && settings.model.trim() && settings.model.length <= 150, 400, 'Model is required');
    assert(Number.isSafeInteger(settings.maxTokens) && settings.maxTokens >= 1 && settings.maxTokens <= 2048, 400, 'Max tokens must be 1–2048');
    assert(settings.temperature === undefined || (typeof settings.temperature === 'number' && Number.isFinite(settings.temperature) && settings.temperature >= 0 && settings.temperature <= 1), 400, 'Temperature must be 0–1');
    let baselineId = body.baselineId, candidate, changeRequestId = null;
    if (body.changeRequestId) {
      assert(ctx.teamId, 400, 'Approval reports require a team');
      changeRequestId = evaluationId(body.changeRequestId);
      const [proposal] = await ctx.db.select().from(promptChangeRequests).where(and(eq(promptChangeRequests.id, changeRequestId), eq(promptChangeRequests.teamId, ctx.teamId))).limit(1);
      assert(proposal?.basePromptId, 404, 'Change request with a baseline not found');
      baselineId = proposal.basePromptId;
      candidate = { id: proposal.id, title: proposal.proposedTitle, content: proposal.proposedContent, version: proposal.proposedVersion, skill_package: proposal.proposedSkillPackage };
    }
    const baseline = await getPromptByScope(ctx.db, { promptId: evaluationId(baselineId), teamId: ctx.teamId, userId: ctx.userId });
    assert(baseline, 404, 'Baseline not found');
    if (!candidate) {
      candidate = await getPromptByScope(ctx.db, { promptId: evaluationId(body.candidateId), teamId: ctx.teamId, userId: ctx.userId, versionOf: baseline });
      assert(candidate && candidate.id !== baseline.id, 400, 'Choose two distinct versions of the same prompt');
    }
    const snapshots = [baseline, candidate].map((prompt) => ({ id: prompt.id, title: prompt.title, version: prompt.version, content: prompt.content,
      hasAttachments: !!prompt.skill_package?.files?.length,
      hash: createHash('sha256').update(JSON.stringify({ content: prompt.content, skillPackage: prompt.skill_package || null })).digest('hex') }));
    const rendered = dataset.cases.map((item) => snapshots.map((prompt) => renderEvaluationPrompt(prompt.content, item.variables)));
    const apiKey = await getStoredProviderKey(ctx.db, ctx.userId, settings.provider);
    assert(apiKey, 400, 'Save an API key for this provider in Playground first');
    const config = { provider: settings.provider, model: settings.model.trim(), maxTokens: settings.maxTokens, ...(settings.temperature !== undefined ? { temperature: settings.temperature } : {}) };
    const data = { suite: { id: suite.id, ...dataset }, baseline: snapshots[0], candidate: snapshots[1], settings: config, results: [], scope: 'prompt_body_only' };
    const [report] = await ctx.db.insert(evaluationReports).values({ teamId: ctx.teamId, createdBy: ctx.userId, changeRequestId, data }).returning();
    const started = Date.now();
    // ponytail: bounded synchronous runs; use a durable job only when suites exceed five cases.
    for (let index = 0; index < dataset.cases.length; index++) {
      if (request.signal.aborted || Date.now() - started > 120000) break;
      const item = dataset.cases[index];
      const outputs = await Promise.all(rendered[index].map(async (systemPrompt) => {
        const callStarted = Date.now();
        try {
          const result = await runPlaygroundCompletion({ ...config, apiKey, baseURL: PROVIDER_BASE_URLS[config.provider], systemPrompt, userPrompt: item.input,
            standardTier: true, clientOptions: { timeout: 20000, maxRetries: 0 }, signal: request.signal });
          return { ...result, requestStatus: 'succeeded', quality: checkEvaluationOutput(result, item.checks), cost: estimateEvaluationCost(config.provider, result) };
        } catch { return { duration: Date.now() - callStarted, requestStatus: 'failed', quality: { status: 'unscored', checks: [] }, error: 'Provider request failed or timed out', cost: null }; }
      }));
      data.results.push({ caseId: item.id, baseline: outputs[0], candidate: outputs[1] });
      await ctx.db.update(evaluationReports).set({ data, updatedAt: new Date() }).where(and(eq(evaluationReports.id, report.id), scope(evaluationReports, ctx)));
    }
    const status = data.results.length === dataset.cases.length && data.results.every((item) => [item.baseline, item.candidate].every((output) => output.requestStatus === 'succeeded')) ? 'completed' : 'partial';
    const [saved] = await ctx.db.update(evaluationReports).set({ data, status, updatedAt: new Date() }).where(and(eq(evaluationReports.id, report.id), scope(evaluationReports, ctx))).returning();
    return reply({ report: saved }, 201);
  } catch (error) { return failure(error); }
}

export async function PATCH(request) {
  try {
    const ctx = await context(request), body = await bodyOf(request);
    const report = await loadReport(ctx, body.reportId);
    assert(Number.isSafeInteger(body.revision) && body.revision === report.revision, 409, 'Report changed; reload before reviewing');
    assert(report.status !== 'running', 409, 'Wait for the run to finish');
    const item = report.data.results.find((item) => item.caseId === body.caseId);
    assert(item && [item.baseline, item.candidate].every((output) => output.requestStatus === 'succeeded' && ['passed', 'failed', 'unscored'].includes(output.quality.status)), 400, 'Review requires two complete outputs');
    assert(['baseline', 'candidate', 'tie', 'neither'].includes(body.preference), 400, 'Invalid preference');
    assert(typeof body.note === 'string' && body.note.length <= 2000, 400, 'Review note is too long');
    const reviews = { ...report.reviews, [body.caseId]: { preference: body.preference, note: body.note, userId: ctx.userId, reviewedAt: new Date().toISOString() } };
    const [saved] = await ctx.db.update(evaluationReports).set({ reviews, revision: report.revision + 1, updatedAt: new Date() })
      .where(and(eq(evaluationReports.id, report.id), scope(evaluationReports, ctx), eq(evaluationReports.revision, body.revision))).returning();
    assert(saved, 409, 'Report changed; reload before reviewing');
    return reply({ report: saved });
  } catch (error) { return failure(error); }
}
