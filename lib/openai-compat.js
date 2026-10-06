export const ORCAROUTER_BASE_URL = 'https://api.orcarouter.ai/v1'
export const ORCAROUTER_SITE_URL = 'https://www.prompt-minder.com'
export const ORCAROUTER_APP_TITLE = 'PromptMinder'

export const ORCAROUTER_ATTRIBUTION_HEADERS = {
  'HTTP-Referer': ORCAROUTER_SITE_URL,
  'X-Title': ORCAROUTER_APP_TITLE,
}

function isPrivateIpv4(hostname) {
  const parts = hostname.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  const [first, second] = parts
  return first === 0 || first === 10 || first === 127
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
}

export function validateExternalBaseURL(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('A provider endpoint is required')
  let url
  try { url = new URL(value.trim()) } catch { throw new Error('Provider endpoint must be a valid URL') }
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (url.protocol !== 'https:') throw new Error('Provider endpoint must use HTTPS')
  if (url.username || url.password || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new Error('Provider endpoint is not allowed')
  }
  if (isPrivateIpv4(hostname) || hostname.includes(':')) {
    throw new Error('Provider endpoint is not allowed')
  }
  return url.href.replace(/\/+$/, '')
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
