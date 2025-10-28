# A/B测试模块实现文档

## 实现概览

本文档记录了A/B测试对比功能的完整实现，包括数据库设计、API实现、前端组件等。

## 文件结构

```
prompt-manage/
├── sql/
│   └── ab_test.sql                          # 数据库表结构
├── app/
│   ├── api/
│   │   └── ab-tests/
│   │       ├── route.js                     # 列表和创建API
│   │       └── [id]/
│   │           ├── route.js                 # 详情、更新、删除API
│   │           ├── start/route.js           # 启动测试API
│   │           ├── stop/route.js            # 停止测试API
│   │           ├── results/route.js         # 结果分析API
│   │           └── record/route.js          # 记录测试数据API
│   └── ab-tests/
│       ├── page.jsx                         # 测试列表页
│       ├── new/page.jsx                     # 创建测试页
│       └── [id]/page.jsx                    # 测试详情页
├── components/
│   └── ab-test/
│       ├── PromptCompare.jsx                # 版本对比组件
│       └── ResultsAnalysis.jsx              # 结果分析组件
└── docs/
    ├── AB_TEST_GUIDE.md                     # 用户使用指南
    └── AB_TEST_IMPLEMENTATION.md            # 本文档
```

## 数据库设计

### 表结构

#### 1. ab_test_experiments (A/B测试实验表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | TEXT | 测试名称 |
| description | TEXT | 测试描述 |
| team_id | UUID | 所属团队ID（可选）|
| baseline_prompt_id | UUID | 基准提示词ID |
| variant_prompt_ids | UUID[] | 变体提示词ID数组 |
| goal_metric | TEXT | 目标指标 |
| target_improvement | FLOAT | 目标提升百分比 |
| traffic_allocation | JSONB | 流量分配配置 |
| status | TEXT | 状态：draft/running/completed/stopped |
| started_at | TIMESTAMPTZ | 开始时间 |
| ended_at | TIMESTAMPTZ | 结束时间 |
| min_sample_size | INTEGER | 最小样本量 |
| current_sample_size | INTEGER | 当前样本量 |
| winner_prompt_id | UUID | 获胜版本ID |
| results | JSONB | 结果摘要 |
| created_by | TEXT | 创建者 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

#### 2. ab_test_results (A/B测试结果表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| experiment_id | UUID | 实验ID |
| prompt_id | UUID | 提示词ID |
| variant_name | TEXT | 变体名称 |
| user_id | TEXT | 用户ID |
| input_text | TEXT | 输入文本 |
| output_text | TEXT | 输出文本 |
| response_time_ms | INTEGER | 响应时间（毫秒）|
| token_count | INTEGER | Token数量 |
| cost | DECIMAL | 成本 |
| user_rating | INTEGER | 用户评分（1-5）|
| user_feedback | TEXT | 用户反馈 |
| success | BOOLEAN | 是否成功 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 索引设计

```sql
-- 实验表索引
CREATE INDEX idx_ab_test_team_id ON ab_test_experiments(team_id);
CREATE INDEX idx_ab_test_created_by ON ab_test_experiments(created_by);
CREATE INDEX idx_ab_test_status ON ab_test_experiments(status);
CREATE INDEX idx_ab_test_baseline_prompt ON ab_test_experiments(baseline_prompt_id);

-- 结果表索引
CREATE INDEX idx_ab_test_results_experiment_id ON ab_test_results(experiment_id);
CREATE INDEX idx_ab_test_results_prompt_id ON ab_test_results(prompt_id);
CREATE INDEX idx_ab_test_results_user_id ON ab_test_results(user_id);
CREATE INDEX idx_ab_test_results_created_at ON ab_test_results(created_at);
```

## API设计

### 1. 列表和创建

**GET /api/ab-tests**
- 查询参数：status（draft/running/completed/stopped）、page、limit
- 返回：实验列表和分页信息

**POST /api/ab-tests**
- 请求体：测试配置
- 验证：检查提示词权限、避免重复选择
- 返回：新创建的实验

### 2. 详情和管理

**GET /api/ab-tests/:id**
- 返回：完整的实验信息，包含基准和变体提示词详情

**PATCH /api/ab-tests/:id**
- 更新实验配置（仅限草稿状态）

**DELETE /api/ab-tests/:id**
- 删除实验及所有相关数据

### 3. 控制操作

**POST /api/ab-tests/:id/start**
- 启动测试，状态变更为 running

**POST /api/ab-tests/:id/stop**
- 停止测试，状态变更为 stopped

### 4. 数据收集和分析

**POST /api/ab-tests/:id/record**
- 记录单次测试结果
- 自动更新样本计数

**GET /api/ab-tests/:id/results**
- 计算统计指标：
  - 平均评分、成本、响应时间
  - 成功率
  - 改进百分比
  - 统计显著性
- 判定获胜版本

## 前端组件

### 1. ABTestsPage (列表页)
- 功能：
  - 显示所有A/B测试
  - 状态筛选
  - 进度显示
  - 快速跳转到详情

### 2. NewABTestPage (创建页)
- 功能：
  - 配置测试基本信息
  - 选择基准和变体提示词
  - 设置目标指标和样本量
  - 从URL参数自动填充基准版本

