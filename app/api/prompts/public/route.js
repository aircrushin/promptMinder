import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

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
        // 根据语言选择对应的文件
        const fileName = language === 'zh' ? 'prompts-cn.md' : 'prompts-en.md';
        const filePath = path.join(process.cwd(), 'public', fileName);
        
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        
        const allPrompts = parsePromptsFromFile(filePath, language);
        
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
        console.error('Error reading prompts file:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 