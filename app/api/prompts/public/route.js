import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const parsePromptsFromFile = (filePath, language) => {
    const markdownContent = fs.readFileSync(filePath, 'utf-8');
    const prompts = [];
    const sections = markdownContent.split('### ').slice(1);

    sections.forEach(section => {
        const lines = section.split('\n');
        const category = lines[0].trim();
        const promptsText = lines.slice(1).join('\n');
        
        // 根据语言选择不同的解析模式
        let promptBlocks;
        let promptPattern;
        
        if (language === 'zh') {
            // 中文格式解析
            promptBlocks = promptsText.split('- **角色/类别**: ').slice(1);
            promptPattern = '**提示词**: ';
        } else {
            // 英文格式解析
            promptBlocks = promptsText.split('- **角色/类别**: ').slice(1);
            promptPattern = '**提示词**: ';
        }
        
        promptBlocks.forEach(block => {
            const blockLines = block.split('\n');
            const role = blockLines[0].trim();
            
            const prompt = blockLines.slice(1).join('\n').replace(promptPattern, '').trim();
            
            if (role && prompt) {
                prompts.push({
                    category,
                    role,
                    prompt
                });
            }
        });
    });

    return prompts;
};

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'zh';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    try {
        let allPrompts = [];

        // 1. 从 markdown 文件读取提示词
        const fileName = language === 'zh' ? 'prompts-cn.md' : 'prompts-en.md';
        const filePath = path.join(process.cwd(), 'public', fileName);

        if (fs.existsSync(filePath)) {
            allPrompts = parsePromptsFromFile(filePath, language);
        }

        // 2. 从数据库获取数据
        try {
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY
            );

            // 2.1 从 public_prompts 表获取管理员添加的公开提示词
            const { data: publicPrompts, error: publicError } = await supabase
                .from('public_prompts')
                .select('title, role_category, content, category')
                .eq('language', language)
                .order('created_at', { ascending: false });

            if (!publicError && publicPrompts) {
                const dbPrompts = publicPrompts.map(p => ({
                    category: p.category || (language === 'zh' ? '通用' : 'General'),
                    role: p.role_category || p.title,
                    prompt: p.content
                }));
                allPrompts = [...dbPrompts, ...allPrompts];
            }

            // 2.2 从已发布的贡献提示词获取
            const { data: publishedContributions, error } = await supabase
                .from('prompt_contributions')
                .select('title, role_category, content')
                .not('published_prompt_id', 'is', null)
                .eq('status', 'approved');

            if (!error && publishedContributions) {
                // 将数据库中的贡献转换为与 markdown 相同的格式
                const contributionPrompts = publishedContributions.map(contrib => ({
                    category: language === 'zh' ? '社区贡献' : 'Community Contributions',
                    role: contrib.role_category,
                    prompt: contrib.content
                }));

                // 合并两个来源的提示词
                allPrompts = [...allPrompts, ...contributionPrompts];
            }
        } catch (dbError) {
            console.error('Error fetching prompts from database:', dbError);
            // 即使数据库查询失败，仍然返回 markdown 文件中的提示词
        }

        // 计算分页
        const total = allPrompts.length;
        const totalPages = Math.ceil(total / pageSize);
        const currentPage = Math.max(1, Math.min(page, totalPages || 1));
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const prompts = allPrompts.slice(startIndex, endIndex);

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