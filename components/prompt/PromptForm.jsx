'use client';

import { Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Loader2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamic imports for heavy components
const MotionDiv = dynamic(() => import('framer-motion').then((mod) => mod.motion.div), {
  loading: () => <div className="animate-pulse" />,
  ssr: false,
});

const VariableInputs = dynamic(() => import('@/components/prompt/VariableInputs'), {
  loading: () => <Skeleton className="h-16 w-full" />,
  ssr: false,
});

const CreatableSelect = dynamic(() => import('react-select/creatable'), {
  loading: () => <Skeleton className="h-10 w-full" />,
  ssr: false,
});

// React Select 样式配置
const getSelectStyles = (isCompact = false) => ({
  control: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: 'hsl(var(--background))',
    borderColor: state.isFocused
      ? 'hsl(var(--primary))'
      : 'hsl(var(--border))',
    borderRadius: 'calc(var(--radius) - 2px)',
    boxShadow: state.isFocused
      ? '0 0 0 2px hsl(var(--primary)/30%)'
      : 'none',
    '&:hover': {
      borderColor: 'hsl(var(--primary))',
    },
    minHeight: isCompact ? '36px' : '40px',
  }),
  menu: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'calc(var(--radius) - 2px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    zIndex: 100,
  }),
  option: (baseStyles, { isFocused, isSelected }) => ({
    ...baseStyles,
    backgroundColor: isSelected
      ? 'hsl(var(--primary))'
      : isFocused
      ? 'hsl(var(--accent))'
      : 'transparent',
    color: isSelected
      ? 'hsl(var(--primary-foreground))'
      : 'inherit',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: 'hsl(var(--accent))',
    },
  }),
  multiValue: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: 'hsl(var(--secondary)/50%)',
    borderRadius: 'calc(var(--radius) - 2px)',
  }),
  multiValueLabel: (baseStyles) => ({
    ...baseStyles,
    color: 'hsl(var(--secondary-foreground))',
  }),
  multiValueRemove: (baseStyles) => ({
    ...baseStyles,
    color: 'hsl(var(--secondary-foreground))',
    '&:hover': {
      backgroundColor: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
    },
  }),
  input: (baseStyles) => ({
    ...baseStyles,
    color: 'hsl(var(--foreground))',
  }),
});

const getSelectTheme = (theme) => ({
  ...theme,
  colors: {
    ...theme.colors,
    primary: 'hsl(var(--primary))',
    primary75: 'hsl(var(--primary)/.75)',
    primary50: 'hsl(var(--primary)/.5)',
    primary25: 'hsl(var(--primary)/.25)',
    danger: 'hsl(var(--destructive))',
    dangerLight: 'hsl(var(--destructive)/.25)',
  },
});

/**
 * 提示词表单组件
 * 用于新建提示词的 Modal 和页面，统一表单逻辑和UI
 */
