"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTeam } from "@/contexts/team-context";
import { ArrowLeft, Loader2, Mail, Users, Clock } from "lucide-react";

export default function TeamInvitesPage() {
  const { toast } = useToast();
  const { acceptInvite, refresh } = useTeam();
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState([]);
  const [acceptingId, setAcceptingId] = useState(null);

  const loadInvites = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/teams/invites");
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "获取邀请失败");
      }
      const payload = await response.json();
      setInvites(payload.invites || []);
    } catch (error) {
      console.error("[TeamInvitesPage] load error", error);
      toast({
        variant: "destructive",
        description: error.message || "获取邀请失败",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const handleAcceptInvite = async (teamId) => {
    setAcceptingId(teamId);
    try {
      await acceptInvite(teamId);
      toast({ description: "已加入团队" });
      await refresh();
      await loadInvites();
    } catch (error) {
      console.error("[TeamInvitesPage] accept error", error);
      toast({
        variant: "destructive",
        description: error.message || "接受邀请失败",
      });
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
        <Button 
          variant="ghost" 
          asChild
          className="transition-all duration-200 hover:bg-muted/50"
        >
          <Link href="/teams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回团队管理
          </Link>
        </Button>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  团队邀请
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  查看你收到的团队邀请，接受后即可加入对应团队。
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-border/50 p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-60" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                ))}
              </div>
            ) : invites.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="p-4 rounded-full bg-muted/30">
                  <Mail className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">当前没有新的团队邀请</p>
                  <p className="text-sm text-muted-foreground">收到邀请后会在这里显示</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={loadInvites}
                  className="transition-all duration-200 hover:bg-muted"
                >
                  刷新
                </Button>
              </div>
            ) : (
              invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col gap-4 rounded-xl border border-border/50 p-6 transition-all duration-200 hover:shadow-md hover:border-primary/30 bg-gradient-to-br from-card to-muted/10 sm:flex-row sm:items-center sm:justify-between"
                >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-lg font-bold">
                      {(invite.team?.name?.charAt(0) || "?").toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {invite.team?.name || "未命名团队"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge variant="secondary" className="font-medium">
                          {invite.role === "admin" ? "管理员" : "成员"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {invite.invited_at && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {new Date(invite.invited_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  {invite.team?.description && (
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed p-3 rounded-lg bg-muted/20 border border-border/30">
                      {invite.team.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleAcceptInvite(invite.team_id)}
                    disabled={acceptingId === invite.team_id}
                    className="transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                  >
                    {acceptingId === invite.team_id && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    接受邀请
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
        <CardFooter className="flex justify-end bg-muted/10 rounded-b-lg">
          <Button 
            variant="outline" 
            onClick={loadInvites}
            disabled={loading}
            className="transition-all duration-200 hover:bg-muted"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            刷新列表
          </Button>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
}
