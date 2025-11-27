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
- ✅ **标签化管理** - 自定义标签，快速分类和检索
- ✅ **公私有模式** - 支持私有提示词和公共分享
- ✅ **AI 智能生成** - 集成 AI 模型，智能生成优质提示词
- ✅ **团队协作** - 支持团队创建、成员管理与权限控制
- ✅ **提示词贡献** - 社区贡献功能，审核发布流程

### 用户体验

- 📱 **移动端适配** - 响应式设计，完美支持移动设备
- 🌍 **国际化支持** - 支持中文和英文双语
- 🎨 **现代化界面** - 基于 Shadcn UI 的精美设计
- 🔍 **智能搜索** - 快速搜索和过滤功能
- 📋 **一键复制** - 方便的复制和分享功能

### 技术特性

- ⚡ **高性能** - Next.js 16 + React 19，极速加载
- 🔐 **安全认证** - Clerk 提供企业级用户认证
- 💾 **可靠存储** - Supabase + PostgreSQL 数据库
- 🚀 **易部署** - 支持 Vercel、Zeabur 一键部署

## 🚀 快速开始

### 环境要求

- Node.js 20.0 或更高版本
- npm 或 pnpm 包管理器
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
# Supabase 配置
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

# 基础 URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. **启动开发服务器**

```bash
npm run dev
# 或者使用 pnpm
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

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

### Supabase 设置

1. **创建项目**

   - 注册 [Supabase](https://supabase.com) 账户
   - 创建新项目
   - 获取项目 URL 和匿名密钥
2. **创建数据表**
   执行以下 SQL 语句创建所需的数据表：

```sql
-- 创建 prompts 表
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_public BOOLEAN DEFAULT false,
    user_id TEXT,
    version TEXT,
    tags TEXT,
    cover_img TEXT,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE
);

-- 创建 tags 表
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE(name, user_id)
);

-- 创建 teams 表
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    avatar_url TEXT,
    is_personal BOOLEAN DEFAULT false
);

-- 创建团队成员关系表
CREATE TABLE team_user_relation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    UNIQUE(team_id, user_id)
);

-- 创建贡献表
CREATE TABLE prompt_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    role_category TEXT NOT NULL,
    content TEXT NOT NULL,
    contributor_email TEXT,
    contributor_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    published_prompt_id UUID,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);
```

更多 SQL 文件可以在 `/sql` 目录中找到。

### 团队协作迁移指南

现有用户升级到团队协作版本时，需要按顺序执行以下步骤：

1. **应用最新数据库结构**
   - 依次运行 `sql/teams.sql`, `sql/project.sql`, `sql/prompts.sql`, `sql/tags.sql`，确保新增的外键、检查约束和索引落地。
2. **回填历史数据**
   - 执行 `sql/backfill_team_data.sql`，它会为每位用户创建个人团队并将既有提示词、项目、标签挂接到对应团队。
   - 迁移后可通过脚本末尾的查询检查是否仍存在缺失 `team_id` 的记录。
3. **发布前校验**
   - 确认 `team_members` 表中每个团队仅保留一个 `owner`，同时 `teams.owner_id` 与对应成员一致。
   - 为生产环境配置 `SUPABASE_URL` / `SUPABASE_ANON_KEY`，并在部署前运行 `npm run lint && npm test`。

> 建议先在测试环境导入生产快照验证迁移脚本，确认无数据丢失后再在生产执行。

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

```
promptMinder/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── prompts/           # 提示词相关页面
│   ├── tags/              # 标签管理页面
│   └── ...
├── components/            # React 组件
│   ├── ui/                # 基础 UI 组件
│   ├── prompt/            # 提示词相关组件
│   └── ...
├── contexts/              # React Context
├── hooks/                 # 自定义 Hooks
├── lib/                   # 工具库和配置
├── messages/              # 国际化文件
├── public/                # 静态资源
└── sql/                   # 数据库脚本
```

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循 React Hooks 最佳实践
- 组件使用 TypeScript (推荐)
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
