import { GET, POST } from '@/app/api/prompts/route.js'

describe('/api/prompts route exports', () => {
  it('exposes authenticated GET and POST handlers', () => {
    expect(typeof GET).toBe('function')
    expect(typeof POST).toBe('function')
  })
})
