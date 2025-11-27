#!/bin/bash
# =====================================================
# PromptMinder 一键部署脚本
# =====================================================

set -e

echo "🚀 PromptMinder 一键部署脚本"
echo "======================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

# 检查 Docker Compose 是否可用
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装，请先安装 Docker Compose${NC}"
    exit 1
fi

# 确定使用哪个 compose 命令
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo -e "${GREEN}✓ Docker 和 Docker Compose 已安装${NC}"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ 未找到 .env 文件，正在从模板创建...${NC}"
    
    if [ ! -f .env.example ]; then
        echo -e "${RED}❌ .env.example 模板文件不存在${NC}"
        exit 1
    fi
    
    cp .env.example .env
    
    # 生成 JWT 密钥
    echo -e "${YELLOW}⚙ 正在生成 JWT 密钥...${NC}"
    
    # 生成随机的 JWT_SECRET
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    
    # 使用 Node.js 生成 JWT tokens
    if command -v node &> /dev/null; then
        KEYS=$(node -e "
const crypto = require('crypto');
const jwtSecret = '$JWT_SECRET';

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

const anonKey = createJWT({ role: 'anon', iss: 'supabase', iat: now, exp: exp });
const serviceKey = createJWT({ role: 'service_role', iss: 'supabase', iat: now, exp: exp });

console.log(anonKey + '|' + serviceKey);
")
        
        ANON_KEY=$(echo $KEYS | cut -d'|' -f1)
        SERVICE_KEY=$(echo $KEYS | cut -d'|' -f2)
        
        # 更新 .env 文件
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
            sed -i '' "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|" .env
            sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env
            sed -i '' "s|AUTH_SECRET=.*|AUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')|" .env
        else
            # Linux
            sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
            sed -i "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|" .env
            sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env
            sed -i "s|AUTH_SECRET=.*|AUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')|" .env
        fi
        
        echo -e "${GREEN}✓ JWT 密钥已生成并写入 .env 文件${NC}"
    else
        echo -e "${YELLOW}⚠ Node.js 未安装，请手动配置 .env 文件中的 JWT 密钥${NC}"
    fi
fi

# 确保 docker/init-db 目录存在
if [ ! -f docker/init-db/01-init.sql ]; then
    echo -e "${RED}❌ 数据库初始化脚本不存在: docker/init-db/01-init.sql${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 数据库初始化脚本已就绪${NC}"

# 停止现有容器（如果有）
echo -e "${YELLOW}⚙ 停止现有容器...${NC}"
$COMPOSE_CMD down 2>/dev/null || true

# 清理旧的数据卷（可选）
read -p "是否清理旧数据重新初始化？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚙ 清理数据卷...${NC}"
    docker volume rm promptminder-db-data 2>/dev/null || true
    docker volume rm promptminder-minio-data 2>/dev/null || true
fi

# 构建并启动服务
echo -e "${YELLOW}⚙ 构建并启动服务...${NC}"
$COMPOSE_CMD up -d --build

# 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo ""
echo "======================================"
echo -e "${GREEN}✓ 部署完成！${NC}"
echo "======================================"
echo ""
echo "📌 服务地址："
echo "   - 应用: http://localhost:3000"
echo "   - Supabase Studio: http://localhost:8080"
echo "   - MinIO Console: http://localhost:9001"
echo ""
echo "📌 默认账号："
echo "   - 请访问 http://localhost:3000 注册账号"
echo "   - 用户名为 'admin' 的账号将自动成为管理员"
echo ""
echo "📌 查看日志："
echo "   $COMPOSE_CMD logs -f web"
echo ""
echo "📌 停止服务："
echo "   $COMPOSE_CMD down"
echo ""
