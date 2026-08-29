/**
 * @jest-environment node
 */

import {
  getSeedModels,
  isChatModel,
  listModelsForProvider,
  normalizeModelsDevModels,
  resetModelsDevCache,
  PROVIDER_TO_MODELS_DEV,
} from '@/lib/models-dev.js'

describe('models-dev', () => {
  beforeEach(() => {
    resetModelsDevCache()
  })

  it('应该映射 playground provider 到 models.dev id', () => {
    expect(PROVIDER_TO_MODELS_DEV.gemini).toBe('google')
    expect(PROVIDER_TO_MODELS_DEV.claude).toBe('anthropic')
    expect(PROVIDER_TO_MODELS_DEV.zhipu).toBe('zhipuai')
    expect(PROVIDER_TO_MODELS_DEV.kimi).toBe('moonshotai-cn')
    expect(PROVIDER_TO_MODELS_DEV.minimax).toBe('minimax-cn')
    expect(PROVIDER_TO_MODELS_DEV.qwen).toBe('alibaba-cn')
    expect(PROVIDER_TO_MODELS_DEV.siliconflow).toBe('siliconflow-cn')
    expect(PROVIDER_TO_MODELS_DEV.stepfun).toBe('stepfun')
    expect(PROVIDER_TO_MODELS_DEV.xai).toBe('xai')
    expect(PROVIDER_TO_MODELS_DEV.orcarouter).toBe('orcarouter')
    expect(PROVIDER_TO_MODELS_DEV.doubao).toBeUndefined()
  })

  it('应该过滤非文本对话模型', () => {
    expect(isChatModel({ id: 'gpt-4o', name: 'GPT-4o', modalities: { output: ['text'] } })).toBe(true)
    expect(isChatModel({ id: 'whisper-1', name: 'Whisper', modalities: { output: ['text'] } })).toBe(false)
    expect(isChatModel({ id: 'gpt-image-1', name: 'Image', modalities: { output: ['image'] } })).toBe(false)
    expect(isChatModel({ id: 'tts-1', name: 'TTS', modalities: { output: ['audio'] } })).toBe(false)
  })

  it('应该规范化并排序模型列表', () => {
    const models = normalizeModelsDevModels({
      'gpt-old': {
        id: 'gpt-old',
        name: 'Old',
        release_date: '2024-01-01',
        modalities: { output: ['text'] },
      },
      'gpt-new': {
        id: 'gpt-new',
        name: 'New',
        release_date: '2025-06-01',
        modalities: { output: ['text'] },
      },
      'whisper-1': {
        id: 'whisper-1',
        name: 'Whisper',
        release_date: '2025-07-01',
        modalities: { output: ['text'] },
      },
    })

    expect(models.map((m) => m.value)).toEqual(['gpt-new', 'gpt-old'])
    expect(models[0].label).toBe('New')
  })

  it('orcarouter 无目录时应回退免费模型 seed', () => {
    const seeds = getSeedModels('orcarouter')
    expect(seeds.map((model) => model.value)).toEqual([
      'orcarouter/free',
      'orcarouter/auto',
      'deepseek/deepseek-v4-flash-free',
      'openai/gpt-4o-mini',
    ])
  })

  it('doubao 无 models.dev 映射时应回退 seed', async () => {
    const result = await listModelsForProvider('doubao')
    expect(result.source).toBe('fallback')
    expect(result.models.length).toBeGreaterThan(0)
    expect(result.models[0].value).toMatch(/^doubao-/)
  })

  it('应该从 models.dev 返回 orcarouter 模型', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        orcarouter: {
          models: {
            'orcarouter/free': {
              id: 'orcarouter/free',
              name: 'OrcaRouter Free',
              release_date: '2026-01-01',
              modalities: { output: ['text'] },
            },
            'kling/kling-v3-omni': {
              id: 'kling/kling-v3-omni',
              name: 'Kling Video',
              modalities: { output: ['video'] },
            },
          },
        },
      }),
    })

    const result = await listModelsForProvider('orcarouter', { fetchImpl })
    expect(result.source).toBe('models.dev')
    expect(result.models).toEqual([
      { value: 'orcarouter/free', label: 'OrcaRouter Free', releaseDate: '2026-01-01' },
    ])
  })

  it('应该从 models.dev 目录返回模型', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        openai: {
          models: {
            'gpt-4o': {
              id: 'gpt-4o',
              name: 'GPT-4o',
              release_date: '2024-05-01',
              modalities: { output: ['text'] },
            },
            'tts-1': {
              id: 'tts-1',
              name: 'TTS',
              modalities: { output: ['audio'] },
            },
          },
        },
      }),
    })

    const result = await listModelsForProvider('openai', { fetchImpl })
    expect(result.source).toBe('models.dev')
    expect(result.models).toEqual([{ value: 'gpt-4o', label: 'GPT-4o', releaseDate: '2024-05-01' }])
    expect(fetchImpl).toHaveBeenCalled()
  })

  it('拉取失败时应回退到 seed', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('network down'))
    const result = await listModelsForProvider('openai', { fetchImpl })
    expect(result.source).toBe('fallback')
    expect(result.models).toEqual(getSeedModels('openai'))
  })

  it('第二次调用应命中缓存', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        deepseek: {
          models: {
            'deepseek-chat': {
              id: 'deepseek-chat',
              name: 'DeepSeek Chat',
              modalities: { output: ['text'] },
            },
          },
        },
      }),
    })

    await listModelsForProvider('deepseek', { fetchImpl })
    await listModelsForProvider('deepseek', { fetchImpl })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
