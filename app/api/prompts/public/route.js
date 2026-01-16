import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { auth } from '@clerk/nextjs/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'zh';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    try {
        const { userId } = await auth();
        const supabase = createSupabaseServerClient();
        
        // 构建查询条件
        let countQuery = supabase
            .from('public_prompts')
            .select('*', { count: 'exact', head: true })
            .eq('language', language);
        
        if (category) {
            countQuery = countQuery.eq('category', category);
        }

        const { count, error: countError } = await countQuery;

        if (countError) {
            throw countError;
        }

        const total = count || 0;
        const totalPages = Math.ceil(total / pageSize);
        const currentPage = Math.max(1, Math.min(page, totalPages || 1));
        const offset = (currentPage - 1) * pageSize;

        // 获取分页数据
        let dataQuery = supabase
            .from('public_prompts')
            .select('id, title, role_category, content, category, created_at, likes')
            .eq('language', language);
        
        if (category) {
            dataQuery = dataQuery.eq('category', category);
        }

        const { data: publicPrompts, error } = await dataQuery
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1);

        if (error) {
            throw error;
        }

        // 获取用户的点赞状态（如果用户已登录）
        let userLikedPrompts = new Set();
        if (userId && publicPrompts && publicPrompts.length > 0) {
            const promptIds = publicPrompts.map(p => p.id);
            const { data: likesData } = await supabase
                .from('prompt_likes')
                .select('prompt_id')
                .eq('user_id', userId)
                .in('prompt_id', promptIds);

            userLikedPrompts = new Set((likesData || []).map(l => l.prompt_id));
        }

        // 转换为前端期望的格式
        const prompts = (publicPrompts || []).map(p => ({
            id: p.id,
            category: p.category || (language === 'zh' ? '通用' : 'General'),
            role: p.role_category || p.title,
            prompt: p.content,
            title: p.title,
            created_at: p.created_at,
            likes: p.likes || 0,
            userLiked: userLikedPrompts.has(p.id)
        }));

        // 获取所有分类（用于筛选器）
        const { data: categoriesData } = await supabase
            .from('public_prompts')
            .select('category')
            .eq('language', language);

        const categories = [...new Set((categoriesData || []).map(c => c.category).filter(Boolean))];

        return NextResponse.json({
            prompts,
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
        });
    } catch (error) {
        console.error('Error in public prompts API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 