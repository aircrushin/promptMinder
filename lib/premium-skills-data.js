export const PREMIUM_COLLECTION = {
  id: 'promptminder-premium',
  name: 'Premium Collection',
  eyebrow: 'PromptMinder / Curated release 01',
  description: 'Five opinionated workflows for turning good prompts into repeatable, reviewable AI work.',
  priceAnchor: '预计 ¥199 / 套，首发候补可享早鸟价',
  skills: [
    {
      slug: 'prompt-architect',
      name: 'Prompt Architect',
      zhName: 'Prompt Architect · 提示词架构师',
      tagline: '把模糊目标拆成可复用、可测试的提示词系统。',
      description: '从任务边界、变量契约到失败回退，建立能交付给团队使用的提示词架构。',
      outcome: '输出一份带变量 schema、质量门槛和测试样例的生产级 Prompt Spec。',
      signal: '适合正在把个人经验沉淀成工作流的人',
      accent: 'architecture',
      order: 1,
    },
    {
      slug: 'research-synthesizer',
      name: 'Research Synthesizer',
      zhName: 'Research Synthesizer · 研究综合器',
      tagline: '把分散资料变成有证据边界的决策简报。',
      description: '指导 Agent 区分事实、推断与未知，压缩多来源信息，同时保留可追溯的证据链。',
      outcome: '输出带来源矩阵、冲突说明和下一步建议的研究 Brief。',
      signal: '适合需要快速做判断、又不能牺牲可信度的人',
      accent: 'research',
      order: 2,
    },
    {
      slug: 'evaluation-lab',
      name: 'Evaluation Lab',
      zhName: 'Evaluation Lab · 评测实验室',
      tagline: '让提示词迭代从“感觉更好”变成可复现的比较。',
      description: '搭建最小评测集、评分 rubric 和回归门槛，帮助你知道一次改动到底改善了什么。',
      outcome: '输出可直接运行的测试集、评分表和版本决策记录。',
      signal: '适合已经在反复调 Prompt、想减少试错的人',
      accent: 'evaluation',
      order: 3,
    },
    {
      slug: 'agent-launch-checklist',
      name: 'Agent Launch Checklist',
      zhName: 'Agent Launch Checklist · Agent 上线清单',
      tagline: '从能跑到能上线，逐项检查 Agent 的边界与恢复能力。',
      description: '覆盖工具权限、状态管理、人工接管、观测指标和事故回滚，避免 Demo 逻辑直接进入生产。',
      outcome: '输出一份按风险排序的上线清单和阻断项报告。',
      signal: '适合要把 Agent 交给同事或真实用户使用的团队',
      accent: 'launch',
      order: 4,
    },
    {
      slug: 'content-repurposer',
      name: 'Content Repurposer',
      zhName: 'Content Repurposer · 内容再编排器',
      tagline: '一次创作，多种交付，始终保留原始事实与语气。',
      description: '把长文、访谈或产品素材拆成不同渠道的成稿，明确哪些内容能改写、哪些不能编造。',
      outcome: '输出带渠道规格、事实校验和发布前检查的内容包。',
      signal: '适合需要稳定产出内容、又不想牺牲品牌一致性的人',
      accent: 'content',
      order: 5,
    },
  ],
}

export const PREMIUM_INTENT_LEVELS = [
  { value: 'notify', label: '先通知我', description: '我想了解首发时间和完整权益。' },
  { value: 'early_access', label: '想拿早鸟价', description: '如果价格合适，我愿意在首发时购买。' },
  { value: 'ready_to_buy', label: '准备购买', description: '我正在寻找这类工作流，愿意优先锁定名额。' },
]

export function getPremiumSkillMeta(slug) {
  return PREMIUM_COLLECTION.skills.find((skill) => skill.slug === slug) || null
}
