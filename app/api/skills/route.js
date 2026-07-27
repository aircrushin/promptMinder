import { NextResponse } from 'next/server'
import { listCatalogSkills } from '@/lib/skills-catalog'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const parsedPage = Number.parseInt(searchParams.get('page') || '1', 10)
  const result = await listCatalogSkills({
    search: searchParams.get('q') || '',
    sort: searchParams.get('sort') === 'latest' ? 'latest' : 'popular',
    page: Number.isInteger(parsedPage) ? Math.max(1, parsedPage) : 1,
  })

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
