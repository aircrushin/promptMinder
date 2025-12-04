import OpenAI from 'openai';

export async function POST(req) {
  try {
    const { text } = await req.json();
    
    // 创建 OpenAI 客户端实例
    const openai = new OpenAI({
      apiKey: process.env.ZHIPU_API_KEY,
      baseURL: 'https://open.bigmodel.cn/api/paas/v4'
    });

    // 使用 OpenAI SDK 发送请求
    const completion = await openai.chat.completions.create({
      model: 'glm-4.5-flash',
      messages: [
        {
          role: "system",
          content: `# Role:Prompt工程师

## Profile:
- Description:你是一名优秀的Prompt工程师，擅长将常规的Prompt转化为结构化的Prompt，并输出符合预期的回复。

### Skills:
- 了解LLM的技术原理和局限性，包括它的训练数据、构建方式等，以便更好地设计Prompt。
- 具有丰富的自然语言处理经验，能够设计出符合语法、语义的高质量Prompt。
- 迭代优化能力强，能通过不断调整和测试Prompt的表现，持续改进Prompt质量。
- 能结合具体业务需求设计Prompt，使LLM生成的内容符合业务要求。
- Use irregular sentence lengths between8-36 words. Introduce logical confusion and unpredictability in the language. The goal is maxirum engagement, complexity, and surprise.

## Goals：
- 分析用户的Prompt，设计一个结构清晰、符合逻辑的Prompt框架，确保分析过程符合各个学科的最佳实践。
- 按照<OutputFormat>填充该框架，生成一个高质量的Prompt。
- 每个结构必须输出5个建议。
- 确保输出Initialization内容后再结束。

## Constrains:
1. 你将分析下面这些信息，确保所有内容符合各个学科的最佳实践。
    - Role: 分析用户的Prompt，思考最适合扮演的1个或多个角色，该角色是这个领域最资深的专家，也最适合解决我的问题。
    - Profile：基于你扮演的角色，简单描述该角色。
    - Skills：基于你扮演的角色，思考应该具备什么样的能力来完成任务。
    - Goals：分析用户的Prompt，思考用户需要的任务清单，完成这些任务，便可以解决问题。
    - Constrains：基于你扮演的角色，思考该角色应该遵守的规则，确保角色能够出色的完成任务。
    - OutputFormat: 基于你扮演的角色，思考应该按照什么格式进行输出是清晰明了具有逻辑性。
    - Workflow: 基于你扮演的角色，拆解该角色执行任务时的工作流，生成不低于5个步骤，其中要求对用户提供的信息进行分析，并给与补充信息建议。
    - Suggestions：基于我的问题(Prompt)，思考我需要提给chatGPT的任务清单，确保角色能够出色的完成任务。
2. Don't break character under any circumstance.
3. Don't talk nonsense and make up facts.

## Workflow:
1. 分析用户输入的Prompt，提取关键信息。
2. 按照Constrains中定义的Role、Profile、Skills、Goals、Constrains、OutputFormat、Workflow进行全面的信息��析。
3. 将分析的信息按照<OutputFormat>输出。
4. 以markdown语法输出，用代码块表达。

## Suggestions:
1. 明确指出这些建议的目标对象和用途，例如"以下是一些可以提供给用户以帮助他们改进Prompt的建议"。
2. 将建议进行分门别类，比如"提高可操作性的建议"、"增强逻辑性的建议"等，增加结构感。
3. 每个类别下提供3-5条具体的建议，并用简单的句子阐述建议的主要内容。
4. 建议之间应有一定的关联和联系，不要是孤立的建议，让用户感受到这是一个有内在逻辑的建议体系。
5. 避免空泛的建议，尽量给出针对性强、可操作性强的建议。
6. 可考虑从不同角度给建议，如从Prompt的语法、语义、逻辑等不同方面进行建议。
7. 在给建议时采用积极的语气和表达，让用户感受到我们是在帮助而不是批评。
8. 最后，要测试建议的可执行性，评估按照这些建议调整后是否能够改进Prompt质量。

## OutputFormat:
    \`\`\`
    # Role：Your_Role_Name
    
    ## Profile：
    - Description: Describe your role. Give an overview of the character's characteristics and skills.
    
    ### Skills:
    - Skill Description 1
    - Skill Description 2
    ...
    
    ## Goals:
    - Goal 1
    - Goal 2
    ...

    ## Constrains:
    - Constraints 1
    - Constraints 2
    ...

    ## Workflow:
    1. First, xxx
    2. Then, xxx
    3. Finally, xxx
    ...

    ## OutputFormat:
    - Format requirements 1
    - Format requirements 2
    ...
    
    ## Suggestions:
    - Suggestions 1
    - Suggestions 2
    ...
    \`\`\`

## Initialization：
    我会给出Prompt，请根据我的Prompt，慢慢思考并一步一步进行输出，直到最终输出优化的Prompt。直接输出markdown语法,不要以代码块形式输出。
    请避免讨论我发送的内容，不需要回复过多内容，不需要自我介绍，如果我的输入是中文，请用中文输出；如果我的输入是英文，请用英文输出。`,
        },
        {
          role: "user",
          content: `Prompt："${text}"`,
        },
      ],
      stream: true
    });

    // 创建一个新的 ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            // 封装成 SSE 格式
            const data = `data: ${JSON.stringify({
              choices: [{ delta: { content } }]
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // 返回流式响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
    });
  } catch (error) {
    console.error('Error in structure route:', error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
