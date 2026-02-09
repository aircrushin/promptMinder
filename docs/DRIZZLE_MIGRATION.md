# Drizzle ORM 迁移指南

## 已完成的工作

### 1. 安装依赖
已安装以下Drizzle ORM相关依赖：
- `drizzle-orm` - Drizzle ORM核心库
- `postgres` - PostgreSQL客户端
- `@neondatabase/serverless` - Neon PostgreSQL支持
- `drizzle-kit` (dev) - 用于生成和管理迁移

### 2. 配置文件
创建了 `drizzle.config.js` 配置文件，使用PostgreSQL方言。

### 3. 数据库Schema定义
创建了 `lib/db/schema.js` 定义了所有表结构：
- `teams` - 团队表
- `team_members` - 团队成员表
- `prompts` - 提示词表
- `public_prompts` - 公开提示词表
- `tags` - 标签表
- `favorites` - 收藏表
- `likes` - 点赞表
- `prompt_versions` - 提示词版本表
- `contributions` - 贡献表
- `provider_keys` - 提供商API密钥表
- `feedback` - 反馈表

### 4. 数据库客户端
创建了 `lib/db/client.js` 提供：
- `getDb()` - 获取Drizzle数据库实例
- `getRawClient()` - 获取原始PostgreSQL客户端
- `withTransaction()` - 事务处理

### 5. 查询操作层
创建了 `lib/db/queries.js` 封装了所有CRUD操作：
- `promptQueries` - 提示词查询
- `teamQueries` - 团队查询
- `teamMemberQueries` - 团队成员查询
- `tagQueries` - 标签查询
- `favoriteQueries` - 收藏查询
- `likeQueries` - 点赞查询
- `publicPromptQueries` - 公开提示词查询
- `contributionQueries` - 贡献查询
- `providerKeyQueries` - API密钥查询
- `feedbackQueries` - 反馈查询
- `promptVersionQueries` - 版本查询

### 6. 迁移的API路由
所有API路由已从Supabase迁移到Drizzle ORM：

**Prompts路由：**
- `app/api/prompts/route.js`
- `app/api/prompts/[id]/route.js`
- `app/api/prompts/copy/route.js`
- `app/api/prompts/share/[id]/route.js`
- `app/api/prompts/like/route.js`
- `app/api/prompts/public/route.js`

**Teams路由：**
- `app/api/teams/route.js`
- `app/api/teams/[teamId]/route.js`
- `app/api/teams/[teamId]/members/route.js`
- `app/api/teams/[teamId]/members/[userId]/route.js`
- `app/api/teams/[teamId]/transfer/route.js`
- `app/api/teams/personal/route.js`
- `app/api/teams/invites/route.js`

**其他路由：**
- `app/api/tags/route.js`
- `app/api/favorites/route.js`
- `app/api/favorites/check/route.js`
- `app/api/contributions/route.js`
- `app/api/contributions/[id]/route.js`
- `app/api/contributions/stats/route.js`
- `app/api/feedback/route.js`
- `app/api/provider-keys/route.js`
- `app/api/share/[id]/route.js`
- `app/api/admin/public-prompts/route.js`
- `app/api/admin/public-prompts/[id]/route.js`
- `app/api/playground/run/route.js`

### 7. 服务层更新
- `lib/team-service.js` - 已更新为使用Drizzle查询
- `lib/team-request.js` - 已更新，移除Supabase依赖

## 环境变量配置

需要在 `.env` 文件中添加或更新以下环境变量：

```bash
# 数据库连接URL (优先使用)
DATABASE_URL=postgresql://user:password@host:port/database

# 或从Supabase连接
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres

# 或Supabase配置 (用于构建连接字符串)
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

## 如何使用

### 导入数据库模块

```javascript
// 方式1: 从index.js导入所有内容
import { getDb, queries } from '@/lib/db';

// 方式2: 单独导入
import { getDb } from '@/lib/db/client.js';
import { queries } from '@/lib/db/queries.js';
```

### 使用查询

```javascript
import { queries } from '@/lib/db';

// 获取所有提示词
const result = await queries.prompts.getAll({
  userId: 'user-id',
  page: 1,
  limit: 10,
});

// 创建新提示词
const newPrompt = await queries.prompts.create({
  title: 'My Prompt',
  content: 'Prompt content',
  userId: 'user-id',
  createdBy: 'user-id',
});

// 获取团队
const team = await queries.teams.getById(teamId);
```

### 直接使用Drizzle

```javascript
import { getDb, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

const db = getDb();
const { prompts } = schema;

const result = await db.select()
  .from(prompts)
  .where(and(
    eq(prompts.userId, userId),
    eq(prompts.isPublic, true)
  ));
```

## 注意事项

1. **字段名映射**: 某些字段名已从下划线命名法(snake_case)转换为驼峰命名法(camelCase)，如：
   - `user_id` → `userId`
   - `created_at` → `createdAt`
   - `is_public` → `isPublic`

2. **保留的旧文件**: 以下文件虽然不再使用，但已保留：
   - `lib/supabaseServer.js` - 旧的Supabase服务器客户端
   - `@supabase/*` 依赖 - 仍然安装在package.json中

3. **测试**: 运行测试以确保一切正常工作：
   ```bash
   pnpm test
   ```

4. **数据库迁移**: 如果需要将现有数据从Supabase迁移到新数据库，需要：
   - 导出Supabase数据
   - 在新数据库中创建表结构
   - 导入数据

## 后续步骤

1. 配置数据库连接字符串
2. 运行测试验证功能
3. 如有需要，执行数据库迁移
4. 更新任何硬编码的Supabase查询
5. 删除不再需要的Supabase依赖（可选）

## 回滚

如果需要回滚到Supabase：
1. 所有路由文件已备份在git历史中
2. 只需切换回之前的提交即可恢复Supabase版本
