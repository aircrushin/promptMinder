'use client'

import Link from 'next/link'
import { Loader2, PlusCircle, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
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
  const [maxTeams, setMaxTeams] = useState(2)
  const router = useRouter()
  const { t } = useLanguage()
  const safeT = t || {}

  const selectedValue = activeTeamId ?? PERSONAL_TEAM_ID

  const pendingCount = pendingInvites.length

  useEffect(() => {
    let mounted = true
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data?.maxTeamsPerUser) setMaxTeams(Number(data.maxTeamsPerUser))
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

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
                  {safeT.teamsPage?.[membership.role.toLowerCase()] || membership.role}
                </Badge>
              </div>
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={CREATE_TEAM_VALUE} disabled={teams.filter(m => m.role === 'owner').length >= maxTeams}>
            <div className="flex items-center gap-2 text-primary">
              <PlusCircle className="h-4 w-4" />
              <span>{safeT.teamsPage?.createTeam || '创建团队'}</span>
              {teams.filter(m => m.role === 'owner').length >= maxTeams && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({safeT.teamsPage?.limitReached || '已达上限'})
                </span>
              )}
            </div>
          </SelectItem>
        </SelectContent>
        </Select>
        
        {pendingCount > 0 && (
          <Link href="/teams/invites">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-muted-foreground hover:text-primary gap-1.5 bg-muted/30 hover:bg-muted/50"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-medium">
                {pendingCount} {safeT.teamsPage?.pendingInvites || '待处理邀请'}
              </span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
