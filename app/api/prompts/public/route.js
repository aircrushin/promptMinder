import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { auth } from '@clerk/nextjs/server'
import { eq, and, desc, asc, inArray, count as countFn } from 'drizzle-orm'
import { publicPrompts, promptLikes } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('lang') || 'zh'
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    try {
        const { userId } = await auth()

        // Build where conditions
        const conditions = [eq(publicPrompts.language, language)]
        if (category) {
            conditions.push(eq(publicPrompts.category, category))
        }
        const whereCondition = and(...conditions)

        // Count total
        const countResult = await db.select({ value: countFn() }).from(publicPrompts).where(whereCondition)
        const total = countResult[0]?.value || 0
        const totalPages = Math.ceil(total / pageSize)
        const currentPage = Math.max(1, Math.min(page, totalPages || 1))
        const offset = (currentPage - 1) * pageSize

        // Determine sort
        const validSortFields = { created_at: publicPrompts.createdAt, likes: publicPrompts.likes }
        const orderCol = validSortFields[sortBy] || publicPrompts.createdAt
        const orderFn = sortOrder === 'asc' ? asc : desc

        // Fetch data
        const dataRows = await db
            .select({
                id: publicPrompts.id,
                title: publicPrompts.title,
                roleCategory: publicPrompts.roleCategory,
                content: publicPrompts.content,
                category: publicPrompts.category,
                createdAt: publicPrompts.createdAt,
                likes: publicPrompts.likes,
            })
            .from(publicPrompts)
            .where(whereCondition)
            .orderBy(orderFn(orderCol))
            .limit(pageSize)
            .offset(offset)

        // Get user liked status
        let userLikedPrompts = new Set()
        if (userId && dataRows.length > 0) {
            const promptIds = dataRows.map(p => p.id)
            const likesData = await db
                .select({ promptId: promptLikes.promptId })
                .from(promptLikes)
                .where(and(eq(promptLikes.userId, userId), inArray(promptLikes.promptId, promptIds)))

            userLikedPrompts = new Set(likesData.map(l => l.promptId))
        }

        // Transform to frontend format
        const promptsList = dataRows.map(p => ({
            id: p.id,
            category: p.category || (language === 'zh' ? '通用' : 'General'),
            role: p.roleCategory || p.title,
            prompt: p.content,
            title: p.title,
            created_at: p.createdAt,
            likes: p.likes || 0,
            userLiked: userLikedPrompts.has(p.id)
        }))

        // Get all categories
        const categoriesData = await db
            .select({ category: publicPrompts.category })
            .from(publicPrompts)
            .where(eq(publicPrompts.language, language))

        const categories = [...new Set(categoriesData.map(c => c.category).filter(Boolean))]

        return NextResponse.json({
            prompts: promptsList,
            categories,
            language,
            pagination: {
                total,
                totalPages,
                currentPage,
                pageSize,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1
            }
        })
    } catch (error) {
        console.error('Error in public prompts API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