### 3. ABTestDetailPage (详情页)
- 标签页：
  - 概览：基本信息和快速预览
  - 版本对比：并排对比提示词
  - 结果分析：详细的统计数据
- 操作：
  - 启动/停止测试
  - 删除测试

### 4. PromptCompare (对比组件)
- 功能：
  - 并排显示两个版本
  - 差异高亮（红色删除，绿色新增）
  - 字数统计和相似度计算

### 5. ResultsAnalysis (分析组件)
- 功能：
  - 测试概况卡片
  - 获胜版本展示
  - 详细指标对比
  - 改进百分比和趋势图标
  - 统计显著性提示

## 集成点

### 提示词详情页集成
在 `components/prompt/PromptHeader.jsx` 中添加了 "A/B测试" 按钮：
- 点击后跳转到创建页面
- 自动将当前提示词设为基准版本

## 数据流

```
1. 创建测试
   用户输入 → POST /api/ab-tests → 数据库插入 → 返回测试ID

2. 启动测试
   点击启动 → POST /api/ab-tests/:id/start → 更新状态为 running

3. 收集数据
   应用调用 → POST /api/ab-tests/:id/record → 插入结果 → 更新样本计数

4. 查看结果
   访问结果页 → GET /api/ab-tests/:id/results → 计算统计 → 展示分析

5. 停止测试
   点击停止 → POST /api/ab-tests/:id/stop → 更新状态为 stopped
```

## 统计算法

### 1. 基础统计
- 平均值：sum / count
- 成功率：success_count / total_count * 100

### 2. 改进计算
```javascript
// 对于user_rating、success_rate（越高越好）
improvement = ((variant - baseline) / baseline) * 100

// 对于cost、response_time（越低越好）
improvement = ((baseline - variant) / baseline) * 100
```

### 3. 统计显著性（简化版）
- 样本量 >= 30 per variant
- 改进幅度 >= 10%
- 实际应用建议使用更严格的t-test或chi-square检验

### 4. 获胜者判定
根据目标指标排序所有版本，第一名为获胜者。

## 权限控制

### 团队模式
- 只能访问团队内的实验
- 需要成员权限查看
- 需要管理员/所有者权限进行操作

### 个人模式
- 只能访问自己创建的实验
- 完全控制权限

## 部署步骤

### 1. 执行数据库迁移
```bash
psql -U username -d database_name -f sql/ab_test.sql
```

### 2. 验证表创建
```sql
SELECT * FROM ab_test_experiments LIMIT 1;
SELECT * FROM ab_test_results LIMIT 1;
```

### 3. 重启应用
```bash
npm run build
npm start
```

### 4. 访问功能
- 列表页：`http://localhost:3000/ab-tests`
- 创建页：`http://localhost:3000/ab-tests/new`

## 测试清单

### 功能测试
- [ ] 创建A/B测试（手动选择）
- [ ] 创建A/B测试（从提示词详情页）
- [ ] 启动测试
- [ ] 停止测试
- [ ] 删除测试
- [ ] 记录测试数据
- [ ] 查看结果分析
- [ ] 版本对比展示

### 权限测试
- [ ] 团队成员只能看到团队测试
- [ ] 个人用户只能看到自己的测试
- [ ] 管理员可以管理团队测试

### 边界测试
- [ ] 空数据状态
- [ ] 大量数据加载
- [ ] 并发数据记录
- [ ] 错误处理

## 性能优化

### 已实现
- 数据库索引优化
- API分页查询
- 前端懒加载

### 待优化
- 结果计算缓存
- 实时数据推送（WebSocket）
- 大数据量的聚合查询优化

## 已知限制

1. 统计显著性检测较为简化，建议样本量>=100
2. 不支持实时自动流量分配
3. 不支持多变量测试
4. 结果分析不包含置信区间等高级统计

## 后续改进

### 短期
- [ ] 添加更多图表可视化（折线图、柱状图）
- [ ] 导出测试报告（PDF/CSV）
- [ ] 邮件通知测试完成

### 中期
- [ ] 自动流量分配算法（Multi-Armed Bandit）
- [ ] 更严格的统计检验（t-test、chi-square）
- [ ] 多变量测试支持

### 长期
- [ ] 实时监控和告警
- [ ] 预测性分析
- [ ] 自动化优化建议

## 维护注意事项

1. **定期清理旧数据**
   - 已完成超过90天的测试可考虑归档
   - 定期清理测试结果表

2. **监控数据库性能**
   - 关注结果表的增长速度
   - 必要时添加分区表

3. **更新统计算法**
   - 根据实际使用反馈优化算法
   - 考虑引入专业统计库

## 相关资源

- [PRD文档](../PRD_Prompt_Analysis_Optimization.md) - 完整的产品需求文档
- [用户指南](./AB_TEST_GUIDE.md) - 面向用户的使用指南
- [Supabase文档](https://supabase.com/docs) - 数据库相关
- [Next.js文档](https://nextjs.org/docs) - 框架文档

## 更新日志

### v1.0.0 (2025-10-26)
- ✅ 初始版本发布
- ✅ 基础A/B测试功能
- ✅ 版本对比功能
- ✅ 结果分析功能
- ✅ 团队权限支持
