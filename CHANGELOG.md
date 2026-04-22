0.2.1
===

### New Feature

1. **CLI Token Management** — 添加 CLI 令牌管理功能
   - `scripts/create-cli-token.js` — 创建 CLI 访问令牌
   - `scripts/cli-whoami.js` — CLI 用户身份验证
   - `lib/cli-token-auth.js` — CLI Token 认证中间件
   - `app/settings/tokens/page.jsx` — Token 管理页面
   - `app/cli/page.js` — CLI 文档页面
2. **Landing Page CLI Promo** — 首页添加 CLI 推广模块
3. **CLI Skill Extraction** — 将 CLI 相关文档提取为独立 Skill
   - `promptminder-cli-skill/` — 独立 Skill 仓库
4. **Agent Skills** — Agent 技能系统增强

### Enhancement

1. **国际化** — CLI 相关内容中英文本地化
2. **Notifications 性能优化** — 减少 `/api/notifications` 调用频率
3. **Navbar 未读通知轮询优化**
4. **Tag 同步** — 编辑/删除 Tag 时同步更新关联 Prompts
5. **Prompt 订阅与工作流** — 实现提示词订阅和自动化工作流
6. **Onboarding Dialog** — 新用户引导对话框
7. **Conversation Import** — 对话导入功能
8. **Public Prompts 分类过滤** — 增强分类筛选和搜索功能
9. **Agent Coze 集成** — 更新 Agent API 支持 Coze 平台

### Bug Fix

2. **Theme 颜色** — 更新主题色以保持品牌一致性
3. **Tag 管理** — 改进 Tag 批量删除和错误处理

### Docs

1. 更新 README 反映新的团队工作流和数据库迁移说明
2. CLI Skill 文档优化

---

0.2.0
===

### New Feature

将数据库访问层从 Supabase JS Client 全面迁移至 Drizzle ORM + Neon Serverless PostgreSQL，认证保持 Clerk 不变，Supabase 仅保留文件存储功能。

1. **Drizzle ORM Schema** — 完整定义所有数据表结构（`drizzle/schema/`）
   - `teams.js` — teams、team_members、projects 表
   - `prompts.js` — prompts、tags、favorites 表
   - `public.js` — public_prompts、prompt_likes、prompt_contributions 表
   - `user.js` — user_feedback、provider_keys 表
2. **`lib/db.js`** — Drizzle + Neon 数据库客户端，统一导入入口
3. **`lib/supabase-storage.js`** — 独立的 Supabase Storage 客户端，仅供文件上传使用
4. **`lib/case-utils.js`** — `toSnakeCase()` 工具函数，解决 Drizzle camelCase 返回与前端 snake_case 的兼容问题
5. **数据库迁移文件** — `drizzle/migrations/0000_init.sql`，包含完整建表与索引
6. **`drizzle.config.js`** — Drizzle Kit 配置文件
7. **`drizzle/migrate.js`** — 数据库迁移脚本

### Enhancement
1. **29 个 API 路由** — 从 Supabase 查询链式调用迁移至 Drizzle ORM 查询
   - `app/api/prompts/`
   - `app/api/tags/`
   - `app/api/favorites/`
   - `app/api/teams/`
   - `app/api/contributions/`
   - `app/api/admin/`
   - `app/api/feedback/`
   - `app/api/provider-keys/`
   - `app/api/playground/`
   - `app/api/upload/`
   - `app/api/share/`
2. **`app/share/[id]/page.js`** — SSR 页面从 Supabase 迁移至 Drizzle
3. **`lib/team-service.js`** — TeamService 全面重写（~570 行），所有方法改用 Drizzle 查询
4. **`lib/team-request.js`** — `resolveTeamContext()` 返回 `{ teamId, db, teamService }` 替代 `{ teamId, supabase, teamService }`
5. **`.env.example`** — 更新 `DATABASE_URL` 为 Neon 连接字符串格式
6. 删除 `lib/supabaseServer.js` , `@supabase/auth-helpers-nextjs` , `@supabase/auth-ui-react` , `@supabase/auth-ui-shared`
