import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { auth } from '@clerk/nextjs/server'
import { eq, and, sql } from 'drizzle-orm'
import { publicPrompts, promptLikes } from '@/drizzle/schema/index.js'

export async function POST(request) {
    try {
        const { promptId } = await request.json()

        if (!promptId) {
            return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
        }

        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if already liked
        const existing = await db.select({ id: promptLikes.id }).from(promptLikes)
            .where(and(eq(promptLikes.promptId, promptId), eq(promptLikes.userId, userId)))
            .limit(1)

        if (existing[0]) {
            return NextResponse.json({ success: true, message: 'Already liked', liked: true })
        }

        // Insert like
        await db.insert(promptLikes).values({ promptId, userId })

        // Increment likes count
        const result = await db
            .update(publicPrompts)
            .set({
                likes: sql`${publicPrompts.likes} + 1`,
                updatedAt: new Date(),
            })
            .where(eq(publicPrompts.id, promptId))
            .returning({ likes: publicPrompts.likes })

        return NextResponse.json({
            success: true,
            liked: true,
            likes: result[0]?.likes || 0
        })
    } catch (error) {
        console.error('Error liking prompt:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const promptId = searchParams.get('promptId')

        if (!promptId) {
            return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
        }

        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Delete like
        await db.delete(promptLikes)
            .where(and(eq(promptLikes.promptId, promptId), eq(promptLikes.userId, userId)))

        // Decrement likes count
        const result = await db
            .update(publicPrompts)
            .set({
                likes: sql`GREATEST(${publicPrompts.likes} - 1, 0)`,
                updatedAt: new Date(),
            })
            .where(eq(publicPrompts.id, promptId))
            .returning({ likes: publicPrompts.likes })

        return NextResponse.json({
            success: true,
            liked: false,
            likes: result[0]?.likes || 0
        })
    } catch (error) {
        console.error('Error unliking prompt:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
