import { NextResponse } from 'next/server'
import { ApiError } from './api-error.js'

function getDefaultCodeByStatus(status) {
  if (status === 400) return 'BAD_REQUEST'
  if (status === 401) return 'AUTH_REQUIRED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status >= 500) return 'INTERNAL_ERROR'
  return 'API_ERROR'
}

function resolveCode(error, status, defaultCode) {
  if (typeof error?.details === 'object' && typeof error.details?.code === 'string') {
    return error.details.code
  }

  return defaultCode || getDefaultCodeByStatus(status)
}

export function handleApiError(error, defaultMessage = 'Internal server error', defaultCode) {
  if (error instanceof ApiError) {
    const status = error.status || 500

    return NextResponse.json(
      {
        error: error.message,
        code: resolveCode(error, status, defaultCode)
      },
      { status }
    )
  }

  console.error('[API] Unexpected error:', error)
  return NextResponse.json(
    {
      error: defaultMessage,
      code: defaultCode || 'INTERNAL_ERROR'
    },
    { status: 500 }
  )
}
