"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTeam } from "@/contexts/team-context";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function CreateTeamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refresh } = useTeam();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: "",
    description: "",
    isPersonal: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast({
        variant: "destructive",
        description: t.createTeamPage.nameRequired,
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
          isPersonal: form.isPersonal,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "创建团队失败");
      }

      const payload = await response.json();
      toast({ description: t.createTeamPage.createSuccess });
      await refresh();
      router.push("/teams");
      router.refresh();
    } catch (error) {
      console.error("[CreateTeamPage] create error", error);
      toast({
        variant: "destructive",
        description: error.message || t.createTeamPage.createError,
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
          <Link href="/teams" legacyBehavior>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.createTeamPage.backToTeams}
          </Link>
        </Button>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-3xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              {t.createTeamPage.title}
            </CardTitle>
            <p className="text-muted-foreground leading-relaxed">
              {t.createTeamPage.subtitle}
            </p>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8 px-8">
              <div className="space-y-3">
                <Label htmlFor="team-name" className="text-sm font-semibold">
                  {t.createTeamPage.teamNameLabel}
                </Label>
                <Input
                  id="team-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder={t.createTeamPage.teamNamePlaceholder}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="team-description" className="text-sm font-semibold">
                  {t.createTeamPage.descriptionLabel}
                </Label>
                <Input
                  id="team-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder={t.createTeamPage.descriptionPlaceholder}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-5 transition-all duration-200 hover:bg-muted/30">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{t.createTeamPage.personalSpaceLabel}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t.createTeamPage.personalSpaceDescription}
                  </p>
                </div>
                <Switch
                  checked={form.isPersonal}
                  onCheckedChange={(value) =>
                    setForm((prev) => ({ ...prev, isPersonal: value }))
                  }
                  disabled={submitting}
                  className="data-[state=checked]:bg-primary"
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
                {t.createTeamPage.cancel}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="transition-all duration-200 hover:shadow-md hover:scale-[1.02] bg-gradient-to-r from-primary to-primary/90"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? t.createTeamPage.creating : t.createTeamPage.create}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