export function PromptForm({
  // 表单数据
  prompt,
  onFieldChange,
  
  // 标签选项
  tagOptions,
  onCreateTag,
  
  // 操作回调
  onSubmit,
  onCancel,
  onOptimize,
  
  // 状态
  isSubmitting,
  isOptimizing,
  errors = {},
  
  // 文案
  copy,
  
  // 布局模式: 'compact' 用于 Modal, 'full' 用于页面
  mode = 'compact',
  
  // 额外的 className
  className,
}) {
  const isCompact = mode === 'compact';

  const handleTagsChange = useCallback((selected) => {
    const tags = selected
      ? selected.map((option) => option.value).join(',')
      : '';
    onFieldChange('tags', tags);
  }, [onFieldChange]);

  const handleCreateTagOption = useCallback(async (inputValue) => {
    const newOption = await onCreateTag(inputValue);
    if (newOption) {
      onFieldChange(
        'tags',
        prompt.tags ? `${prompt.tags},${inputValue}` : inputValue
      );
    }
  }, [onCreateTag, onFieldChange, prompt.tags]);

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    onSubmit();
  }, [onSubmit]);

  if (!copy) return null;

  const formContent = (
    <>
      {/* 标题字段 */}
      <MotionDiv 
        className="space-y-2" 
        whileHover={!isCompact ? { scale: 1.01 } : undefined} 
        transition={{ duration: 0.2 }}
      >
        <Label htmlFor="title" className={isCompact ? 'text-sm font-medium' : 'text-base'}>
          {copy.formTitleLabel}
          <span className="ml-1 text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={prompt.title}
          onChange={(event) => onFieldChange('title', event.target.value)}
          placeholder={copy.formTitlePlaceholder}
          className={cn(
            errors.title && 'border-red-500',
            isCompact && 'focus-visible:ring-primary/30'
          )}
          required
        />
        {errors.title && <span className="text-sm text-red-500">{errors.title}</span>}
      </MotionDiv>

      {/* 内容字段 */}
      <MotionDiv 
        className="space-y-2" 
        whileHover={!isCompact ? { scale: 1.01 } : undefined} 
        transition={{ duration: 0.2 }}
      >
        <Label htmlFor="content" className={isCompact ? 'text-sm font-medium' : 'text-base'}>
          {copy.formContentLabel}
          <span className="ml-1 text-red-500">*</span>
        </Label>
        <div className="relative">
          <Textarea
            id="content"
            value={prompt.content}
            onChange={(event) => onFieldChange('content', event.target.value)}
            placeholder={copy.formContentPlaceholder}
            className={cn(
              errors.content && 'border-red-500',
              isCompact ? 'min-h-[200px] pr-20 focus-visible:ring-primary/30' : 'min-h-[250px] pr-20'
            )}
            required
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <Link href="/agent">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={isCompact ? 'hover:bg-accent hover:text-primary' : 'hover:bg-primary/10'}
                title={copy.agentEntry}
                aria-label={copy.agentEntry}
              >
                <Bot className="h-4 w-4" />
                <span className="sr-only">{copy.agentEntry}</span>
              </Button>
            </Link>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={isCompact ? 'hover:bg-accent hover:text-primary' : 'hover:bg-primary/10'}
              onClick={onOptimize}
              disabled={isOptimizing || !prompt.content.trim()}
              title={copy.optimizeButton}
              aria-label={copy.optimizeButton}
            >
              {isOptimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              <span className="sr-only">{copy.optimizeButton}</span>
            </Button>
          </div>
        </div>
        {errors.content && <span className="text-sm text-red-500">{errors.content}</span>}
        <p className="text-sm text-muted-foreground">{copy.variableTip}</p>
      </MotionDiv>

      {/* 变量输入组件 - 仅在非紧凑模式下显示 */}
      {!isCompact && (
        <Suspense fallback={<Skeleton className="h-16 w-full" />}>
          <VariableInputs content={prompt.content} className="my-4" />
        </Suspense>
      )}

      {/* 描述字段 */}
      <MotionDiv 
        className="space-y-2" 
        whileHover={!isCompact ? { scale: 1.01 } : undefined} 
        transition={{ duration: 0.2 }}
      >
        <Label htmlFor="description" className={isCompact ? 'text-sm font-medium' : 'text-base'}>
          {copy.formDescriptionLabel}
        </Label>
        <Textarea
          id="description"
          value={prompt.description}
          onChange={(event) => onFieldChange('description', event.target.value)}
          placeholder={copy.formDescriptionPlaceholder}
          className={cn(
            isCompact && 'focus-visible:ring-primary/30',
            !isCompact && 'min-h-[80px]'
          )}
        />
      </MotionDiv>

      {/* 标签字段 */}
      <div className="space-y-2">
        <Label htmlFor="tags" className={isCompact ? 'text-sm font-medium' : 'text-base'}>
          {copy.formTagsLabel}
        </Label>
        <CreatableSelect
          id="tags"
          isMulti
          value={prompt.tags
            ? prompt.tags.split(',').map((tag) => ({ value: tag, label: tag }))
            : []}
          onChange={handleTagsChange}
          options={tagOptions}
          onCreateOption={handleCreateTagOption}
          placeholder={copy.formTagsPlaceholder}
          classNamePrefix="select"
          styles={getSelectStyles(isCompact)}
          theme={getSelectTheme}
          instanceId="tags-select"
        />
      </div>

      {/* 版本字段 */}
      <MotionDiv 
        className="space-y-2" 
        whileHover={!isCompact ? { scale: 1.01 } : undefined} 
        transition={{ duration: 0.2 }}
      >
        <Label htmlFor="version" className={isCompact ? 'text-sm font-medium' : 'text-base'}>
          {copy.formVersionLabel}
        </Label>
        {isCompact ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">v</span>
            <Input
              id="version"
              value={prompt.version}
              onChange={(event) => onFieldChange('version', event.target.value)}
              placeholder={copy.formVersionPlaceholder}
              className="w-32 focus-visible:ring-primary/30"
            />
          </div>
        ) : (
          <Input
            id="version"
            value={prompt.version}
            onChange={(event) => onFieldChange('version', event.target.value)}
            placeholder={copy.formVersionPlaceholder}
          />
        )}
        <p className="text-sm text-muted-foreground">{copy.versionSuggestion}</p>
      </MotionDiv>
    </>
  );

  // 紧凑模式：用于 Modal，不包含 form 标签和按钮
  if (isCompact) {
    return (
      <div className={cn('space-y-6 py-4', className)}>
        {formContent}
      </div>
    );
  }

  // 完整模式：用于页面，包含 form 标签和按钮
  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {formContent}
      
      <MotionDiv className="flex gap-4" whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
        <Button type="submit" disabled={isSubmitting} className="relative">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <span>{isSubmitting ? copy.creating : copy.create}</span>
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {copy.cancel}
        </Button>
      </MotionDiv>
    </form>
  );
}

export default PromptForm;
