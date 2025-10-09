import { NextResponse } from 'next/server'
import { ApiError } from './api-error.js'

export function handleApiError(error, defaultMessage = 'Internal server error') {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details
      },
      { status: error.status }
    )
  }

  console.error('[API] Unexpected error:', error)
  return NextResponse.json({ error: defaultMessage }, { status: 500 })
}
