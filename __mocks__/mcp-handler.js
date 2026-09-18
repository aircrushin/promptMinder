const createMcpHandler = jest.fn((initialize, options) => {
  const server = {
    registerTool: jest.fn(),
    registerPrompt: jest.fn(),
  }
  if (typeof initialize === 'function') {
    initialize(server)
  }
  const handler = jest.fn(async () => new Response('ok', { status: 200 }))
  handler.server = server
  handler.options = options
  return handler
})

const withMcpAuth = jest.fn((handler, verify) => async (request) => {
  request.auth = verify ? await verify(request, 'token') : undefined
  return handler(request)
})

module.exports = {
  createMcpHandler,
  withMcpAuth,
  experimental_withMcpAuth: withMcpAuth,
  protectedResourceHandler: jest.fn(),
  metadataCorsOptionsRequestHandler: jest.fn(),
}
