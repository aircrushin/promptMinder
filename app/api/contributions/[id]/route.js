import { NextResponse } from 'next/server';
import { queries } from '@/lib/db/index.js';

// 获取单个贡献详情
export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const contribution = await queries.contributions.getById(id);

    if (!contribution) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
    }

    return NextResponse.json(contribution);

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 更新贡献状态（审核）
export async function PATCH(request, { params }) {
  const { id } = await params;
  
  // 从请求头获取管理员邮箱（由前端发送）
  const adminEmail = request.headers.get('x-admin-email');

  try {
    const { status, adminNotes, publishToPrompts } = await request.json();

    // 验证状态值
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // 检查贡献是否存在
    const existingContribution = await queries.contributions.getById(id);

    if (!existingContribution) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
    }

    // 准备更新数据
    const updateData = {
      status,
      adminNote: adminNotes || null,
      reviewedAt: new Date(),
      reviewedBy: adminEmail || 'admin',
    };

    // 如果状态是approved且需要发布到公共提示词库
    let publishedPromptId = null;
    if (status === 'approved' && publishToPrompts) {
      // 创建新的公共提示词到 public_prompts 表
      const contributionLanguage = existingContribution.language || 'zh';
      const newPublicPrompt = await queries.publicPrompts.create({
        title: existingContribution.title,
        roleCategory: existingContribution.roleCategory,
        content: existingContribution.content,
        category: contributionLanguage === 'zh' ? '社区贡献' : 'Community',
        language: contributionLanguage,
        createdBy: existingContribution.contributorEmail || null,
      });

      publishedPromptId = newPublicPrompt.id;
      updateData.publishedPromptId = publishedPromptId;
    }

    // 更新贡献状态
    const updatedContribution = await queries.contributions.update(id, updateData);

    return NextResponse.json({
      message: 'Contribution updated successfully',
      contribution: updatedContribution,
      publishedPromptId
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 删除贡献
export async function DELETE(request, { params }) {
  const { id } = await params;

  try {
    // 检查贡献是否存在
    const contribution = await queries.contributions.getById(id);

    if (!contribution) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
    }

    // 删除贡献
    await queries.contributions.delete(id);

    return NextResponse.json({ message: 'Contribution deleted successfully' });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
