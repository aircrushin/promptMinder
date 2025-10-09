'use client'

import Link from 'next/link'
import { Loader2, PlusCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTeam } from '@/contexts/team-context'
import { PERSONAL_TEAM_ID } from '@/lib/team-storage.js'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export function TeamSwitcher({ className, showFallbackCreate = true }) {
  const {
    teams,
    activeTeams,
    activeTeamId,
    selectTeam,
    loading,
    pendingInvites,
    activeMembership,
    isPersonal,
  } = useTeam()
  const [open, setOpen] = useState(false)

  const selectedValue = activeTeamId ?? PERSONAL_TEAM_ID

  const pendingCount = pendingInvites.length

  if (loading && !teams.length) {
    return (
      <Button variant="outline" size="sm" className="gap-2" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        加载团队...
      </Button>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Select
          value={selectedValue}
          onValueChange={(value) => {
            if (value === PERSONAL_TEAM_ID) {
              selectTeam(null)
              return
            }
            selectTeam(value)
          }}
          open={open}
          onOpenChange={setOpen}
        >
          <SelectTrigger className="w-[220px]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <SelectValue placeholder="选择团队" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PERSONAL_TEAM_ID}>
              <div className="flex items-center justify-between gap-2">
                <span>个人空间</span>
                <Badge variant="secondary">个人</Badge>
              </div>
            </SelectItem>
            {activeTeams.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                暂无已加入的团队
              </div>
            )}
            {activeTeams.map((membership) => (
              <SelectItem key={membership.team.id} value={membership.team.id}>
                <div className="flex items-center justify-between gap-2">
                  <span>{membership.team.name}</span>
                  <Badge variant="secondary" className="capitalize">
                    {membership.role}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showFallbackCreate && activeTeams.length === 0 && (
          <Link href="/teams/new">
            <Button size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              创建团队
            </Button>
          </Link>
        )}
      </div>
      {pendingCount > 0 && (
        <Link href="/teams/invites" className="mt-1 block text-xs text-muted-foreground hover:text-primary transition-colors">
          你有 {pendingCount} 个待处理邀请
        </Link>
      )}
    </div>
  )
}
