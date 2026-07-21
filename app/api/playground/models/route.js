import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { listModelsForProvider } from '@/lib/models-dev'

export async function GET(request) {
  try {
    await requireUserId()

    const { searchParams } = new URL(request.url)
    const provider = (searchParams.get('provider') || '').trim().toLowerCase()
    const force = searchParams.get('refresh') === '1'

    if (!provider) {
      return NextResponse.json({ error: 'provider is required' }, { status: 400 })
    }

    const result = await listModelsForProvider(provider, { force })
    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/playground/models error:', error)
    const status = error.status || 500
    return NextResponse.json(
      { error: error.message || 'Failed to load models' },
      { status }
    )
  }
}
