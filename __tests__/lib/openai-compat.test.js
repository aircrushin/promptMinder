import {
  getOpenAIClientConfig,
  isOrcaRouterEndpoint,
  ORCAROUTER_ATTRIBUTION_HEADERS,
  ORCAROUTER_BASE_URL,
  validateExternalBaseURL,
} from '@/lib/openai-compat'

describe('openai-compat', () => {
  describe('isOrcaRouterEndpoint', () => {
    it('应该识别 orcarouter provider', () => {
      expect(isOrcaRouterEndpoint('orcarouter')).toBe(true)
      expect(isOrcaRouterEndpoint('OrcaRouter')).toBe(true)
    })

    it('应该识别 OrcaRouter 主机名', () => {
      expect(isOrcaRouterEndpoint('custom', ORCAROUTER_BASE_URL)).toBe(true)
      expect(isOrcaRouterEndpoint('', 'https://api.orcarouter.ai/v1/chat')).toBe(true)
    })

    it('不应该把其他服务商当成 OrcaRouter', () => {
      expect(isOrcaRouterEndpoint('openai', 'https://api.openai.com/v1')).toBe(false)
      expect(isOrcaRouterEndpoint('openrouter', 'https://api.openrouter.ai/v1')).toBe(false)
      expect(isOrcaRouterEndpoint('', '')).toBe(false)
    })
  })

  describe('getOpenAIClientConfig', () => {
    it('应该为 OrcaRouter 注入 attribution headers', () => {
      expect(getOpenAIClientConfig({
        apiKey: 'sk-orca-test',
        baseURL: ORCAROUTER_BASE_URL,
        provider: 'orcarouter',
      })).toEqual({
        apiKey: 'sk-orca-test',
        baseURL: ORCAROUTER_BASE_URL,
        defaultHeaders: ORCAROUTER_ATTRIBUTION_HEADERS,
      })
    })

    it('其他端点不应附加 attribution headers', () => {
      expect(getOpenAIClientConfig({
        apiKey: 'sk-test',
        baseURL: 'https://api.openai.com/v1',
        provider: 'openai',
      })).toEqual({
        apiKey: 'sk-test',
        baseURL: 'https://api.openai.com/v1',
      })
    })
  })

  describe('validateExternalBaseURL', () => {
    it('应该拒绝非 HTTPS 和本地 endpoint', () => {
      expect(() => validateExternalBaseURL('http://example.com/v1')).toThrow()
      expect(() => validateExternalBaseURL('https://127.0.0.1/v1')).toThrow()
      expect(() => validateExternalBaseURL('https://[::1]/v1')).toThrow()
    })

    it('应该保留安全的 HTTPS endpoint 并去掉尾部斜杠', () => {
      expect(validateExternalBaseURL('https://api.example.com/v1///')).toBe('https://api.example.com/v1')
    })
  })
})
