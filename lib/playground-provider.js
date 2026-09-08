import { and, eq } from 'drizzle-orm';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { providerKeys } from '@/drizzle/schema';
import { getOpenAIClientConfig, ORCAROUTER_BASE_URL } from '@/lib/openai-compat';

export const PROVIDER_BASE_URLS = {
  openai: 'https://api.openai.com/v1', deepseek: 'https://api.deepseek.com/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4', gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  claude: 'https://api.anthropic.com/v1', kimi: 'https://api.moonshot.cn/v1',
  doubao: 'https://ark.cn-beijing.volces.com/api/v3', minimax: 'https://api.minimaxi.com/v1',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1', siliconflow: 'https://api.siliconflow.cn/v1',
  stepfun: 'https://api.stepfun.com/v1', xai: 'https://api.x.ai/v1', orcarouter: ORCAROUTER_BASE_URL,
};

export async function getStoredProviderKey(db, userId, provider) {
  const rows = await db.select({ apiKey: providerKeys.apiKey }).from(providerKeys)
    .where(and(eq(providerKeys.userId, userId), eq(providerKeys.provider, provider))).limit(1);
  return rows[0]?.apiKey || null;
}

const tokens = (value) => Number.isSafeInteger(value) && value >= 0 ? value : null;

export async function runPlaygroundCompletion({ apiKey, baseURL, provider, model, systemPrompt, userPrompt, temperature, maxTokens, topP, clientOptions = {}, signal, standardTier = false }) {
  const start = Date.now();
  if (provider === 'claude') {
    const client = new Anthropic({ apiKey, ...clientOptions });
    const response = await client.messages.create({ model, system: systemPrompt || undefined,
      messages: [{ role: 'user', content: userPrompt }], max_tokens: maxTokens, temperature, top_p: topP,
    }, { signal });
    const input = tokens(response.usage?.input_tokens), output = tokens(response.usage?.output_tokens);
    const cached = tokens(response.usage?.cache_read_input_tokens), created = tokens(response.usage?.cache_creation_input_tokens);
    // Claude input_tokens excludes cache reads/writes: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
    const totalInput = [input, cached, created].every((value) => value !== null) ? input + cached + created : null;
    return { output: response.content?.filter((item) => item.type === 'text').map((item) => item.text).join('') || '',
      usage: { promptTokens: totalInput, uncachedPromptTokens: input, completionTokens: output, totalTokens: totalInput !== null && output !== null ? totalInput + output : null, cachedTokens: cached, cacheCreationTokens: created },
      model: response.model, duration: Date.now() - start, finishReason: response.stop_reason, serviceTier: null };
  }
  const client = new OpenAI({ ...getOpenAIClientConfig({ apiKey, baseURL, provider }), ...clientOptions });
  const messages = [...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []), ...(userPrompt ? [{ role: 'user', content: userPrompt }] : [])];
  const response = await client.chat.completions.create({ model, messages, temperature, max_tokens: maxTokens, top_p: topP,
    ...(standardTier && provider === 'openai' ? { service_tier: 'default' } : {}),
  }, { signal });
  return { output: response.choices?.[0]?.message?.content || '',
    usage: { promptTokens: tokens(response.usage?.prompt_tokens), completionTokens: tokens(response.usage?.completion_tokens),
      totalTokens: tokens(response.usage?.total_tokens), cachedTokens: tokens(response.usage?.prompt_tokens_details?.cached_tokens) },
    model: response.model, duration: Date.now() - start, finishReason: response.choices?.[0]?.message?.refusal ? 'refusal' : response.choices?.[0]?.finish_reason || null,
    serviceTier: response.service_tier || null };
}
