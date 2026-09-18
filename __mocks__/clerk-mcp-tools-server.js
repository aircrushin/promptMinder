module.exports = {
  generateClerkProtectedResourceMetadata: jest.fn(() => ({
    resource: 'https://www.prompt-minder.com/mcp',
    authorization_servers: ['https://clerk.example'],
  })),
  fetchClerkAuthorizationServerMetadata: jest.fn(async () => ({
    issuer: 'https://clerk.example',
  })),
}
