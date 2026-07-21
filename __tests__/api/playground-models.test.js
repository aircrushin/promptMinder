/**
 * @jest-environment node
 */

import { GET } from '@/app/api/playground/models/route.js'
import { requireUserId } from '@/lib/auth.js'
import { listModelsForProvider } from '@/lib/models-dev.js'

jest.mock('@/lib/auth.js', () => ({
  requireUserId: jest.fn(),
}))

jest.mock('@/lib/models-dev.js', () => ({
  listModelsForProvider: jest.fn(),
}))

describe('GET /api/playground/models', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requireUserId.mockResolvedValue('user-1')
  })

  it('缺少 provider 时应返回 400', async () => {
    const request = new Request('http://localhost/api/playground/models')
    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('应该返回模型列表', async () => {
    listModelsForProvider.mockResolvedValue({
      models: [{ value: 'gpt-4o', label: 'GPT-4o' }],
      source: 'models.dev',
      provider: 'openai',
      syncedAt: '2026-07-21T00:00:00.000Z',
    })

    const request = new Request('http://localhost/api/playground/models?provider=openai')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.models).toHaveLength(1)
    expect(listModelsForProvider).toHaveBeenCalledWith('openai', { force: false })
  })

  it('refresh=1 时应强制刷新', async () => {
    listModelsForProvider.mockResolvedValue({
      models: [],
      source: 'fallback',
      provider: 'openai',
      syncedAt: null,
    })

    const request = new Request('http://localhost/api/playground/models?provider=openai&refresh=1')
    await GET(request)
    expect(listModelsForProvider).toHaveBeenCalledWith('openai', { force: true })
  })
})
