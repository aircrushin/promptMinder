0.2.1
===

### Enhancement

将整个项目从 `js` 主体迁移到 `ts` 主体

0.2.0
===

DB 需要进行 Migrate

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

