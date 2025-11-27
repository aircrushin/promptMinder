export class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function assert(condition, status, message, details) {
  if (!condition) {
    throw new ApiError(status, message, details)
  }
}
