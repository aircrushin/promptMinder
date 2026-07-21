<div align="center">
  <h1>PromptMinder</h1>
  <p>
    <a href="README.md">中文</a> | 
    <a href="README_EN.md">English</a>
  </p>
</div>

# PromptMinder

一个专业的提示词管理平台，让 AI 提示词管理更简单、更高效

![主页](/public/main-page.png)

## 🌟 特性

### 核心功能

- ✅ **提示词版本管理** - 支持版本回溯和历史记录查看
- ✅ **版本差异对比** - 类似 Git diff 的并排对比视图，快速识别提示词更新变化
- ✅ **版本审批流** - 团队空间支持可配置审批开关，支持提交/审批/拒绝/撤回
- ✅ **审批讨论与 @提及** - 审批单线程评论，支持 `@团队成员` 协作评审
- ✅ **变更订阅与通知中心** - 支持按提示词订阅变更，站内通知统一收敛
- ✅ **标签化管理** - 自定义标签，快速分类和检索
- ✅ **公私有模式** - 支持私有提示词和公共分享
- ✅ **AI 智能生成** - 集成 AI 模型，智能生成优质提示词
- ✅ **团队协作** - 支持团队创建、成员管理与权限控制
- ✅ **提示词贡献** - 社区贡献功能，审核发布流程
- ✅ **Agent Skills 专区** - 同步公开 Skill 目录，支持浏览、安装与一键加入工作区

### 用户体验

- 📱 **移动端适配** - 响应式设计，完美支持移动设备
- 🌍 **国际化支持** - 支持中文和英文双语
- 🎨 **现代化界面** - 基于 Shadcn UI 的精美设计
- 🔍 **智能搜索** - 快速搜索和过滤功能
- 📋 **一键复制** - 方便的复制和分享功能

### 技术特性

- ⚡ **高性能** - Next.js 16 + React 19，极速加载
- 🔐 **安全认证** - Clerk 提供企业级用户认证
- 💾 **可靠存储** - Neon PostgreSQL + Drizzle ORM
- 🚀 **易部署** - 支持 Vercel、Zeabur 一键部署

## 🚀 快速开始

### 环境要求

- Node.js 20.0 或更高版本
- pnpm 10.x（推荐，项目脚本以 `pnpm` 为主）
- Git

### 本地开发

1. **克隆项目**

```bash
git clone https://github.com/your-username/promptMinder.git
cd promptMinder
```

2. **安装依赖**

```bash
# 推荐使用 pnpm
pnpm install
```

3. **配置环境变量**
   创建 `.env.local` 文件并配置以下变量：

```env
# 数据库配置 (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Supabase 配置 (仅用于文件存储)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk 认证配置
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# NextAuth 配置
AUTH_SECRET=your_auth_secret

# AI API 配置
ZHIPU_API_KEY=your_zhipu_api_key

# GitHub OAuth (可选)
GITHUB_ID=your_github_app_id
GITHUB_SECRET=your_github_app_secret

# 登录后跳转（可选）
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/prompts
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/prompts

# 管理员邮箱 / Agent 调用（按需配置）
ADMIN_EMAIL=admin@example.com
LANGGRAPH_TOKEN=your_langgraph_token
PROMPTMINDER_TOKEN=pm_xxx

# 基础 URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. **执行数据库迁移**

   首次拉取最新代码后，请先执行数据库迁移（尤其是审批流升级后）：

```bash
pnpm db:migrate
```

同步首批官方 Skills（需要 skills.sh 的 Vercel OIDC token）：

```bash
pnpm skills:sync
```

默认同步前 50 个精选 Skill。仅许可证明确且安全状态可接受的来源会保存完整内容；其余来源只保存索引和出处。使用 `--limit=0` 同步全部精选项，或加 `--all` 切换到完整目录。

5. **启动开发服务器**

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## CLI Quick Start

普通用户不需要后台脚本发 token，直接在网页里创建：

```text
https://www.prompt-minder.com/settings/cli-tokens
```

然后安装并使用 CLI：

```bash
npm i -g @aircrushin/promptminder-cli
promptminder auth login --token pm_xxx
promptminder team list
```

### CLI Agent Skill

如果你希望 Cursor、Claude Code、Codex CLI 等 AI agent 正确使用 PromptMinder CLI，优先安装独立 skill 仓库：

```bash
npx skills add aircrushin/promptminder-cli-skill
```

仓库地址：`https://github.com/aircrushin/promptminder-cli-skill`

