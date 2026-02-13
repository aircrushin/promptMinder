export class ApiError extends Error {
  status: number;
  details: any;

  constructor(status: number, message: string, details: any = undefined) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function assert(condition: any, status: number, message: string, details?: any): asserts condition {
  if (!condition) {
    throw new ApiError(status, message, details)
  }
}
