import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'zh';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    try {
        const supabase = createSupabaseServerClient();
        
        // 获取总数
        const { count, error: countError } = await supabase
            .from('public_prompts')
            .select('*', { count: 'exact', head: true })
            .eq('language', language);

        if (countError) {
            throw countError;
        }

        const total = count || 0;
        const totalPages = Math.ceil(total / pageSize);
        const currentPage = Math.max(1, Math.min(page, totalPages || 1));
        const offset = (currentPage - 1) * pageSize;

        // 获取分页数据
        const { data: publicPrompts, error } = await supabase
            .from('public_prompts')
            .select('id, title, role_category, content, category, created_at')
            .eq('language', language)
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1);

        if (error) {
            throw error;
        }

        // 转换为前端期望的格式
        const prompts = (publicPrompts || []).map(p => ({
            id: p.id,
            category: p.category || (language === 'zh' ? '通用' : 'General'),
            role: p.role_category || p.title,
            prompt: p.content,
            title: p.title,
            created_at: p.created_at
        }));

        return NextResponse.json({
            prompts,
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