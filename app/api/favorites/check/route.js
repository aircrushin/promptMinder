import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth.js';
import { queries } from '@/lib/db/index.js';
import { handleApiError } from '@/lib/handle-api-error.js';

export async function GET(request) {
  try {
    const userId = await requireUserId();

    const { searchParams } = new URL(request.url);
    const promptIdsParam = searchParams.get('promptIds');

    if (!promptIdsParam) {
      return NextResponse.json({ favorites: {} });
    }

    const ids = promptIdsParam.split(',').filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ favorites: {} });
    }

    const favoritesMap = await queries.favorites.checkFavorites(userId, ids);

    return NextResponse.json({ favorites: favoritesMap });
  } catch (error) {
    return handleApiError(error, 'Unable to check favorites');
  }
}
