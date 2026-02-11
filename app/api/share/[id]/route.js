import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { eq, and, desc } from 'drizzle-orm'
import { prompts } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

export async function GET(request, { params }) {
  const { id } = await params

  const rows = await db.select().from(prompts)
    .where(and(eq(prompts.id, id), eq(prompts.isPublic, true)))
    .limit(1)

  if (!rows[0]) {
    return NextResponse.json({ error: 'Prompt not found or not public' }, { status: 404 })
  }

  const prompt = toSnakeCase(rows[0])

  // Get all versions of this prompt
  const versionRows = await db
    .select({ id: prompts.id, version: prompts.version, createdAt: prompts.createdAt })
    .from(prompts)
    .where(and(eq(prompts.title, rows[0].title), eq(prompts.isPublic, true)))
    .orderBy(desc(prompts.createdAt))

  prompt.versions = versionRows.map(toSnakeCase)

  return NextResponse.json(prompt)
}
