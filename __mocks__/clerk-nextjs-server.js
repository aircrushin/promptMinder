const auth = jest.fn().mockResolvedValue({ userId: 'test-user-id' })
const clerkClient = jest.fn().mockResolvedValue({
  users: {
    getUserList: jest.fn().mockResolvedValue({ data: [] }),
    getUser: jest.fn().mockResolvedValue(null),
  },
})
const currentUser = jest.fn().mockResolvedValue(null)
const clerkMiddleware = jest.fn((handler) => handler)
const createRouteMatcher = jest.fn(() => () => false)

module.exports = {
  auth,
  clerkClient,
  currentUser,
  clerkMiddleware,
  createRouteMatcher,
}
