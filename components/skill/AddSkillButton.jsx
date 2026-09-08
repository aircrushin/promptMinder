'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'

export function AddSkillButton({ skill }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const { language } = useLanguage()
  const zh = language === 'zh'

  const addToWorkspace = async () => {
    setBusy(true)
    try {
      const result = await apiClient.request('/api/workspace-skills', { method: 'POST', body: { catalog_id: skill.id } });
      toast({
        title: result.mode === 'approval_required' ? (zh ? '已提交审批' : 'Submitted for approval') : (zh ? '已添加到工作区' : 'Added to workspace'),
        description: zh ? '你可以在提示词库中继续编辑和测试。' : 'You can edit and test it in your prompt library.',
      })
      router.push(result.mode === 'approval_required' ? `/prompts/reviews/${result.change_request.id}` : `/prompts/${result.prompt.id}`)
    } catch (error) {
      if (error.status === 401) {
        router.push(`/sign-in?redirect_url=${encodeURIComponent(`/skills/${skill.id}`)}`)
        return
      }
      toast({
        title: zh ? '添加失败' : 'Unable to add skill',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={addToWorkspace}
      disabled={busy}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
    >
      <Download className="h-4 w-4" />
      {zh ? '添加到工作区' : 'Add to workspace'}
    </button>
  )
}

