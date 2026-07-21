import providerOptions from '@/components/playground/providerOptions.json'

export const MODELS_DEV_API_URL = 'https://models.dev/api.json'

export const PROVIDER_TO_MODELS_DEV = {
  openai: 'openai',
  gemini: 'google',
  claude: 'anthropic',
  deepseek: 'deepseek',
  zhipu: 'zhipuai',
  kimi: 'moonshotai-cn',
  minimax: 'minimax-cn',
  qwen: 'alibaba-cn',
  siliconflow: 'siliconflow-cn',
  stepfun: 'stepfun',
  xai: 'xai',
  openrouter: 'openrouter',
  requesty: 'requesty',
}

const NON_CHAT_PATTERN =
  /(embedding|whisper|tts|realtime|moderation|dall-e|dalle|image|transcribe|speech|audio-only|codex-mini|asr|stepaudio)/i

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000
const OPENROUTER_LIMIT = 150

let cache = {
  data: null,
  fetchedAt: 0,
  expiresAt: 0,
}

export function resetModelsDevCache() {
  cache = { data: null, fetchedAt: 0, expiresAt: 0 }
}

function getTtlMs() {
  const raw = Number.parseInt(process.env.MODELS_DEV_CACHE_TTL_MS || '', 10)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TTL_MS
}

export function getSeedModels(provider) {
  const config = providerOptions.find((item) => item.value === provider)
  return (config?.models || []).map((model) => ({
    value: model.value,
    label: model.label || model.value,
  }))
}

export function isChatModel(model) {
  if (!model?.id) return false
  if (NON_CHAT_PATTERN.test(model.id) || NON_CHAT_PATTERN.test(model.name || '')) {
    return false
  }
  const outputs = model.modalities?.output
  if (Array.isArray(outputs) && outputs.length > 0 && !outputs.includes('text')) {
    return false
  }
  return true
}

export function normalizeModelsDevModels(modelsMap, { limit } = {}) {
  const models = Object.values(modelsMap || {})
    .filter(isChatModel)
    .map((model) => ({
      value: model.id,
      label: model.name || model.id,
      releaseDate: model.release_date || null,
    }))
    .sort((a, b) => {
      if (a.releaseDate && b.releaseDate && a.releaseDate !== b.releaseDate) {
        return a.releaseDate < b.releaseDate ? 1 : -1
      }
      return a.label.localeCompare(b.label)
    })

  if (limit && models.length > limit) {
    return models.slice(0, limit)
  }
  return models
}

export async function fetchModelsDevCatalog({ force = false, fetchImpl = fetch } = {}) {
  const now = Date.now()
  if (!force && cache.data && now < cache.expiresAt) {
    return { catalog: cache.data, source: 'cache', syncedAt: new Date(cache.fetchedAt).toISOString() }
  }

  try {
    const response = await fetchImpl(MODELS_DEV_API_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: Math.floor(getTtlMs() / 1000) },
    })
    if (!response.ok) {
      throw new Error(`models.dev returned ${response.status}`)
    }
    const catalog = await response.json()
    cache = {
      data: catalog,
      fetchedAt: now,
      expiresAt: now + getTtlMs(),
    }
    return { catalog, source: 'models.dev', syncedAt: new Date(now).toISOString() }
  } catch (error) {
    if (cache.data) {
      return {
        catalog: cache.data,
        source: 'cache',
        syncedAt: new Date(cache.fetchedAt).toISOString(),
        error: error.message,
      }
    }
    throw error
  }
}

export async function listModelsForProvider(provider, { force = false, fetchImpl = fetch } = {}) {
  if (!provider || provider === 'custom' || !PROVIDER_TO_MODELS_DEV[provider]) {
    return {
      models: getSeedModels(provider),
      source: 'fallback',
      provider,
      syncedAt: null,
    }
  }

  try {
    const { catalog, source, syncedAt } = await fetchModelsDevCatalog({ force, fetchImpl })
    const modelsDevId = PROVIDER_TO_MODELS_DEV[provider]
    const providerCatalog = catalog?.[modelsDevId]
    if (!providerCatalog?.models) {
      return {
        models: getSeedModels(provider),
        source: 'fallback',
        provider,
        syncedAt,
      }
    }

    const limit = provider === 'openrouter' ? OPENROUTER_LIMIT : undefined
    const models = normalizeModelsDevModels(providerCatalog.models, { limit })
    if (models.length === 0) {
      return {
        models: getSeedModels(provider),
        source: 'fallback',
        provider,
        syncedAt,
      }
    }

    return { models, source, provider, syncedAt }
  } catch (error) {
    console.error('models.dev catalog error:', error)
    return {
      models: getSeedModels(provider),
      source: 'fallback',
      provider,
      syncedAt: null,
      error: error.message,
    }
  }
}
