# PromptMinder Docker 部署指南

## 🚀 一键部署

### 快速开始

```bash
# 克隆项目
git clone https://github.com/hafei/promptMinder.git
cd promptMinder

# 运行部署脚本
./scripts/deploy.sh
```

部署脚本会自动：
1. 检查 Docker 环境
2. 生成必要的密钥和配置
3. 启动所有服务
4. 初始化数据库

### 手动部署

如果需要手动部署，按以下步骤操作：

```bash
# 1. 复制环境变量模板
cp .env.example .env

# 2. 编辑 .env 文件，配置必要的密钥（见下方说明）
vim .env

# 3. 启动服务
docker compose up -d --build

# 4. 查看日志
docker compose logs -f web
```

## 📝 环境变量配置

### 必需配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `AUTH_SECRET` | 认证密钥（至少32字符） | 随机字符串 |
| `JWT_SECRET` | JWT 签名密钥（至少32字符） | 随机字符串 |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 | JWT token |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | JWT token |

### 生成 JWT 密钥

如果需要自定义 `JWT_SECRET`，需要重新生成对应的 `SUPABASE_ANON_KEY` 和 `SUPABASE_SERVICE_ROLE_KEY`：

```bash
# 使用 Node.js 生成密钥
node -e "
const crypto = require('crypto');
const jwtSecret = 'YOUR_JWT_SECRET_HERE'; // 替换为你的 JWT_SECRET

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', jwtSecret).update(encodedHeader + '.' + encodedPayload).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return encodedHeader + '.' + encodedPayload + '.' + signature;
}

const now = Math.floor(Date.now() / 1000);
const exp = now + 315360000; // 10 years

console.log('SUPABASE_ANON_KEY=' + createJWT({ role: 'anon', iss: 'supabase', iat: now, exp: exp }));
console.log('SUPABASE_SERVICE_ROLE_KEY=' + createJWT({ role: 'service_role', iss: 'supabase', iat: now, exp: exp }));
"
```

## 🌐 服务地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 应用 | http://localhost:3000 | PromptMinder 主应用 |
| Supabase Studio | http://localhost:8080 | 数据库管理界面 |
| MinIO Console | http://localhost:9001 | 对象存储管理 |
| PostgREST | http://localhost:3002 | REST API（调试用） |
| PostgreSQL | localhost:5432 | 数据库（调试用） |

## 📦 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                      docker compose                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐     ┌──────────┐     ┌───────────────┐        │
│   │   web   │────▶│   kong   │────▶│   postgrest   │        │
│   │ :3000   │     │  :8000   │     │    :3002      │        │
│   └─────────┘     └──────────┘     └───────────────┘        │
│                         │                   │                │
│                         │                   ▼                │
│                         │          ┌───────────────┐        │
│                         │          │      db       │        │
│                         │          │    :5432      │        │
│                         │          └───────────────┘        │
│                         │                   ▲                │
│                         ▼                   │                │
│   ┌─────────┐     ┌──────────┐     ┌───────────────┐        │
│   │  minio  │     │  studio  │     │    pgmeta     │        │
│   │ :9000   │     │  :8080   │     │    :3001      │        │
│   └─────────┘     └──────────┘     └───────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 常用命令

```bash
# 启动所有服务
docker compose up -d

# 重新构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f          # 所有服务
docker compose logs -f web      # 只看应用日志
docker compose logs -f db       # 只看数据库日志

# 停止服务
docker compose down

# 停止并删除数据
docker compose down -v

# 重启单个服务
docker compose restart web
docker compose restart postgrest

# 进入数据库
docker compose exec db psql -U promptminder -d promptminder

# 查看服务状态
docker compose ps
```

## 🗄️ 数据持久化

数据存储在 Docker volumes 中：

- `promptminder-db-data`: PostgreSQL 数据
- `promptminder-minio-data`: MinIO 文件存储

### 备份数据

```bash
# 备份数据库
docker compose exec db pg_dump -U promptminder promptminder > backup.sql

# 恢复数据库
cat backup.sql | docker compose exec -T db psql -U promptminder promptminder
```

### 清理数据重新初始化

```bash
# 停止服务并删除数据卷
docker compose down -v

# 重新启动（会自动执行初始化脚本）
docker compose up -d --build
```

## ❓ 常见问题

### Q: 数据库初始化脚本没有执行？

A: 数据库初始化脚本只在首次创建数据库时执行。如果需要重新初始化：
```bash
docker compose down -v
docker compose up -d --build
```

### Q: JWT 相关错误？

A: 确保 `SUPABASE_ANON_KEY` 和 `SUPABASE_SERVICE_ROLE_KEY` 是使用相同的 `JWT_SECRET` 生成的有效 JWT token。

### Q: 权限被拒绝 (permission denied)？

A: 检查：
1. JWT 密钥配置是否正确
2. 数据库角色权限是否已正确设置（初始化脚本会自动处理）

### Q: 如何更新应用？

```bash
git pull
docker compose up -d --build web
```

## 文件结构

```
promptMinder/
├── docker-compose.yml       # Docker Compose 配置
├── Dockerfile               # 应用构建文件
├── .env.example             # 环境变量模板
├── .env                     # 环境变量配置（需创建）
├── docker/
│   ├── init-db/
│   │   └── 01-init.sql     # 数据库初始化脚本
│   └── kong/
│       └── kong.yml        # Kong 网关配置
└── scripts/
    └── deploy.sh           # 一键部署脚本
```

```bash
docker build -t promptminder:0.1.0 .


docker-compose up -d --build
```