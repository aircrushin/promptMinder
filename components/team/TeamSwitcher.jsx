'use client'

import Link from 'next/link'
import { Loader2, PlusCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTeam } from '@/contexts/team-context'
import { PERSONAL_TEAM_ID } from '@/lib/team-storage.js'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'

const CREATE_TEAM_VALUE = 'create-team'

export function TeamSwitcher({ className }) {
  const {
    teams,
    activeTeams,
    activeTeamId,
    selectTeam,
    loading,
    pendingInvites,
  } = useTeam()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()
  const safeT = t || {}

  const selectedValue = activeTeamId ?? PERSONAL_TEAM_ID

  const pendingCount = pendingInvites.length

  if (loading && !teams.length) {
    return (
      <Button variant="outline" size="sm" className="gap-2" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        {safeT.contributions?.loading || '加载中...'}
      </Button>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Select
          value={selectedValue}
          onValueChange={(value) => {
            if (value === CREATE_TEAM_VALUE) {
              setOpen(false)
              router.push('/teams/new')
              return
            }

            if (value === PERSONAL_TEAM_ID) {
              setOpen(false)
              selectTeam(null)
              router.push('/prompts')
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
              <SelectValue placeholder={safeT.teamsPage?.selectTeam || '选择团队'} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PERSONAL_TEAM_ID}>
              <div className="flex items-center gap-2">
                <span>{safeT.teamsPage?.personalSpace || '个人空间'}</span>
              </div>
            </SelectItem>
            {activeTeams.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {safeT.teamsPage?.noTeamSelected || '暂无已加入的团队'}
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
            <SelectSeparator />
            <SelectItem value={CREATE_TEAM_VALUE}>
              <div className="flex items-center gap-2 text-primary">
                <PlusCircle className="h-4 w-4" />
                <span>{safeT.teamsPage?.createTeam || '创建团队'}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {pendingCount > 0 && (
        <Link
          href="/teams/invites"
          className="mt-1 block text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {pendingCount} {safeT.teamsPage?.pendingInvites || '待处理邀请'}
        </Link>
      )}
    </div>
  );
}
