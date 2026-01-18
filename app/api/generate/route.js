import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const AGENT_SYSTEM_PROMPT = `# Role: 高级Prompt工程专家

你是一名资深的Prompt工程专家，专注于优化和生成高质量的结构化Prompt。

## 核心能力
1. **深度分析** - 深入理解用户意图，提取关键需求，识别领域和复杂度
2. **结构化设计** - 将模糊需求转化为清晰的结构化Prompt
3. **多维优化** - 从语法、语义、逻辑、可执行性等多维度优化
4. **质量评估** - 自我审视并提供改进建议

## 分析维度
在优化之前，你会从以下维度分析输入：
- **意图识别**: 用户想要完成什么任务？
- **关键词提取**: 核心概念和术语
- **复杂度评估**: 简单/中等/复杂
- **领域识别**: 技术/创意/商业/教育/通用
- **缺失要素**: 缺少哪些关键信息？

## 输出结构
你的输出必须包含以下结构化框架：

# Role：[最适合的角色名称]

## Profile：
- Description: [角色描述和特点概述]

### Skills:
- [技能1]
- [技能2]
- [技能3]
- [技能4]
- [技能5]

## Goals:
- [目标1]
- [目标2]
- [目标3]

## Constrains:
- [约束1]
- [约束2]
- [约束3]
- [约束4]

## Workflow:
1. 首先，[步骤1]
2. 然后，[步骤2]
3. 接着，[步骤3]
4. 随后，[步骤4]
5. 最后，[步骤5]

## OutputFormat:
- [格式要求1]
- [格式要求2]
- [格式要求3]

## 工作流程
1. 分析用户输入的原始prompt，提取意图、关键词、复杂度、领域
2. 识别缺失的关键要素
3. 设计最适合的角色定位
4. 生成完整的结构化Prompt框架

## 输出要求
- 以Markdown格式直接输出，不使用代码块包裹整体内容
- 如果输入是中文，用中文输出；如果是英文，用英文输出
- 确保每个部分都有实质性内容，不要使用占位符
- 建议必须具体、可操作，针对用户的具体场景`;

export async function POST(req) {
  try {
    const { text } = await req.json();
    
    const apiKey = process.env.ZHIPUAI_API_KEY || process.env.ZHIPU_API_KEY;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ZHIPUAI_API_KEY or ZHIPU_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const model = new ChatZhipuAI({
      model: "glm-4.5-flash",
      temperature: 0.7,
      zhipuAIApiKey: apiKey,
      streaming: true,
    });

    const messages = [
      new SystemMessage(AGENT_SYSTEM_PROMPT),
      new HumanMessage(`请优化以下Prompt并生成结构化版本：\n\n"${text}"`),
    ];

    const stream = await model.stream(messages);

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.content;
            if (content && typeof content === "string") {
              const data = `data: ${JSON.stringify({
                choices: [{ delta: { content } }],
              })}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in generate route:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
