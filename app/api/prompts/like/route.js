import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { auth } from '@clerk/nextjs/server';

// POST - 点赞提示词
export async function POST(request) {
    try {
        const { promptId } = await request.json();

        if (!promptId) {
            return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
        }

        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createSupabaseServerClient();

        // 检查是否已经点赞
        const { data: existingLike } = await supabase
            .from('prompt_likes')
            .select('id')
            .eq('prompt_id', promptId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existingLike) {
            return NextResponse.json({
                success: true,
                message: 'Already liked',
                liked: true
            });
        }

        // 在事务中插入点赞记录并增加计数
        const { data: likeData, error: likeError } = await supabase
            .from('prompt_likes')
            .insert({ prompt_id: promptId, user_id: userId })
            .select('id')
            .single();

        if (likeError) {
            throw likeError;
        }

        // 增加点赞数
        const { data: promptData, error: fetchError } = await supabase
            .from('public_prompts')
            .select('likes')
            .eq('id', promptId)
            .single();

        if (fetchError) {
            throw fetchError;
        }

        const currentLikes = promptData?.likes || 0;

        const { data: updatedData, error: updateError } = await supabase
            .from('public_prompts')
            .update({ likes: currentLikes + 1, updated_at: new Date().toISOString() })
            .eq('id', promptId)
            .select('likes')
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            liked: true,
            likes: updatedData.likes
        });
    } catch (error) {
        console.error('Error liking prompt:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - 取消点赞
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const promptId = searchParams.get('promptId');

        if (!promptId) {
            return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
        }

        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createSupabaseServerClient();

        // 删除点赞记录
        const { error: deleteError } = await supabase
            .from('prompt_likes')
            .delete()
            .eq('prompt_id', promptId)
            .eq('user_id', userId);

        if (deleteError) {
            throw deleteError;
        }

        // 减少点赞数
        const { data: promptData, error: fetchError } = await supabase
            .from('public_prompts')
            .select('likes')
            .eq('id', promptId)
            .single();

        if (fetchError) {
            throw fetchError;
        }

        const currentLikes = promptData?.likes || 0;

        const { data: updatedData, error: updateError } = await supabase
            .from('public_prompts')
            .update({ likes: Math.max(0, currentLikes - 1), updated_at: new Date().toISOString() })
            .eq('id', promptId)
            .select('likes')
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            liked: false,
            likes: updatedData.likes
        });
    } catch (error) {
        console.error('Error unliking prompt:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
