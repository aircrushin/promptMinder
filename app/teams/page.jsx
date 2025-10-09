"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTeam } from "@/contexts/team-context";
import { useUser } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Plus,
  Shield,
  Users,
  UserMinus,
  UserPlus,
  ArrowRightLeft,
  RefreshCw,
  Trash2,
  Mail,
} from "lucide-react";

export default function TeamsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const { t } = useLanguage();

  const ROLE_LABELS = {
    owner: t.teamsPage.ownerRole,
    admin: t.teamsPage.admin,
    member: t.teamsPage.member,
  };
  const {
    teams,
    activeTeam,
    activeTeamId,
    activeMembership,
    selectTeam,
    refresh,
    acceptInvite,
    leaveTeam,
    deleteTeam,
    loading: teamLoading,
  } = useTeam();
  const [teamDetails, setTeamDetails] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "member" });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isManager = useMemo(() => {
    return (
      activeMembership &&
      (activeMembership.role === "admin" || activeMembership.role === "owner")
    );
  }, [activeMembership]);

  const isOwner = activeMembership?.role === "owner";
  const isPersonalTeam = activeTeam?.is_personal;

  useEffect(() => {
    if (activeTeamId) {
      loadTeam(activeTeamId);
    } else {
      setTeamDetails(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeamId, refreshKey]);

  const handleDeleteDialogChange = useCallback((nextOpen) => {
    setDeleteOpen(nextOpen);
    if (!nextOpen) {
      setDeleteConfirm("");
      setDeleteLoading(false);
    }
  }, []);

  const loadTeam = async (teamId) => {
    if (!teamId) {
      setTeamDetails(null);
      return;
    }

    setMembersLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || t.teamsPage.loadTeamError);
      }
      const payload = await response.json();
      
      // 验证数据完整性
      if (!payload.team || typeof payload.team !== 'object') {
        throw new Error(t.teamsPage.teamDataFormatError);
      }
      
      // 确保members数组存在
      if (!Array.isArray(payload.members)) {
        payload.members = [];
      }
      
      setTeamDetails(payload);
      setEditForm({
        name: payload.team.name || "",
        description: payload.team.description || "",
      });
    } catch (error) {
      console.error("[TeamsPage] load error", error);
      toast({
        variant: "destructive",
        description: error.message || t.teamsPage.loadTeamError,
        duration: 2000,
      });
      setTeamDetails(null);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteForm.email.trim()) {
      toast({
        variant: "destructive",
        description: t.teamsPage.inviteEmailRequired,
      });
      return;
    }

    try {
      const response = await fetch(`/api/teams/${activeTeamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteForm.email.trim(),
          role: inviteForm.role,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || t.teamsPage.inviteMemberError);
      }

      toast({
        description: t.teamsPage.inviteSent,
      });
      setInviteForm({ email: "", role: "member" });
      setInviteOpen(false);
      refresh();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("[TeamsPage] invite error", error);
      toast({
        variant: "destructive",
        description: error.message || t.teamsPage.inviteMemberError,
      });
    }
  };

  const handleUpdateMember = async (userId, updates) => {
    try {
      const response = await fetch(`/api/teams/${activeTeamId}/members/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || t.teamsPage.updateMemberError);
      }

      toast({ description: t.teamsPage.memberUpdated });
      setRefreshKey((prev) => prev + 1);
      refresh();
    } catch (error) {
      console.error("[TeamsPage] update member error", error);
      toast({
        variant: "destructive",
        description: error.message || t.teamsPage.updateMemberError,
      });
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const response = await fetch(`/api/teams/${activeTeamId}/members/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || t.teamsPage.removeMemberError);
      }

      toast({ description: t.teamsPage.memberRemoved });
      setRefreshKey((prev) => prev + 1);
      refresh();
    } catch (error) {
      console.error("[TeamsPage] remove member error", error);
      toast({
        variant: "destructive",
        description: error.message || t.teamsPage.removeMemberError,
      });
    }
  };

  const handleSaveTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${activeTeamId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || t.teamsPage.updateTeamError);
      }

      toast({ description: t.teamsPage.teamUpdated });
      setEditOpen(false);
      setRefreshKey((prev) => prev + 1);
      refresh();
    } catch (error) {
      console.error("[TeamsPage] update team error", error);
      toast({
        variant: "destructive",
        description: error.message || t.teamsPage.updateTeamError,
      });
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTarget) {
      toast({
        variant: "destructive",
        description: t.teamsPage.selectTransferTarget,
      });
      return;
    }

    try {
      const response = await fetch(`/api/teams/${activeTeamId}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId: transferTarget }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || t.teamsPage.transferOwnershipError);
      }

      toast({ description: t.teamsPage.ownershipTransferred });
      setTransferOpen(false);
      setTransferTarget("");
      setRefreshKey((prev) => prev + 1);
      refresh();
    } catch (error) {
      console.error("[TeamsPage] transfer ownership error", error);
      toast({
        variant: "destructive",
        description: error.message || t.teamsPage.transferOwnershipError,
      });
    }
  };

  const handleDeleteTeam = async () => {
    if (!activeTeamId || !activeTeam) {
      return;
    }

    if (deleteConfirm.trim() !== activeTeam.name) {
      toast({
        variant: "destructive",
        description: t.teamsPage.deleteConfirmRequired,
      });
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteTeam(activeTeamId);
      toast({ description: t.teamsPage.teamDeleted });
      setDeleteOpen(false);
      setDeleteConfirm("");
      setTeamDetails(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("[TeamsPage] delete team error", error);
      toast({
        variant: "destructive",
        description: error.message || t.teamsPage.deleteTeamError,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    try {
      await leaveTeam(activeTeamId);
      toast({ description: t.teamsPage.leftTeam });
      setRefreshKey((prev) => prev + 1);
      refresh();
    } catch (error) {
      console.error("[TeamsPage] leave team error", error);
      toast({
        variant: "destructive",
        description: error.message || t.teamsPage.leaveTeamError,
      });
    }
  };

  const handleAcceptInvite = async (teamId) => {
    try {
      await acceptInvite(teamId);
      toast({ description: t.teamsPage.joinedTeam });
      setRefreshKey((prev) => prev + 1);
      refresh();
    } catch (error) {
      console.error("[TeamsPage] accept invite error", error);
      toast({
        variant: "destructive",
        description: error.message || t.teamsPage.acceptInviteError,
      });
    }
  };

  const transferableMembers = useMemo(() => {
    if (!teamDetails?.members) return [];
    return teamDetails.members.filter(
      (member) => (member.user_id && member.user_id !== activeMembership?.userId) && member.status === "active"
    );
  }, [teamDetails, activeMembership]);

  const currentUserDisplayName = useMemo(() => {
    if (!user) return null;
    return user.fullName || user.username || user.primaryEmailAddress?.emailAddress || user.id;
  }, [user]);

  const ownerDisplayName = useMemo(() => {
    if (!teamDetails?.team) return "";
    if (teamDetails.team.owner_display_name) {
      return teamDetails.team.owner_display_name;
    }
    const ownerMembership = teamDetails.members?.find((member) => member.role === "owner");
    if (ownerMembership) {
      return ownerMembership.display_name || ownerMembership.email || ownerMembership.user_id || "团队拥有者";
    }
    if (teamDetails.team.owner_id === user?.id) {
      return currentUserDisplayName || teamDetails.team.owner_id;
    }
    return teamDetails.team.owner_id;
  }, [teamDetails, user, currentUserDisplayName]);

  const formatMemberIdentifier = useCallback((member) => {
    return member.display_name || member.email || member.user_id || "待邀请成员";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t.teamsPage.title}
            </h1>
            <p className="text-muted-foreground mt-2 text-base">
              {t.teamsPage.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => selectTeam(activeTeamId)} 
              disabled={teamLoading}
              className="transition-all duration-200 hover:bg-muted/50"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", teamLoading && "animate-spin")} />
              {t.teamsPage.refresh}
            </Button>
            <Button 
              onClick={() => router.push("/teams/new")}
              className="transition-all duration-200 hover:shadow-md hover:scale-[1.02] bg-gradient-to-r from-primary to-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.teamsPage.createTeam}
            </Button>
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl">
              {activeTeam ? activeTeam.name : t.teamsPage.noTeamSelected}
            </CardTitle>
            {activeTeam && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{t.teamsPage.role}：{ROLE_LABELS[activeMembership?.role] || t.teamsPage.unknownRole}</span>
                {/* <span>团队 ID：{activeTeam.id}</span> */}
                {activeTeam.is_personal && <Badge variant="secondary">{t.teamsPage.personalSpace}</Badge>}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Select
              value={activeTeamId || undefined}
              onValueChange={selectTeam}
              disabled={teamLoading || teams.length === 0}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder={t.teamsPage.selectTeam} />
              </SelectTrigger>
              <SelectContent>
                {teams.map((membership) => (
                  <SelectItem key={membership.team.id} value={membership.team.id}>
                    {membership.team.name}{" "}
                    {membership.status === "pending" ? t.teamsPage.pending : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!activeTeam && teams.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t.teamsPage.noTeamsMessage}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {membersLoading && !teamDetails ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border p-4 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ) : teamDetails ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent p-5 transition-all duration-200 hover:shadow-md hover:border-primary/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    {t.teamsPage.owner}
                  </div>
                  <p className="mt-3 text-lg font-semibold truncate">
                    {ownerDisplayName || teamDetails.team.owner_id}
                  </p>
                </div>
                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-blue-500/5 to-transparent p-5 transition-all duration-200 hover:shadow-md hover:border-blue-500/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="p-1.5 rounded-md bg-blue-500/10">
                      <Users className="h-4 w-4 text-blue-500" />
                    </div>
                    {t.teamsPage.membersCount}
                  </div>
                  <p className="mt-3 text-lg font-semibold">
                    {teamDetails.members?.filter((m) => m.status === "active").length || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-amber-500/5 to-transparent p-5 transition-all duration-200 hover:shadow-md hover:border-amber-500/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="p-1.5 rounded-md bg-amber-500/10">
                      <Mail className="h-4 w-4 text-amber-500" />
                    </div>
                    {t.teamsPage.pendingInvites}
                  </div>
                  <p className="mt-3 text-lg font-semibold">
                    {teamDetails.members?.filter((m) => m.status === "pending").length || 0}
                  </p>
                </div>
              </div>

              {teamDetails.team.description && (
                <div className="rounded-lg bg-muted/30 p-4 border border-border/40">
                  <h3 className="text-sm font-medium text-muted-foreground">{t.teamsPage.teamDescription}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                    {teamDetails.team.description}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {isManager && !isPersonalTeam && (
                  <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t.teamsPage.inviteMember}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t.teamsPage.inviteMemberDialog.title}</DialogTitle>
                        <DialogDescription>
                          {t.teamsPage.inviteMemberDialog.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">{t.teamsPage.inviteMemberDialog.emailLabel}</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder={t.teamsPage.inviteMemberDialog.emailPlaceholder}
                            value={inviteForm.email}
                            onChange={(event) =>
                              setInviteForm((prev) => ({
                                ...prev,
                                email: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-role">{t.teamsPage.inviteMemberDialog.roleLabel}</Label>
                          <Select
                            value={inviteForm.role}
                            onValueChange={(value) =>
                              setInviteForm((prev) => ({
                                ...prev,
                                role: value,
                              }))
                            }
                          >
                            <SelectTrigger id="invite-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">{t.teamsPage.member}</SelectItem>
                              <SelectItem value="admin">{t.teamsPage.admin}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteOpen(false)}>
                          {t.teamsPage.inviteMemberDialog.cancel}
                        </Button>
                        <Button onClick={handleInviteMember}>{t.teamsPage.inviteMemberDialog.sendInvite}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {isManager && (
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary">{t.teamsPage.editTeam}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t.teamsPage.editTeamDialog.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="team-name">{t.teamsPage.editTeamDialog.teamNameLabel}</Label>
                          <Input
                            id="team-name"
                            value={editForm.name}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, name: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="team-description">{t.teamsPage.editTeamDialog.teamDescriptionLabel}</Label>
                          <Input
                            id="team-description"
                            value={editForm.description}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                            placeholder={t.teamsPage.editTeamDialog.descriptionPlaceholder}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                          {t.teamsPage.editTeamDialog.cancel}
                        </Button>
                        <Button onClick={handleSaveTeam}>{t.teamsPage.editTeamDialog.save}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {isOwner && transferableMembers.length > 0 && (
                  <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        {t.teamsPage.transferOwnership}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t.teamsPage.transferOwnershipDialog.title}</DialogTitle>
                        <DialogDescription>
                          {t.teamsPage.transferOwnershipDialog.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label className="mb-2 block text-sm font-medium">{t.teamsPage.transferOwnershipDialog.selectMemberLabel}</Label>
                        <Select value={transferTarget} onValueChange={setTransferTarget}>
                          <SelectTrigger>
                            <SelectValue placeholder={t.teamsPage.transferOwnershipDialog.selectMemberPlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {transferableMembers.map((member) => (
                              <SelectItem key={member.user_id || member.email} value={member.user_id || member.email}>
                                {formatMemberIdentifier(member)}（{ROLE_LABELS[member.role] || member.role}）
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setTransferOpen(false)}>
                          {t.teamsPage.transferOwnershipDialog.cancel}
                        </Button>
                        <Button onClick={handleTransferOwnership}>{t.teamsPage.transferOwnershipDialog.transfer}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {isOwner && !isPersonalTeam && (
                  <Dialog open={deleteOpen} onOpenChange={handleDeleteDialogChange}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t.teamsPage.deleteTeam}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t.teamsPage.deleteTeamDialog.title}</DialogTitle>
                        <DialogDescription>
                          {t.teamsPage.deleteTeamDialog.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-2">
                        <p className="text-sm text-muted-foreground">
                          {t.teamsPage.deleteTeamDialog.confirmLabel} <span className="font-semibold">{activeTeam?.name}</span>
                        </p>
                        <Input
                          value={deleteConfirm}
                          onChange={(event) => setDeleteConfirm(event.target.value)}
                          placeholder={t.teamsPage.deleteTeamDialog.confirmPlaceholder}
                          autoFocus
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => handleDeleteDialogChange(false)} disabled={deleteLoading}>
                          {t.teamsPage.deleteTeamDialog.cancel}
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteTeam} disabled={deleteLoading}>
                          {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {t.teamsPage.deleteTeamDialog.delete}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {!isPersonalTeam && (
                  <Button variant="outline" asChild>
                    <Link href="/teams/invites">查看邀请</Link>
                  </Button>
                )}

                {activeMembership && activeMembership.role !== "owner" && (
                  <Button variant="destructive" onClick={handleLeaveTeam}>
                    <UserMinus className="mr-2 h-4 w-4" />
                    {t.teamsPage.leaveTeam}
                  </Button>
                )}
              </div>
            </>
          ) : null}

          {teamDetails && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">团队成员</h2>
                {membersLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在加载
                  </div>
                )}
              </div>
              <div className="overflow-x-auto rounded-lg border border-border/50 bg-card/50">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">成员</th>
                      <th className="px-4 py-3 font-semibold">角色</th>
                      <th className="px-4 py-3 font-semibold">状态</th>
                      <th className="px-4 py-3 font-semibold">加入时间</th>
                      <th className="px-4 py-3 font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card/30">
                    {teamDetails.members?.map((member) => (
                      <tr key={member.user_id || member.email} className="transition-colors duration-150 hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-semibold">
                              {(formatMemberIdentifier(member).charAt(0) || "?").toUpperCase()}
                            </div>
                            <span className="truncate max-w-[200px]">{formatMemberIdentifier(member)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={member.role === "owner" ? "default" : "secondary"} className="font-medium">
                            {ROLE_LABELS[member.role] || member.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {member.status === "active" ? (
                            <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-400">已加入</Badge>
                          ) : member.status === "pending" ? (
                            <Badge variant="secondary" className="border-amber-500/50 text-amber-600 dark:text-amber-400">待确认</Badge>
                          ) : (
                            member.status
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {member.joined_at
                            ? new Date(member.joined_at).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {member.status === "pending" && member.user_id === activeMembership?.userId && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleAcceptInvite(activeTeamId)}
                              >
                                接受邀请
                              </Button>
                            )}
                            {isManager && member.status === "pending" && (member.user_id && member.user_id !== activeMembership?.userId) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateMember(member.user_id, { status: "active" })
                                }
                              >
                                标记为已加入
                              </Button>
                            )}
                            {isManager &&
                              (member.user_id && member.user_id !== activeTeam?.owner_id) &&
                              member.status === "active" && (
                                <>
                                  {member.role !== "admin" && member.role !== "owner" && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() =>
                                        handleUpdateMember(member.user_id, { role: "admin" })
                                      }
                                    >
                                      升级为管理员
                                    </Button>
                                  )}
                                  {member.role === "admin" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleUpdateMember(member.user_id, { role: "member" })
                                      }
                                    >
                                      降级为成员
                                    </Button>
                                  )}
                                </>
                              )}
                            {isManager && (member.user_id && member.user_id !== activeTeam?.owner_id) && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveMember(member.user_id)}
                              >
                                移除
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
        {!teamDetails && !membersLoading && (
          <CardFooter className="flex flex-col items-center gap-4 py-12 bg-muted/10 rounded-b-lg">
            {teams.length === 0 ? (
              <>
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground text-base">
                    你还没有任何团队，创建一个团队开始协作吧。
                  </p>
                  <Button 
                    onClick={() => router.push("/teams/new")}
                    className="transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    创建团队
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-base">请选择一个团队以查看详细信息。</p>
            )}
          </CardFooter>
        )}
      </Card>
      </div>
    </div>
  );
}
