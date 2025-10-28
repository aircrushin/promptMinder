-- A/B测试实验表
CREATE TABLE IF NOT EXISTS ab_test_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name TEXT NOT NULL,
    description TEXT,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    
    -- 测试配置
    baseline_prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    variant_prompt_ids UUID[] NOT NULL,
    
    -- 目标指标
    goal_metric TEXT NOT NULL CHECK (goal_metric IN ('user_rating', 'cost', 'success_rate', 'response_time')),
    target_improvement FLOAT,
    
    -- 流量分配
    traffic_allocation JSONB,
    
    -- 测试状态
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'stopped')),
    
    -- 时间范围
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    min_sample_size INTEGER DEFAULT 100,
    current_sample_size INTEGER DEFAULT 0,
    
    -- 结果
    winner_prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
    results JSONB,
    
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_test_team_id ON ab_test_experiments(team_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_created_by ON ab_test_experiments(created_by);
CREATE INDEX IF NOT EXISTS idx_ab_test_status ON ab_test_experiments(status);
CREATE INDEX IF NOT EXISTS idx_ab_test_baseline_prompt ON ab_test_experiments(baseline_prompt_id);

-- A/B测试结果记录表
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES ab_test_experiments(id) ON DELETE CASCADE,
    
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    
    -- 调用信息
    user_id TEXT,
    input_text TEXT,
    output_text TEXT,
    
    -- 性能指标
    response_time_ms INTEGER,
    token_count INTEGER,
    cost DECIMAL(10, 6),
    
    -- 用户反馈
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    success BOOLEAN,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_test_results_experiment_id ON ab_test_results(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_prompt_id ON ab_test_results(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_user_id ON ab_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_created_at ON ab_test_results(created_at);

-- 添加注释
COMMENT ON TABLE ab_test_experiments IS 'A/B测试实验配置表';
COMMENT ON TABLE ab_test_results IS 'A/B测试实验结果记录表';

COMMENT ON COLUMN ab_test_experiments.goal_metric IS '目标指标: user_rating(用户评分), cost(成本), success_rate(成功率), response_time(响应时间)';
COMMENT ON COLUMN ab_test_experiments.traffic_allocation IS '流量分配配置，JSON格式: {"baseline": 50, "variant_a": 25, "variant_b": 25}';
COMMENT ON COLUMN ab_test_experiments.status IS '实验状态: draft(草稿), running(运行中), completed(已完成), stopped(已停止)';
