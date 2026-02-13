// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Bug, Lightbulb, ArrowLeft, Send, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [type, setType] = useState('feature_request');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      toast({
        title: '请填写反馈内容',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          description: description.trim(),
          email: email.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '提交失败');
      }

      toast({
        title: '反馈提交成功',
        description: '感谢您的反馈，我们会尽快处理！',
      });

      setDescription('');
      setEmail('');
      setType('feature_request');
    } catch (error) {
      toast({
        title: '提交失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
      </div>

      {/* Subtle grid pattern overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05]" style={{
        backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <div className="relative max-w-2xl mx-auto px-4 py-12">
        {/* Back button with animated hover */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-12 group transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="relative">
            返回首页
            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-neutral-900 transition-all group-hover:w-full" />
          </span>
        </Link>

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-neutral-200/50 border border-neutral-200 p-8 md:p-12 relative overflow-hidden">
          {/* Decorative top accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-900 to-transparent" />

          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-900 rounded-2xl mb-6 shadow-xl shadow-neutral-300/50">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3 tracking-tight">
              用户反馈
            </h1>
            <p className="text-neutral-500 text-lg leading-relaxed">
              您的声音推动我们前进<br className="hidden md:block" />
              帮助打造更好的体验
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Type selection with enhanced styling */}
            <div className="space-y-4">
              <Label className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                反馈类型
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setType('feature_request')}
                  className={cn(
                    'relative group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300',
                    type === 'feature_request'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xl shadow-neutral-300/50 scale-[1.02]'
                      : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-600'
                  )}
                >
                  {type === 'feature_request' && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className={cn(
                    'transition-all duration-300',
                    type === 'feature_request' ? 'scale-110' : 'group-hover:scale-105'
                  )}>
                    <Lightbulb className={cn(
                      'h-7 w-7',
                      type === 'feature_request' ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-700'
                    )} />
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      'font-bold text-base mb-1 transition-colors',
                      type === 'feature_request' ? 'text-white' : 'text-neutral-700'
                    )}>
                      功能建议
                    </div>
                    <div className={cn(
                      'text-xs leading-relaxed',
                      type === 'feature_request' ? 'text-neutral-300' : 'text-neutral-500'
                    )}>
                      新功能或改进建议
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setType('bug')}
                  className={cn(
                    'relative group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300',
                    type === 'bug'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xl shadow-neutral-300/50 scale-[1.02]'
                      : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-600'
                  )}
                >
                  {type === 'bug' && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className={cn(
                    'transition-all duration-300',
                    type === 'bug' ? 'scale-110' : 'group-hover:scale-105'
                  )}>
                    <Bug className={cn(
                      'h-7 w-7',
                      type === 'bug' ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-700'
                    )} />
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      'font-bold text-base mb-1 transition-colors',
                      type === 'bug' ? 'text-white' : 'text-neutral-700'
                    )}>
                      问题反馈
                    </div>
                    <div className={cn(
                      'text-xs leading-relaxed',
                      type === 'bug' ? 'text-neutral-300' : 'text-neutral-500'
                    )}>
                      报告 Bug 或问题
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Description textarea with enhanced focus states */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                详细描述 <span className="text-neutral-900">*</span>
              </Label>
              <div className={cn(
                'relative rounded-2xl transition-all duration-300',
                focusedField === 'description' && 'ring-4 ring-neutral-200'
              )}>
                <Textarea
                  id="description"
                  placeholder={
                    type === 'feature_request'
                      ? '请描述您希望添加的功能或改进建议...\n\n例如：\n• 您希望实现什么功能？\n• 这个功能能解决什么问题？\n• 您有预期的使用方式吗？'
                      : '请详细描述您遇到的问题，包括复现步骤...\n\n例如：\n• 您在做什么时遇到问题？\n• 期望的结果是什么？\n• 实际发生了什么？'
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onFocus={() => setFocusedField('description')}
                  onBlur={() => setFocusedField(null)}
                  rows={7}
                  className={cn(
                    'resize-none rounded-2xl border-2 transition-all duration-300',
                    focusedField === 'description'
                      ? 'border-neutral-900 bg-white'
                      : 'border-neutral-200 focus:border-neutral-900'
                  )}
                  style={{ fontSize: '15px', lineHeight: '1.7' }}
                />
              </div>
              <div className="flex justify-end">
                <span className={cn(
                  'text-xs transition-colors font-medium',
                  description.length > 0 ? 'text-neutral-600' : 'text-neutral-400'
                )}>
                  {description.length} 字符
                </span>
              </div>
            </div>

            {/* Email input with subtle styling */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                联系邮箱
                <span className="ml-2 text-xs font-normal text-neutral-400 font-sans tracking-normal">(可选)</span>
              </Label>
              <div className={cn(
                'relative rounded-2xl transition-all duration-300',
                focusedField === 'email' && 'ring-4 ring-neutral-200'
              )}>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    'rounded-2xl border-2 transition-all duration-300',
                    focusedField === 'email'
                      ? 'border-neutral-900 bg-white'
                      : 'border-neutral-200 focus:border-neutral-900'
                  )}
                />
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed flex items-center gap-1.5">
                <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                留下邮箱以便我们在处理您的反馈后通知您
              </p>
            </div>

            {/* Submit button with premium styling */}
            <Button
              type="submit"
              className={cn(
                'w-full relative overflow-hidden rounded-2xl font-bold text-base py-6 transition-all duration-300',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                !isSubmitting && description.trim() && 'hover:shadow-2xl hover:shadow-neutral-300/50 hover:scale-[1.02] active:scale-[0.98]'
              )}
              style={{
                background: description.trim() && !isSubmitting
                  ? '#171717'
                  : '#E5E5E5',
                border: 'none',
                color: description.trim() && !isSubmitting ? '#FFFFFF' : '#A3A3A3'
              }}
              disabled={isSubmitting || !description.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  提交反馈
                </>
              )}
              {/* Button shine effect */}
              {!isSubmitting && description.trim() && (
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              )}
            </Button>
          </form>

          {/* Bottom decorative accent */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
        </div>

        {/* Footer text */}
        <p className="text-center text-neutral-400 text-sm mt-8 leading-relaxed font-medium">
          每一条反馈都值得我们认真对待
        </p>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
