"""
PromptMinder 数据迁移脚本
从 Supabase CSV 导出导入到 Neon PostgreSQL

用法: python import_all.py
"""

import os
import pandas as pd
from sqlalchemy import create_engine, text

# ── 配置 ──────────────────────────────────────────────────────────────────────

# 从环境变量读取，避免硬编码密码
CONN_STR = os.environ.get("NEON_DATABASE_URL")
if not CONN_STR:
    print("错误: 请设置环境变量 NEON_DATABASE_URL")
    print("示例: export NEON_DATABASE_URL='postgresql://user:pass@host/db?sslmode=require'")
    exit(1)

CSV_DIR = os.path.dirname(os.path.abspath(__file__))

# 导入顺序（按外键依赖排列）
IMPORT_ORDER = [
    # 第1层：无外键依赖
    "teams",
    "public_prompts",
    "prompt_contributions",
    "user_feedback",
    "provider_keys",
    # 第2层：依赖第1层
    "team_members",      # FK → teams
    "prompts",           # FK → teams
    # 第3层：依赖第2层
    "tags",              # FK → teams
    "favorites",         # FK → prompts
    "prompt_likes",      # FK → public_prompts
]


# ── 数据清洗函数 ──────────────────────────────────────────────────────────────

def clean_favorites(df, prompts_df):
    """清理引用了不存在 prompt 的收藏记录"""
    valid_ids = set(prompts_df["id"].dropna())
    before = len(df)
    df = df[df["prompt_id"].isin(valid_ids)]
    removed = before - len(df)
    if removed > 0:
        print(f"  ⚠ favorites: 清理了 {removed} 条孤儿记录（引用不存在的 prompt）")
    return df


def clean_prompt_likes(df, public_prompts_df):
    """清理引用了不存在 public_prompt 的点赞记录"""
    valid_ids = set(public_prompts_df["id"].dropna())
    before = len(df)
    df = df[df["prompt_id"].isin(valid_ids)]
    removed = before - len(df)
    if removed > 0:
        print(f"  ⚠ prompt_likes: 清理了 {removed} 条孤儿记录（引用不存在的 public_prompt）")
    return df


def clean_tags(df):
    """tags 表在 Supabase 中没有 created_by 和 updated_at，需要补充"""
    # 清理 team_id 和 user_id 都为空的孤儿标签（违反 chk_tag_scope 约束）
    orphan_mask = df["team_id"].isna() & df["user_id"].isna()
    orphan_count = orphan_mask.sum()
    if orphan_count > 0:
        df = df[~orphan_mask]
        print(f"  ⚠ tags: 清理了 {orphan_count} 条孤儿记录（team_id 和 user_id 都为空）")
    if "created_by" not in df.columns:
        # 用 user_id 填充 created_by（个人标签场景）
        df["created_by"] = df.get("user_id", None)
        print("  ⚠ tags: 补充了 created_by 列（使用 user_id 的值）")
    if "updated_at" not in df.columns:
        # 用 created_at 填充 updated_at
        df["updated_at"] = df["created_at"]
        print("  ⚠ tags: 补充了 updated_at 列（使用 created_at 的值）")
    return df


# ── 主流程 ────────────────────────────────────────────────────────────────────

def load_csv(table_name):
    """加载 CSV 文件"""
    csv_path = os.path.join(CSV_DIR, f"{table_name}_rows.csv")
    if not os.path.exists(csv_path):
        return None
    return pd.read_csv(csv_path)


def main():
    engine = create_engine(CONN_STR)

    # 预加载需要做外键校验的数据
    prompts_df = load_csv("prompts")
    public_prompts_df = load_csv("public_prompts")

    success_count = 0
    skip_count = 0
    fail_count = 0

    for table_name in IMPORT_ORDER:
        csv_path = os.path.join(CSV_DIR, f"{table_name}_rows.csv")

        if not os.path.exists(csv_path):
            print(f"⏭ {table_name}: CSV 文件不存在，跳过")
            skip_count += 1
            continue

        print(f"📦 正在导入 {table_name}...")

        try:
            df = pd.read_csv(csv_path)
            original_count = len(df)

            # 数据清洗
            if table_name == "favorites" and prompts_df is not None:
                df = clean_favorites(df, prompts_df)
            elif table_name == "prompt_likes" and public_prompts_df is not None:
                df = clean_prompt_likes(df, public_prompts_df)
            elif table_name == "tags":
                df = clean_tags(df)

            if len(df) == 0:
                print(f"  ⏭ {table_name}: 清洗后无数据，跳过")
                skip_count += 1
                continue

            # 导入数据
            df.to_sql(
                table_name,
                engine,
                if_exists="append",
                index=False,
                method="multi",
            )

            print(f"  ✅ {table_name}: 成功导入 {len(df)}/{original_count} 条")
            success_count += 1

        except Exception as e:
            print(f"  ❌ {table_name}: 导入失败 - {e}")
            fail_count += 1

    # 汇总
    print("\n" + "=" * 50)
    print(f"导入完成: ✅ 成功 {success_count} | ⏭ 跳过 {skip_count} | ❌ 失败 {fail_count}")
    print("=" * 50)

    # 验证：查询每张表的行数
    print("\n📊 数据库表行数验证:")
    with engine.connect() as conn:
        for table_name in IMPORT_ORDER:
            try:
                result = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
                count = result.scalar()
                print(f"  {table_name}: {count} 条")
            except Exception:
                print(f"  {table_name}: 查询失败")


if __name__ == "__main__":
    main()