CLI 当前仍保留 `promptminder skills install`，但该路径仅作为兼容旧安装方式的 deprecated compatibility 入口，后续以独立 skill 仓库为准。

### 常用开发命令

```bash
pnpm lint              # 运行 ESLint
pnpm test              # 运行 Jest 测试
pnpm test:coverage     # 生成覆盖率报告
pnpm analyze           # 分析构建产物体积
pnpm cli:agent -- prompt.list
```

## 📦 部署指南

### Vercel 部署

1. **准备工作**

   - Fork 本项目到你的 GitHub 账户
   - 注册并登录 [Vercel](https://vercel.com)
2. **部署步骤**

   - 在 Vercel 中点击 `New Project`
   - 选择 `Import Git Repository`
   - 选择你 fork 的项目
   - 配置环境变量（见上方环境变量说明）
   - 点击 `Deploy`
3. **自动部署**

   - 部署完成后，每次推送到主分支都会自动重新部署

### Zeabur 部署

1. 访问 [Zeabur](https://zeabur.com) 并登录
2. 创建新项目并连接 GitHub 仓库
3. 配置环境变量
4. 部署并获取访问地址

   [![Deployed on Zeabur](https://zeabur.com/deployed-on-zeabur-dark.svg)](https://zeabur.com/referral?referralCode=aircrushin&utm_source=aircrushin&utm_campaign=oss)

## 🗃 数据库配置

### Neon PostgreSQL + Drizzle ORM

本项目使用 [Neon](https://neon.tech) Serverless PostgreSQL 作为数据库，[Drizzle ORM](https://orm.drizzle.team) 进行数据库查询和 Schema 管理。

1. **创建 Neon 数据库**

   - 注册 [Neon](https://neon.tech) 账户
   - 创建新项目，获取 `DATABASE_URL` 连接字符串
   - 将连接字符串配置到 `.env.local` 的 `DATABASE_URL` 中

2. **初始化数据库表结构**

```bash
# 将 Drizzle Schema 推送到数据库（首次使用或开发环境）
pnpm db:push
```

3. **数据库命令**

```bash
pnpm db:push       # 将 Schema 推送到数据库（开发环境推荐）
pnpm db:generate   # 生成 SQL 迁移文件
pnpm db:migrate    # 执行迁移文件（生产环境推荐）
pnpm db:studio     # 打开 Drizzle Studio 可视化管理数据库
```

4. **Schema 与迁移文件**

   项目当前使用 `drizzle.config.mjs` 与 `drizzle/` 目录管理迁移执行逻辑，同时保留 `sql/` 目录中的初始化/补充脚本：
   - `drizzle/migrate.js` — 迁移入口脚本
   - `drizzle/` — Drizzle 迁移相关文件
   - `sql/teams.sql` — 团队与成员相关表
   - `sql/prompts.sql` — 提示词主表与版本数据
   - `sql/tags.sql` — 标签相关表
   - `sql/projects.sql` — 项目组织相关表
   - `sql/contributions.sql` — 社区贡献与审核流程

## 🔄 团队审批协作说明

- 团队可在「团队管理」页面开启/关闭版本审批流（存量团队默认关闭，新团队默认开启）。
- 开启后，团队内新建/改版会进入审批单，不会直接发布到版本列表。
- 审批权限：`owner/admin`；支持审批单评论与 `@成员` 协作。
- 支持按提示词订阅变更，并在通知中心查看未读/已读消息。

## 🧩 Agent Skills 专区

PromptMinder 内置 Skills 目录（路由：`/skills`），用于发现、审查和复用公开 Agent Skills。

### 已有能力

- **目录浏览**：分页展示已同步 Skill，支持按名称 / 描述 / 来源搜索
- **排序**：按安装量（最受欢迎）或最近同步时间排序
- **详情页**：查看来源、许可证、安装量、Markdown 正文与附带文件
- **安装方式**：详情页提供与 [skills.sh](https://skills.sh) 一致的 Command / Prompt 安装文案，可一键复制
- **加入工作区**：登录后可将可用内容一键添加为提示词，进入提示词库继续编辑与测试
- **内容策略**：仅许可证明确且安全状态可接受的来源会托管完整内容；其余条目保留索引与出处，跳转原始仓库查看

### 数据同步

本地或部署环境可通过脚本从公开源同步目录：

```bash
pnpm skills:sync
```

默认同步前 50 个精选 Skill；使用 `--limit=0` 同步全部精选项，或加 `--all` 切换到完整目录。同步前需配置 skills.sh 相关的 Vercel OIDC token。

### 与 CLI Skill 的关系

- **站点 Skills 专区**：浏览社区 / 公开 Skill，并可选加入 PromptMinder 工作区
- **PromptMinder CLI Skill**：教 AI agent 正确使用 PromptMinder CLI（见上方「CLI Agent Skill」）

两者互补，互不替代。

## 🔐 认证配置

### Clerk 设置

1. **创建 Clerk 应用**

   - 访问 [Clerk](https://clerk.com)
   - 创建新应用
   - 选择认证方式（邮箱、社交登录等）
2. **配置 OAuth 提供商**

   - 在 Clerk 控制台中启用 GitHub、Google 等登录方式
   - 配置回调 URL
3. **获取密钥**

   - 复制 Publishable Key 和 Secret Key
   - 添加到环境变量中

详细配置请参考 [Clerk 官方文档](https://clerk.com/docs)

## 🌍 国际化

项目支持多语言，目前支持：

- 🇨🇳 简体中文
- 🇺🇸 English

语言文件位于 `/messages` 目录：

- `zh.json` - 中文翻译
- `en.json` - 英文翻译

### 添加新语言

1. 在 `/messages` 目录创建新的语言文件
2. 复制现有翻译文件的结构
3. 在 `LanguageContext` 中添加新语言支持

## 🛠 开发指南

### 项目结构

```text
promptMinder/
├── app/                    # Next.js App Router 页面与 API
├── components/             # React 组件（含 ui/prompt/team 等）
├── contexts/               # React Context
├── hooks/                  # 自定义 Hooks
├── lib/                    # 工具库、认证、团队上下文与业务逻辑
├── messages/               # 国际化文案
├── drizzle/                # Drizzle 迁移脚本
├── sql/                    # 初始化/补充 SQL 脚本
├── packages/               # CLI 等子包
├── docs/                   # 项目文档
└── public/                 # 静态资源
```

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循 React Hooks 最佳实践
- 项目以 JavaScript 为主，使用 `jsconfig.json` 提供 `@/` 路径别名
- CSS 使用 Tailwind CSS

### 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交变更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 🤝 社区

### 用户反馈

使用 [Canny](https://canny.io) 收集用户反馈和功能请求。

1. 注册 Canny 账号并创建项目
2. 获取 Canny URL
3. 在应用的 Footer 组件中配置链接


## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 💖 支持项目

如果这个项目对你有帮助，欢迎：

- ⭐ 给项目点个星
- 🍴 Fork 并改进
- 🐛 提交 Bug 报告
- 💡 提出新功能建议

<a href="https://www.buymeacoffee.com/aircrushin" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >
</a>

---

**PromptMinder** - 让 AI 提示词管理更简单 ✨
