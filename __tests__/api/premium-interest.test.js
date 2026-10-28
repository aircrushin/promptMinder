/** @jest-environment node */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/premium-interest/route';
import { db } from '@/lib/db';
import { buildInterestSummary, reportCsv } from '@/lib/premium-interest-report';
import { createAdminToken } from '@/lib/admin-auth.js';

jest.mock('@/lib/db', () => ({ db: { select: jest.fn() } }));
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('@/drizzle/schema/index.js', () => ({ premiumCollectionInterest: {} }));

describe('premium interest report', () => {
  const original = process.env.ADMIN_EMAILS;
  beforeEach(() => { jest.clearAllMocks(); process.env.ADMIN_EMAILS = 'admin@example.com'; process.env.ADMIN_TOKEN_SECRET = 'test-admin-token-secret'; });
  afterAll(() => { if (original === undefined) delete process.env.ADMIN_EMAILS; else process.env.ADMIN_EMAILS = original; delete process.env.ADMIN_TOKEN_SECRET; });
  const request = (email, timestamp) => new NextRequest('http://localhost/api/premium-interest', {
    headers: email ? { 'x-admin-email': email, 'x-admin-token': createAdminToken(email, timestamp) } : {},
  });
  it.each([[undefined, 401], ['user@example.com', 403]])('rejects %s before database access', async (email, status) => {
    expect((await GET(request(email))).status).toBe(status);
    expect(db.select).not.toHaveBeenCalled();
  });
  it('rejects expired admin credentials before database access', async () => {
    expect((await GET(request('admin@example.com', Date.now() - 86400001))).status).toBe(401);
    expect(db.select).not.toHaveBeenCalled();
  });
  it('returns full summary and limits latest to 100 for administrators without caching', async () => {
    const summary = [{ skillSlug: 'prompt-architect', interestLevel: 'notify', total: 102 }];
    const latest = [{ id: 'registration', source: '/skills' }];
    const limit = jest.fn().mockResolvedValue(latest);
    const latestOrder = jest.fn().mockReturnValue({ limit });
    db.select.mockReturnValueOnce({ from: () => ({ groupBy: () => ({ orderBy: () => Promise.resolve(summary) }) }) })
      .mockReturnValueOnce({ from: () => ({ orderBy: latestOrder }) });
    const response = await GET(request('admin@example.com'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ summary, latest });
    expect(limit).toHaveBeenCalledWith(100);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('includes zero-count skills, converts counts and keeps unknown historical skills', () => {
    const rows = buildInterestSummary([
      { skillSlug: 'prompt-architect', interestLevel: 'notify', total: '2' },
      { skillSlug: 'prompt-architect', interestLevel: 'ready_to_buy', total: 3 },
      { skillSlug: 'retired', interestLevel: 'early_access', total: 1 },
    ]);
    expect(rows[0]).toMatchObject({ total: 5, counts: { notify: 2, early_access: 0, ready_to_buy: 3 } });
    expect(rows.find((row) => row.skillSlug === 'evaluation-lab').total).toBe(0);
    expect(rows.find((row) => row.skillSlug === 'retired').total).toBe(1);
  });
  it('exports Unicode CSV with quotes, newlines and formula protection', () => {
    expect(reportCsv([['来源', 'a,"b"\nc', '=SUM(1)', '  +cmd', '@x', null]]))
      .toBe('\uFEFF"来源","a,""b""\nc","\'=SUM(1)","\'  +cmd","\'@x",""');
  });
});
