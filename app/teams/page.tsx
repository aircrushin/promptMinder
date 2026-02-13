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
  Trash2,
  Mail,
} from "lucide-react";

export default function TeamsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const { t } = useLanguage();

  // 提供默认翻译对象作为后备
  const safeT: Record<string, any> = t || {
    teamsPage: {
      title: "团队管理",
      subtitle: "管理你的团队和成员",
      ownerRole: "拥有者",
      admin: "管理员",
      member: "成员",
      loadTeamError: "加载团队失败",
      teamDataFormatError: "团队数据格式错误",
      inviteEmailRequired: "请输入邮箱地址",
      inviteMemberError: "邀请成员失败",
      inviteSent: "邀请已发送",
      updateMemberError: "更新成员失败",
      memberUpdated: "成员已更新",
      removeMemberError: "移除成员失败",
      memberRemoved: "成员已移除",
      updateTeamError: "更新团队失败",
      teamUpdated: "团队已更新",
      selectTransferTarget: "请选择转移目标",
      transferOwnershipError: "转移所有权失败",
      ownershipTransferred: "所有权已转移",
      deleteConfirmRequired: "请输入团队名称确认删除",
      deleteTeamError: "删除团队失败",
      teamDeleted: "团队已删除",
      leftTeam: "已离开团队",
      leaveTeamError: "离开团队失败",
      joinedTeam: "已加入团队",
      acceptInviteError: "接受邀请失败",
      owner: "团队拥有者",
      membersCount: "成员数量",
      pendingInvites: "待处理邀请",
      teamDescription: "团队描述",
      role: "角色",
      unknownRole: "未知角色",
      personalSpace: "个人空间",
      selectTeam: "选择团队",
      pending: "（待确认）",
      noTeamSelected: "未选择团队",
      noTeamsMessage: "暂无可管理的团队",
      refresh: "刷新",
      createTeam: "创建团队",
      limitReached: "已达上限",
      inviteMember: "邀请成员",
      editTeam: "编辑团队",
      transferOwnership: "转移所有权",
      deleteTeam: "删除团队",
      leaveTeam: "离开团队",
      inviteMemberDialog: {
        title: "邀请成员",
        description: "邀请新成员加入你的团队",
        emailLabel: "邮箱地址",
        emailPlaceholder: "请输入邮箱地址",
        roleLabel: "角色",
        cancel: "取消",
        sendInvite: "发送邀请"
      },
      editTeamDialog: {
        title: "编辑团队信息",
        teamNameLabel: "团队名称",
        teamDescriptionLabel: "团队描述",
        descriptionPlaceholder: "请输入团队描述",
        cancel: "取消",
        save: "保存"
      },
      transferOwnershipDialog: {
        title: "转移所有权",
        description: "将团队所有权转移给其他成员",
        selectMemberLabel: "选择新拥有者",
        selectMemberPlaceholder: "请选择成员",
        cancel: "取消",
        transfer: "转移"
      },
      deleteTeamDialog: {
        title: "删除团队",
        description: "此操作不可逆，删除后所有数据将被永久清除",
        confirmLabel: "请输入团队名称确认删除：",
        confirmPlaceholder: "团队名称",
        cancel: "取消",
        delete: "删除团队"
      },
      leaveTeamDialog: {
        title: "离开团队",
        description: "确定要离开这个团队吗？",
        cancel: "取消",
        confirm: "确认离开"
      }
    }
  };

  const ROLE_LABELS = {
    owner: safeT.teamsPage.ownerRole,
    admin: safeT.teamsPage.admin,
    member: safeT.teamsPage.member,
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
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  const isManager = useMemo(() => {
    return (
      activeMembership &&
      (activeMembership.role === "admin" || activeMembership.role === "owner")
    );
  }, [activeMembership]);

  const isOwner = activeMembership?.role === "owner";
  const isPersonalTeam = activeTeam?.is_personal;

  // 自动选择第一个team（如果没有选中team但有可用的teams）
  useEffect(() => {
    if (!teamLoading && !activeTeamId && teams.length > 0) {
      // 优先选择第一个active状态的team
      const activeTeams = teams.filter((membership) => membership.status === "active");
      if (activeTeams.length > 0) {
        selectTeam(activeTeams[0].team.id);
      } else if (teams.length > 0) {
        // 如果没有active的team，选择第一个
        selectTeam(teams[0].team.id);
      }
    }
  }, [teamLoading, activeTeamId, teams, selectTeam]);

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
        throw new Error(payload?.error || safeT.teamsPage.loadTeamError);
      }
      const payload = await response.json();
      
      // 验证数据完整性
      if (!payload.team || typeof payload.team !== 'object') {
        throw new Error(safeT.teamsPage.teamDataFormatError);
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
        description: error.message || safeT.teamsPage.loadTeamError,
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
        description: safeT.teamsPage.inviteEmailRequired,
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
        throw new Error(payload?.error || safeT.teamsPage.inviteMemberError);
      }

      toast({
        description: safeT.teamsPage.inviteSent,
      });
      setInviteForm({ email: "", role: "member" });
      setInviteOpen(false);
      refresh();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("[TeamsPage] invite error", error);
      toast({
        variant: "destructive",
        description: error.message || safeT.teamsPage.inviteMemberError,
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
        throw new Error(payload?.error || safeT.teamsPage.updateMemberError);
      }

      toast({ description: safeT.teamsPage.memberUpdated });
      setRefreshKey((prev) => prev + 1);
      refresh();
    } catch (error) {
      console.error("[TeamsPage] update member error", error);
      toast({
        variant: "destructive",
        description: error.message || safeT.teamsPage.updateMemberError,
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
        throw new Error(payload?.error || safeT.teamsPage.removeMemberError);
      }

      toast({ description: safeT.teamsPage.memberRemoved });
      setRefreshKey((prev) => prev + 1);
      refresh();
    } catch (error) {
      console.error("[TeamsPage] remove member error", error);
      toast({
        variant: "destructive",
        description: error.message || safeT.teamsPage.removeMemberError,
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
        throw new Error(payload?.error || safeT.teamsPage.updateTeamError);
      }

      toast({ description: safeT.teamsPage.teamUpdated });
      setEditOpen(false);
      setRefreshKey((prev) => prev + 1);
      refresh();
    } catch (error) {
      console.error("[TeamsPage] update team error", error);
      toast({
        variant: "destructive",
        description: error.message || safeT.teamsPage.updateTeamError,
      });
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTarget) {
      toast({
        variant: "destructive",
        description: safeT.teamsPage.selectTransferTarget,
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
        throw new Error(payload?.error || safeT.teamsPage.transferOwnershipError);
      }

      toast({ description: safeT.teamsPage.ownershipTransferred });
      setTransferOpen(false);
      setTransferTarget("");
      setRefreshKey((prev) => prev + 1);
      refresh();
    } catch (error) {
      console.error("[TeamsPage] transfer ownership error", error);
      toast({
        variant: "destructive",
        description: error.message || safeT.teamsPage.transferOwnershipError,
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
        description: safeT.teamsPage.deleteConfirmRequired,
      });
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteTeam(activeTeamId);
      toast({ description: safeT.teamsPage.teamDeleted });
      setDeleteOpen(false);
      setDeleteConfirm("");
      setTeamDetails(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("[TeamsPage] delete team error", error);
      toast({
        variant: "destructive",
        description: error.message || safeT.teamsPage.deleteTeamError,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    setLeaveLoading(true);
    try {
      await leaveTeam(activeTeamId);
      toast({ description: safeT.teamsPage.leftTeam });
      setLeaveOpen(false);
      setRefreshKey((prev) => prev + 1);
      refresh();
    } catch (error) {
      console.error("[TeamsPage] leave team error", error);
      toast({
        variant: "destructive",
        description: error.message || safeT.teamsPage.leaveTeamError,
      });
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleAcceptInvite = async (teamId) => {
    try {
      await acceptInvite(teamId);
      toast({ description: safeT.teamsPage.joinedTeam });
      setRefreshKey((prev) => prev + 1);
      refresh();
    } catch (error) {
      console.error("[TeamsPage] accept invite error", error);
      toast({
        variant: "destructive",
        description: error.message || safeT.teamsPage.acceptInviteError,
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
      return ownerMembership.display_name || ownerMembership.email || ownerMembership.user_id || safeT.teamsPage.defaultOwnerName;
    }
    if (teamDetails.team.owner_id === user?.id) {
      return currentUserDisplayName || teamDetails.team.owner_id;
    }
    return teamDetails.team.owner_id;
  }, [teamDetails, user, currentUserDisplayName]);

  const formatMemberIdentifier = useCallback((member) => {
    return member.display_name || member.email || member.user_id || safeT.teamsPage.defaultPendingMember;
  }, [safeT]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {safeT.teamsPage.title}
            </h1>
            <p className="text-muted-foreground mt-2 text-base">
              {safeT.teamsPage.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push("/teams/new")}
              disabled={teams.filter(m => m.role === 'owner').length >= 2}
              title={teams.filter(m => m.role === 'owner').length >= 2 ? (safeT.teamsPage?.limitReached || '已达上限') : ''}
              className="transition-all duration-200 hover:shadow-md hover:scale-[1.02] bg-gradient-to-r from-primary to-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              {safeT.teamsPage.createTeam}
              {teams.filter(m => m.role === 'owner').length >= 2 && ` (${safeT.teamsPage?.limitReached || '已达上限'})`}
            </Button>
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl">
              {activeTeam ? activeTeam.name : safeT.teamsPage.noTeamSelected}
            </CardTitle>
            {activeTeam && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{safeT.teamsPage.role}：{ROLE_LABELS[activeMembership?.role] || safeT.teamsPage.unknownRole}</span>
                {/* <span>团队 ID：{activeTeam.id}</span> */}
                {activeTeam.is_personal && <Badge variant="secondary">{safeT.teamsPage.personalSpace}</Badge>}
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
                <SelectValue placeholder={safeT.teamsPage.selectTeam} />
              </SelectTrigger>
              <SelectContent>
                {teams.map((membership) => (
                  <SelectItem key={membership.team.id} value={membership.team.id}>
                    {membership.team.name}{" "}
                    {membership.status === "pending" ? safeT.teamsPage.pending : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!activeTeam && teams.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {safeT.teamsPage.noTeamsMessage}
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
                    {safeT.teamsPage.owner}
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
                    {safeT.teamsPage.membersCount}
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
                    {safeT.teamsPage.pendingInvites}
                  </div>
                  <p className="mt-3 text-lg font-semibold">
                    {teamDetails.members?.filter((m) => m.status === "pending").length || 0}
                  </p>
                </div>
              </div>

              {teamDetails.team.description && (
                <div className="rounded-lg bg-muted/30 p-4 border border-border/40">
                  <h3 className="text-sm font-medium text-muted-foreground">{safeT.teamsPage.teamDescription}</h3>
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
                        {safeT.teamsPage.inviteMember}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{safeT.teamsPage.inviteMemberDialog.title}</DialogTitle>
                        <DialogDescription>
                          {safeT.teamsPage.inviteMemberDialog.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">{safeT.teamsPage.inviteMemberDialog.emailLabel}</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder={safeT.teamsPage.inviteMemberDialog.emailPlaceholder}
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
                          <Label htmlFor="invite-role">{safeT.teamsPage.inviteMemberDialog.roleLabel}</Label>
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
                              <SelectItem value="member">{safeT.teamsPage.member}</SelectItem>
                              <SelectItem value="admin">{safeT.teamsPage.admin}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteOpen(false)}>
                          {safeT.teamsPage.inviteMemberDialog.cancel}
                        </Button>
                        <Button onClick={handleInviteMember}>{safeT.teamsPage.inviteMemberDialog.sendInvite}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {isManager && (
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary">{safeT.teamsPage.editTeam}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{safeT.teamsPage.editTeamDialog.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="team-name">{safeT.teamsPage.editTeamDialog.teamNameLabel}</Label>
                          <Input
                            id="team-name"
                            value={editForm.name}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, name: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="team-description">{safeT.teamsPage.editTeamDialog.teamDescriptionLabel}</Label>
                          <Input
                            id="team-description"
                            value={editForm.description}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                            placeholder={safeT.teamsPage.editTeamDialog.descriptionPlaceholder}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                          {safeT.teamsPage.editTeamDialog.cancel}
                        </Button>
                        <Button onClick={handleSaveTeam}>{safeT.teamsPage.editTeamDialog.save}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {isOwner && transferableMembers.length > 0 && (
                  <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        {safeT.teamsPage.transferOwnership}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{safeT.teamsPage.transferOwnershipDialog.title}</DialogTitle>
                        <DialogDescription>
                          {safeT.teamsPage.transferOwnershipDialog.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label className="mb-2 block text-sm font-medium">{safeT.teamsPage.transferOwnershipDialog.selectMemberLabel}</Label>
                        <Select value={transferTarget} onValueChange={setTransferTarget}>
                          <SelectTrigger>
                            <SelectValue placeholder={safeT.teamsPage.transferOwnershipDialog.selectMemberPlaceholder} />
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
                          {safeT.teamsPage.transferOwnershipDialog.cancel}
                        </Button>
                        <Button onClick={handleTransferOwnership}>{safeT.teamsPage.transferOwnershipDialog.transfer}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {isOwner && !isPersonalTeam && (
                  <Dialog open={deleteOpen} onOpenChange={handleDeleteDialogChange}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        {safeT.teamsPage.deleteTeam}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{safeT.teamsPage.deleteTeamDialog.title}</DialogTitle>
                        <DialogDescription>
                          {safeT.teamsPage.deleteTeamDialog.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-2">
                        <p className="text-sm text-muted-foreground">
                          {safeT.teamsPage.deleteTeamDialog.confirmLabel} <span className="font-semibold">{activeTeam?.name}</span>
                        </p>
                        <Input
                          value={deleteConfirm}
                          onChange={(event) => setDeleteConfirm(event.target.value)}
                          placeholder={safeT.teamsPage.deleteTeamDialog.confirmPlaceholder}
                          autoFocus
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => handleDeleteDialogChange(false)} disabled={deleteLoading}>
                          {safeT.teamsPage.deleteTeamDialog.cancel}
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteTeam} disabled={deleteLoading}>
                          {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {safeT.teamsPage.deleteTeamDialog.delete}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {!isPersonalTeam && (
                  <Button variant="outline" asChild>
                    <Link href="/teams/invites">{safeT.teamsPage.viewInvites}</Link>
                  </Button>
                )}

                {activeMembership && activeMembership.role !== "owner" && (
                  <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <UserMinus className="mr-2 h-4 w-4" />
                        {safeT.teamsPage.leaveTeam}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{safeT.teamsPage.leaveTeamDialog.title}</DialogTitle>
                        <DialogDescription>
                          {safeT.teamsPage.leaveTeamDialog.description}
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setLeaveOpen(false)} disabled={leaveLoading}>
                          {safeT.teamsPage.leaveTeamDialog.cancel}
                        </Button>
                        <Button variant="destructive" onClick={handleLeaveTeam} disabled={leaveLoading}>
                          {leaveLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {safeT.teamsPage.leaveTeamDialog.confirm}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </>
          ) : null}

          {teamDetails && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{safeT.teamsPage.teamMembers}</h2>
                {membersLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {safeT.teamsPage.loading}
                  </div>
                )}
              </div>
              <div className="overflow-x-auto rounded-lg border border-border/50 bg-card/50">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">{safeT.teamsPage.memberColumn}</th>
                      <th className="px-4 py-3 font-semibold">{safeT.teamsPage.role}</th>
                      <th className="px-4 py-3 font-semibold">{safeT.teamsPage.statusColumn}</th>
                      <th className="px-4 py-3 font-semibold">{safeT.teamsPage.joinTimeColumn}</th>
                      <th className="px-4 py-3 font-semibold">{safeT.teamsPage.actionsColumn}</th>
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
                            <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-400">{safeT.teamsPage.statusActive}</Badge>
                          ) : member.status === "pending" ? (
                            <Badge variant="secondary" className="border-amber-500/50 text-amber-600 dark:text-amber-400">{safeT.teamsPage.statusPending}</Badge>
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
                                {safeT.teamsPage.acceptInviteButton}
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
                                      {safeT.teamsPage.promoteToAdmin}
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
                                      {safeT.teamsPage.demoteToMember}
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
                                {safeT.teamsPage.removeButton}
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
                    {safeT.teamsPage.noTeamsCreate}
                  </p>
                  <Button
                    onClick={() => router.push("/teams/new")}
                    className="transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {safeT.teamsPage.createTeamButton}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-base">{safeT.teamsPage.selectTeamToView}</p>
            )}
          </CardFooter>
        )}
      </Card>
      </div>
    </div>
  );
}
