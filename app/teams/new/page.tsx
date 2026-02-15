"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTeam } from "@/contexts/team-context";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function CreateTeamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refresh, teams } = useTeam();
  const { t } = useLanguage();

  // 提供默认翻译对象作为后备
  const safeT = t || {
    createTeamPage: {
      nameRequired: "请输入团队名称",
      createSuccess: "团队创建成功",
      createError: "创建团队失败",
      backToTeams: "返回团队管理",
      title: "创建新团队",
      subtitle: "创建一个新的团队来协作管理提示词",
      teamNameLabel: "团队名称",
      teamNamePlaceholder: "请输入团队名称",
      descriptionLabel: "团队描述",
      descriptionPlaceholder: "请输入团队描述（可选）",
      cancel: "取消",
      creating: "创建中...",
      create: "创建团队",
      limitReachedTitle: "无法创建团队",
      limitReachedDesc: "您已达到创建团队的数量上限（最多2个）。请先删除现有团队或联系管理员。"
    }
  };
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast({
        variant: "destructive",
        description: safeT.createTeamPage.nameRequired,
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description || null,
          avatarUrl: null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "创建团队失败");
      }

      await response.json();
      toast({ description: safeT.createTeamPage.createSuccess });
      await refresh();
      router.push("/teams");
      router.refresh();
    } catch (error) {
      console.error("[CreateTeamPage] create error", error);
      toast({
        variant: "destructive",
        description: error.message || safeT.createTeamPage.createError,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Button
          variant="ghost"
          className="mb-8 transition-all duration-200 hover:bg-muted/50"
          asChild
        >
          <Link href="/teams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {safeT.createTeamPage.backToTeams}
          </Link>
        </Button>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-3xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              {safeT.createTeamPage.title}
            </CardTitle>
            <p className="text-muted-foreground leading-relaxed">
              {safeT.createTeamPage.subtitle}
            </p>
          </CardHeader>
          
          {teams.filter(m => m.role === 'owner').length >= 2 && (
            <div className="px-8 pb-4">
              <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                <p className="font-medium">
                  {safeT.createTeamPage?.limitReachedTitle || '无法创建团队'}
                </p>
                <p className="mt-1">
                  {safeT.createTeamPage?.limitReachedDesc || '您已达到创建团队的数量上限（最多2个）。请先删除现有团队或联系管理员。'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8 px-8">
              <div className="space-y-3">
                <Label htmlFor="team-name" className="text-sm font-semibold">
                  {safeT.createTeamPage.teamNameLabel}
                </Label>
                <Input
                  id="team-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder={safeT.createTeamPage.teamNamePlaceholder}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="team-description" className="text-sm font-semibold">
                  {safeT.createTeamPage.descriptionLabel}
                </Label>
                <Input
                  id="team-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder={safeT.createTeamPage.descriptionPlaceholder}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 px-8 pb-8">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
                disabled={submitting}
                className="transition-all duration-200 hover:bg-muted"
              >
                {safeT.createTeamPage.cancel}
              </Button>
              <Button
                type="submit"
                disabled={submitting || teams.filter(m => m.role === 'owner').length >= 2}
                className="transition-all duration-200 hover:shadow-md hover:scale-[1.02] bg-gradient-to-r from-primary to-primary/90"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? safeT.createTeamPage.creating : safeT.createTeamPage.create}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
