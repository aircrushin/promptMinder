'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PromptCompare({ baseline, variant, variantName }) {
  // 简单的文本差异检测
  const getDifferences = (text1, text2) => {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const maxLen = Math.max(words1.length, words2.length);
    const differences = [];
    
    for (let i = 0; i < maxLen; i++) {
      if (words1[i] !== words2[i]) {
        differences.push({
          index: i,
          baseline: words1[i] || '',
          variant: words2[i] || ''
        });
      }
    }
    
    return differences;
  };

  // 高亮文本中的差异
  const highlightDifferences = (text, isBaseline) => {
    if (!baseline || !variant) return text;
    
    const differences = getDifferences(baseline.content, variant.content);
    if (differences.length === 0) return text;

    const words = text.split(/\s+/);
    
    return words.map((word, index) => {
      const hasDiff = differences.some(d => d.index === index);
      
      if (hasDiff) {
        return (
          <span
            key={index}
            className={isBaseline ? 'bg-red-100 text-red-900 px-1 rounded' : 'bg-green-100 text-green-900 px-1 rounded'}
          >
            {word}{' '}
          </span>
        );
      }
      
      return <span key={index}>{word} </span>;
    });
  };

  if (!baseline || !variant) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        请选择要对比的提示词
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 基准版本 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">基准版本 (Baseline)</CardTitle>
            <Badge variant="secondary">原始</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{baseline.title}</p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="text-sm whitespace-pre-wrap">
              {highlightDifferences(baseline.content, true)}
            </div>
          </ScrollArea>
          
          {baseline.version && (
            <div className="mt-4 text-xs text-muted-foreground">
              版本: {baseline.version}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 变体版本 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              变体 {variantName?.toUpperCase() || 'A'}
            </CardTitle>
            <Badge>测试中</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{variant.title}</p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="text-sm whitespace-pre-wrap">
              {highlightDifferences(variant.content, false)}
            </div>
          </ScrollArea>
          
          {variant.version && (
            <div className="mt-4 text-xs text-muted-foreground">
              版本: {variant.version}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 差异统计 */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">对比摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">基准字数</div>
              <div className="text-2xl font-bold">
                {baseline.content.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">变体字数</div>
              <div className="text-2xl font-bold">
                {variant.content.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">字数变化</div>
              <div className={`text-2xl font-bold ${
                variant.content.length > baseline.content.length 
                  ? 'text-green-600' 
                  : variant.content.length < baseline.content.length 
                  ? 'text-red-600' 
                  : ''
              }`}>
                {variant.content.length > baseline.content.length ? '+' : ''}
                {variant.content.length - baseline.content.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">相似度</div>
              <div className="text-2xl font-bold">
                {Math.round(
                  (1 - getDifferences(baseline.content, variant.content).length / 
                  Math.max(baseline.content.split(/\s+/).length, variant.content.split(/\s+/).length)) * 100
                )}%
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-sm">
                <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded mr-2"></span>
                <span className="text-muted-foreground">红色高亮表示基准版本中的文本</span>
              </div>
              <div className="text-sm ml-4">
                <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></span>
                <span className="text-muted-foreground">绿色高亮表示变体版本中的文本</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
