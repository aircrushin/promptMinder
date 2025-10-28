# A/B 测试模块使用指南

## 功能概述

A/B测试模块允许您对比不同版本的提示词，通过数据驱动的方式找出最优方案。

## 主要功能

### 1. 创建A/B测试

**两种创建方式：**

#### 方式1：从提示词详情页创建
1. 打开任意提示词详情页
2. 点击右上角的 "A/B测试" 按钮
3. 系统会自动将当前提示词设为基准版本

#### 方式2：从A/B测试列表创建
1. 访问 `/ab-tests` 页面
2. 点击 "创建测试" 按钮
3. 手动选择基准版本和变体版本

**配置参数说明：**

- **测试名称**: 为测试起一个有意义的名称
- **描述**: 说明测试目的和预期效果
- **基准版本 (Baseline)**: 当前使用的提示词版本
- **变体版本 (Variants)**: 要测试的新版本，可添加多个
- **目标指标**: 
  - 用户评分：平均用户满意度
  - 成本：平均API调用成本
  - 成功率：任务成功完成的比例
  - 响应时间：平均响应延迟
- **目标提升**: 期望达到的改进百分比（可选）
- **最小样本量**: 达到此数量后结论才可靠（推荐≥100）

### 2. 启动测试

1. 创建测试后，状态为 "草稿"
2. 在测试详情页点击 "启动测试"
3. 测试开始运行，可以开始收集数据

### 3. 查看版本对比

在测试详情页的 "版本对比" 标签中：
- 并排显示基准版本和变体版本
- 差异高亮显示：
  - 🔴 红色：基准版本中的文本
  - 🟢 绿色：变体版本中的新文本
- 查看字数变化和相似度统计

### 4. 分析测试结果

在 "结果分析" 标签中查看：

**整体概况**
- 当前样本量和完成度
- 目标指标和目标提升
- 进度条显示测试进展

**获胜版本**（测试完成后）
- 自动判定在目标指标上表现最佳的版本
- 显示🏆图标标识

**详细对比**
- 每个版本的详细指标：
  - 平均评分
  - 平均成本
  - 成功率
  - 响应时间
- 相对基准版本的改进百分比
- 统计显著性提示

### 5. 停止或删除测试

- **停止测试**: 暂停数据收集，可随时查看当前结果
- **删除测试**: 永久删除测试及所有相关数据

## 数据收集方式

### 方式1：API记录（推荐）

在您的应用中集成A/B测试数据上报：

```javascript
// 调用提示词后记录结果
async function recordTestResult(experimentId, promptId, variantName, result) {
  await fetch(`/api/ab-tests/${experimentId}/record`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt_id: promptId,
      variant_name: variantName, // 'baseline', 'variant_a', 'variant_b', etc.
      input_text: result.input,
      output_text: result.output,
      response_time_ms: result.responseTime,
      token_count: result.tokens,
      cost: result.cost,
      user_rating: result.rating, // 1-5
      user_feedback: result.feedback,
      success: result.success // true/false
    })
  });
}

// 使用示例
const experimentId = 'your-experiment-id';
const promptId = 'baseline-prompt-id';
const result = await callAI(prompt);
await recordTestResult(experimentId, promptId, 'baseline', result);
```

### 方式2：手动标注

在测试过程中手动记录用户反馈和效果评价。

## 最佳实践

### 1. 测试前准备
- ✅ 明确测试目标和假设
- ✅ 确保变体版本与基准版本只有一个主要差异
- ✅ 设置合理的最小样本量（建议100-200）

### 2. 测试中注意
- ✅ 在相似的条件下测试各版本（时间、用户群体）
- ✅ 避免中途修改测试配置
- ✅ 定期检查数据收集情况

### 3. 结果解读
- ✅ 等待达到最小样本量再做决策
- ✅ 关注统计显著性提示
- ✅ 综合多个指标评估，不只看单一指标
- ✅ 考虑实际业务场景和用户体验

### 4. 常见场景

**场景1：提示词结构优化**
- 基准版本：原始提示词
- 变体A：添加角色定义
- 变体B：添加Few-shot示例
- 目标指标：用户评分

**场景2：成本优化**
- 基准版本：详细的长提示词
- 变体A：精简版本
- 目标指标：成本

**场景3：响应速度优化**
- 基准版本：复杂指令
- 变体A：简化指令
- 目标指标：响应时间

## 数据库结构

### ab_test_experiments 表
存储实验配置和状态

### ab_test_results 表
存储每次测试的详细结果

## API端点

```
GET    /api/ab-tests              # 获取测试列表
POST   /api/ab-tests              # 创建测试
GET    /api/ab-tests/:id          # 获取测试详情
PATCH  /api/ab-tests/:id          # 更新测试
DELETE /api/ab-tests/:id          # 删除测试
POST   /api/ab-tests/:id/start    # 启动测试
POST   /api/ab-tests/:id/stop     # 停止测试
GET    /api/ab-tests/:id/results  # 获取结果分析
POST   /api/ab-tests/:id/record   # 记录测试结果
```

## 故障排除

### Q: 为什么无法启动测试？
A: 确保已选择基准版本和至少一个变体版本。

### Q: 结果分析显示 "暂无测试结果"？
A: 需要先启动测试并开始收集数据。

### Q: 如何判断结果是否可靠？
A: 查看样本量是否达到最小值，以及是否显示 "统计显著性" 提示。

### Q: 可以中途修改测试配置吗？
A: 不建议。如果需要修改，建议停止当前测试并创建新测试。

## 未来计划

- [ ] 自动流量分配和智能路由
- [ ] 更丰富的统计分析（置信区间、p值等）
- [ ] 多变量测试支持
- [ ] 导出详细报告
- [ ] 邮件通知测试完成

## 反馈与支持

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 团队反馈频道
