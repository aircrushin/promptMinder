'use client'

import { useRouter } from 'next/navigation'
import { Download } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'

export function AddSkillButton({ skill }) {
  const router = useRouter()
  const { toast } = useToast()
  const { language } = useLanguage()
  const zh = language === 'zh'

  const addToWorkspace = async () => {
    try {
      await apiClient.copyPrompt({
        role: skill.name,
        prompt: skill.content,
        category: `Skill,${skill.source}`,
      })
      toast({
        title: zh ? '已添加到工作区' : 'Added to workspace',
        description: zh ? '你可以在提示词库中继续编辑和测试。' : 'You can edit and test it in your prompt library.',
      })
      router.push('/prompts')
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
    }
  }

  return (
    <button
      onClick={addToWorkspace}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
    >
      <Download className="h-4 w-4" />
      {zh ? '添加到工作区' : 'Add to workspace'}
    </button>
  )
}

