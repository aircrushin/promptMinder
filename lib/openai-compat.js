export const ORCAROUTER_BASE_URL = 'https://api.orcarouter.ai/v1'
export const ORCAROUTER_SITE_URL = 'https://www.prompt-minder.com'
export const ORCAROUTER_APP_TITLE = 'PromptMinder'

export const ORCAROUTER_ATTRIBUTION_HEADERS = {
  'HTTP-Referer': ORCAROUTER_SITE_URL,
  'X-Title': ORCAROUTER_APP_TITLE,
}

export function isOrcaRouterEndpoint(provider, baseURL = '') {
  if ((provider || '').toLowerCase() === 'orcarouter') {
    return true
  }

  if (!baseURL || typeof baseURL !== 'string') {
    return false
  }

  try {
    const host = new URL(baseURL).hostname.toLowerCase()
    return host === 'api.orcarouter.ai' || host.endsWith('.orcarouter.ai')
  } catch {
    return baseURL.toLowerCase().includes('orcarouter.ai')
  }
}

export function getOpenAIClientConfig({ apiKey, baseURL, provider } = {}) {
  const config = { apiKey, baseURL }
  if (isOrcaRouterEndpoint(provider, baseURL)) {
    config.defaultHeaders = { ...ORCAROUTER_ATTRIBUTION_HEADERS }
  }
  return config
}
