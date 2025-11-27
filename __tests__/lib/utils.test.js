import { cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn function', () => {
    it('应该合并基本的类名', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('应该处理条件类名', () => {
      const result = cn('base', true && 'conditional', false && 'hidden')
      expect(result).toBe('base conditional')
    })

    it('应该处理对象形式的类名', () => {
      const result = cn({
        'active': true,
        'disabled': false,
        'primary': true
      })
      expect(result).toBe('active primary')
    })

    it('应该处理数组形式的类名', () => {
      const result = cn(['class1', 'class2'], ['class3'])
      expect(result).toBe('class1 class2 class3')
    })

    it('应该处理混合类型的输入', () => {
      const result = cn(
        'base',
        ['array-class'],
        { 'object-class': true, 'hidden': false },
        true && 'conditional',
        null,
        undefined,
        ''
      )
      expect(result).toBe('base array-class object-class conditional')
    })

    it('应该使用tailwind-merge处理冲突的Tailwind类', () => {
      const result = cn('px-2 py-1', 'px-4')
      // tailwind-merge应该保留后面的px-4，移除px-2
      expect(result).toBe('py-1 px-4')
    })

    it('应该处理复杂的Tailwind类冲突', () => {
      const result = cn(
        'bg-red-500 text-white',
        'bg-blue-500', // 应该覆盖bg-red-500
        'text-black'   // 应该覆盖text-white
      )
      expect(result).toBe('bg-blue-500 text-black')
    })

    it('应该处理响应式类名', () => {
      const result = cn('w-full', 'md:w-1/2', 'lg:w-1/3')
      expect(result).toBe('w-full md:w-1/2 lg:w-1/3')
    })

    it('应该处理伪类和状态类', () => {
      const result = cn('hover:bg-blue-500', 'focus:ring-2', 'active:scale-95')
      expect(result).toBe('hover:bg-blue-500 focus:ring-2 active:scale-95')
    })

    it('空输入应该返回空字符串', () => {
      expect(cn()).toBe('')
      expect(cn(null)).toBe('')
      expect(cn(undefined)).toBe('')
      expect(cn('')).toBe('')
      expect(cn(false)).toBe('')
    })

    it('应该处理嵌套的条件逻辑', () => {
      const isActive = true
      const isDisabled = false
      const variant = 'primary'
      
      const result = cn(
        'btn',
        isActive && 'active',
        !isDisabled && 'enabled',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary'
      )
      
      expect(result).toBe('btn active enabled btn-primary')
    })

    it('应该正确处理重复的类名', () => {
      const result = cn('class1', 'class2', 'class1', 'class3')
      expect(result).toBe('class1 class2 class1 class3')
    })

    it('应该处理带有修饰符的Tailwind类', () => {
      const result = cn(
        'dark:bg-gray-800',
        'sm:text-sm',
        'md:text-base',
        'lg:text-lg',
        'hover:dark:bg-gray-700'
      )
      expect(result).toBe('dark:bg-gray-800 sm:text-sm md:text-base lg:text-lg hover:dark:bg-gray-700')
    })

    it('应该处理自定义CSS类和Tailwind类的混合', () => {
      const result = cn(
        'custom-component',
        'flex items-center',
        'my-custom-class',
        'justify-between'
      )
      expect(result).toBe('custom-component flex items-center my-custom-class justify-between')
    })
  })
})