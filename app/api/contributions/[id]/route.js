import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { eq } from 'drizzle-orm'
import { promptContributions, publicPrompts } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

export async function GET(request, { params }) {
  const { id } = await params

  try {
    const rows = await db.select().from(promptContributions).where(eq(promptContributions.id, id)).limit(1)

    if (!rows[0]) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 })
    }

    return NextResponse.json(toSnakeCase(rows[0]))
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  const { id } = await params
  const adminEmail = request.headers.get('x-admin-email')

  try {
    const { status, adminNotes, publishToPrompts } = await request.json()

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const existing = await db.select().from(promptContributions).where(eq(promptContributions.id, id)).limit(1)
    if (!existing[0]) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 })
    }

    const existingContribution = existing[0]

    const updateData = {
      status,
      adminNotes: adminNotes || null,
      reviewedAt: new Date(),
      reviewedBy: adminEmail || 'admin',
      updatedAt: new Date(),
    }

    let publishedPromptId = null
    if (status === 'approved' && publishToPrompts) {
      const contributionLanguage = existingContribution.language || 'zh'
      const publicResult = await db.insert(publicPrompts).values({
        title: existingContribution.title,
        roleCategory: existingContribution.roleCategory,
        content: existingContribution.content,
        category: contributionLanguage === 'zh' ? '社区贡献' : 'Community',
        language: contributionLanguage,
        createdBy: existingContribution.contributorEmail || null,
      }).returning()

      publishedPromptId = publicResult[0].id
      updateData.publishedPromptId = publishedPromptId
    }

    const result = await db.update(promptContributions).set(updateData)
      .where(eq(promptContributions.id, id)).returning()

    return NextResponse.json({
      message: 'Contribution updated successfully',
      contribution: toSnakeCase(result[0]),
      publishedPromptId
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params

  try {
    const rows = await db.select({ id: promptContributions.id }).from(promptContributions)
      .where(eq(promptContributions.id, id)).limit(1)

    if (!rows[0]) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 })
    }

    await db.delete(promptContributions).where(eq(promptContributions.id, id))

    return NextResponse.json({ message: 'Contribution deleted successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
