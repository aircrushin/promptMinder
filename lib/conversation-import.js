import { assert } from '@/lib/api-error.js';

const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const SUPPORTED_SOURCES = new Set(['chatgpt', 'claude']);

function normalizeSource(source) {
  const normalized = String(source || '').toLowerCase().trim();
  return SUPPORTED_SOURCES.has(normalized) ? normalized : 'chatgpt';
}

function limitText(text, maxLength = 12000) {
  return String(text || '').trim().slice(0, maxLength);
}

function extractJsonObject(text) {
  const cleaned = String(text || '')
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim();

  if (!cleaned) {
    return null;
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to first object block.
  }

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function inferTags(text) {
  const source = String(text || '').toLowerCase();
  const mapping = [
    { tag: '开发', keywords: ['code', 'coding', 'api', 'bug', 'react', 'next.js', 'javascript', 'python', 'sql', '后端', '前端', '代码'] },
    { tag: '写作', keywords: ['article', 'blog', 'copywriting', '写作', '文案', '标题', '内容'] },
    { tag: '产品', keywords: ['prd', 'roadmap', 'feature', '需求', '产品', '方案'] },
    { tag: '运营', keywords: ['marketing', 'campaign', '增长', '投放', '运营', '转化'] },
    { tag: '数据分析', keywords: ['analysis', 'sql', 'dashboard', '指标', '分析', '数据'] },
    { tag: 'Chatbot', keywords: ['assistant', 'chatgpt', 'claude', 'ai', '对话', '助手'] },
  ];

  const result = [];
  mapping.forEach(({ tag, keywords }) => {
    if (keywords.some((keyword) => source.includes(keyword))) {
      result.push(tag);
    }
  });

  if (result.length === 0) {
    result.push('Chatbot');
  }

  return result.slice(0, 5);
}

function inferOutputHints(text) {
  const source = String(text || '').toLowerCase();
  const hints = [];

  if (source.includes('json')) {
    hints.push('最终结果使用 JSON 输出，并保证字段含义清晰。');
  }
  if (source.includes('markdown') || source.includes('md')) {
    hints.push('最终结果使用 Markdown 输出，包含层级标题。');
  }
  if (source.includes('table') || source.includes('表格')) {
    hints.push('在关键对比信息处增加表格，便于快速阅读。');
  }
  if (source.includes('example') || source.includes('示例')) {
    hints.push('至少提供一个可直接复用的示例。');
  }

  return hints;
}

function inferTitle(text, sourceLabel) {
  const normalized = String(text || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^['"`\-\s]+|['"`\-\s]+$/g, '')
    .trim();

  if (!normalized) {
    return `${sourceLabel}对话导入提示词`;
  }

  const sentence = normalized.split(/[。！？.!?]/)[0].trim();
  const compact = sentence || normalized;
  return compact.slice(0, 28);
}

function detectSpeaker(line) {
  const value = String(line || '').trim();
  if (!value) {
    return null;
  }

  const userPattern = /^(?:\*\*)?\s*(?:user|you|human|我|用户|提问者)\s*(?:\*\*)?\s*[:：-]\s*(.*)$/i;
  const assistantPattern = /^(?:\*\*)?\s*(?:assistant|ai|chatgpt|claude|助手|模型)\s*(?:\*\*)?\s*[:：-]\s*(.*)$/i;

  const userMatch = value.match(userPattern);
  if (userMatch) {
    return { role: 'user', content: userMatch[1]?.trim() || '' };
  }

  const assistantMatch = value.match(assistantPattern);
  if (assistantMatch) {
    return { role: 'assistant', content: assistantMatch[1]?.trim() || '' };
  }

  return null;
}

function parseConversation(conversation) {
  const lines = String(conversation || '').replace(/\r/g, '').split('\n');
  const messages = [];

  let currentRole = null;
  let buffer = [];

  const flush = () => {
    if (!currentRole || buffer.length === 0) {
      buffer = [];
      return;
    }

    const content = buffer.join('\n').trim();
    if (content) {
      messages.push({ role: currentRole, content });
    }
    buffer = [];
  };

  for (const line of lines) {
    const detected = detectSpeaker(line);

    if (detected) {
      flush();
      currentRole = detected.role;
      buffer = detected.content ? [detected.content] : [];
      continue;
    }

    if (!currentRole) {
      currentRole = 'user';
    }

    buffer.push(line);
  }

  flush();

  if (messages.length === 0) {
    return [{ role: 'user', content: String(conversation || '').trim() }];
  }

  return messages;
}

function normalizeImportedPrompt(payload, sourceLabel) {
  const title = limitText(payload?.title || '', 80) || `${sourceLabel}对话导入提示词`;
  const description =
    limitText(payload?.description || '', 180) || `由${sourceLabel}对话自动提炼，建议先微调后保存。`;
  const content = limitText(payload?.content || payload?.prompt || '', 20000);

  assert(content.length > 0, 422, 'Unable to generate prompt content', {
    code: 'IMPORT_CONTENT_EMPTY',
  });

  const rawTags = payload?.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags
    : String(rawTags || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  const normalizedTags = (tags.length > 0 ? tags : inferTags(`${title}\n${description}\n${content}`)).slice(0, 5);

  return {
    title,
    description,
    content,
    tags: normalizedTags.join(','),
    version: '1.0.0',
  };
}

function buildFallbackPrompt(source, conversation) {
  const sourceLabel = source === 'claude' ? 'Claude' : 'ChatGPT';
  const messages = parseConversation(conversation);
  const userMessages = messages.filter((item) => item.role === 'user').map((item) => item.content);
  const assistantMessages = messages
    .filter((item) => item.role === 'assistant')
    .map((item) => item.content);

  const latestUserMessage = userMessages[userMessages.length - 1] || conversation;
  const recentContext = userMessages.slice(Math.max(0, userMessages.length - 3), -1);
  const assistantStyle = assistantMessages[assistantMessages.length - 1] || '';
  const outputHints = inferOutputHints(`${latestUserMessage}\n${assistantStyle}`);

  const content = [
    '你是一名专业 AI 助手，请根据以下要求执行任务。',
    '',
    '## 任务目标',
    latestUserMessage,
    '',
    '## 背景上下文',
    recentContext.length > 0
      ? recentContext.map((item, index) => `${index + 1}. ${item}`).join('\n')
      : '如果信息不足，请先提出关键澄清问题。',
    '',
    '## 执行要求',
    '- 先确认任务边界和关键假设，再输出结果。',
    '- 输出结构化步骤，并给出可直接复用的示例。',
    '- 对不确定信息进行标注，并给出下一步建议。',
    `- 保持与${sourceLabel}原对话一致的语气和专业度。`,
    ...outputHints.map((item) => `- ${item}`),
    '',
    '## 输出格式',
    '- 优先给出结论，再说明过程。',
    '- 使用小标题组织内容，控制段落长度。',
    '- 若包含代码或结构化数据，请提供可直接复制版本。',
  ].join('\n');

  return normalizeImportedPrompt(
    {
      title: inferTitle(latestUserMessage, sourceLabel),
      description: `从${sourceLabel}对话提炼的任务提示词草稿。`,
      content,
      tags: inferTags(`${latestUserMessage}\n${assistantStyle}`),
    },
    sourceLabel
  );
}

async function tryAiConversion(source, conversation) {
  const apiKey = process.env.ZHIPUAI_API_KEY || process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    return null;
  }

  const sourceLabel = source === 'claude' ? 'Claude' : 'ChatGPT';
  const systemPrompt = `你是Prompt提炼助手。请把用户粘贴的${sourceLabel}对话整理成可直接复用的提示词模板。\n` +
    '仅输出 JSON，不要输出任何解释。JSON 字段固定为：' +
    '{"title":"...","description":"...","content":"...","tags":["...","..."]}';

  const userPrompt = `请从下面对话提炼高质量提示词：\n\n${conversation.slice(0, 15000)}`;

  try {
    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4.7-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 1400,
        thinking: { type: 'disabled' },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    const parsed = extractJsonObject(content);
    if (!parsed) {
      return null;
    }

    return normalizeImportedPrompt(parsed, sourceLabel);
  } catch (error) {
    console.warn('[conversation-import] AI conversion failed, falling back to local parser:', error);
    return null;
  }
}

export async function convertConversationToPrompt({ source, conversation }) {
  const normalizedSource = normalizeSource(source);
  const normalizedConversation = String(conversation || '').trim();

  assert(normalizedConversation.length >= 20, 400, 'Conversation is too short', {
    code: 'CONVERSATION_TOO_SHORT',
  });
  assert(normalizedConversation.length <= 50000, 400, 'Conversation is too long', {
    code: 'CONVERSATION_TOO_LONG',
  });

  const aiResult = await tryAiConversion(normalizedSource, normalizedConversation);
  if (aiResult) {
    return aiResult;
  }

  return buildFallbackPrompt(normalizedSource, normalizedConversation);
}
