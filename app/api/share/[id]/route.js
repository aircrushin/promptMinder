import { NextResponse } from 'next/server';
import { queries } from '@/lib/db/index.js';

export async function GET(request, { params }) {
  const { id } = params;
  
  try {
    // 获取公开的提示词
    const prompt = await queries.prompts.getById(id);
    
    if (!prompt || !prompt.isPublic) {
      return NextResponse.json({ error: 'Prompt not found or not public' }, { status: 404 });
    }

    // 获取该提示词的所有版本
    const versions = await queries.promptVersions.getByPromptId(id);

    // 转换为前端期望的格式
    const formattedVersions = versions.map(v => ({
      id: v.id,
      version: v.version,
      created_at: v.createdAt,
    }));

    // Attach versions to the prompt object
    const result = {
      ...prompt,
      created_at: prompt.createdAt,
      updated_at: prompt.updatedAt,
      is_public: prompt.isPublic,
      versions: formattedVersions || []
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching shared prompt:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
