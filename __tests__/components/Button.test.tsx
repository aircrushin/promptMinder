import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button, buttonVariants } from '@/components/ui/button'

describe('Button', () => {
  it('应该正确渲染基本按钮', () => {
    render(<Button>点击我</Button> as any)

    const button = screen.getByRole('button', { name: '点击我' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('点击我')
  })

  it('应该处理点击事件', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>点击我</Button> as any)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('应该应用默认样式变体', () => {
    render(<Button>默认按钮</Button> as any)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
  })

  it('应该应用不同的变体样式', () => {
    const { rerender } = render(<Button variant="destructive">删除</Button> as any)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')

    rerender(<Button variant="outline">轮廓</Button> as any)
    button = screen.getByRole('button')
    expect(button).toHaveClass('border', 'border-input', 'bg-background')

    rerender(<Button variant="secondary">次要</Button> as any)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')

    rerender(<Button variant="ghost">幽灵</Button> as any)
    button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')

    rerender(<Button variant="link">链接</Button> as any)
    button = screen.getByRole('button')
    expect(button).toHaveClass('text-primary', 'underline-offset-4', 'hover:underline')
  })

  it('应该应用不同的尺寸样式', () => {
    const { rerender } = render(<Button size="sm">小按钮</Button> as any)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('h-8', 'px-3', 'text-xs')

    rerender(<Button size="lg">大按钮</Button> as any)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-10', 'px-8')

    rerender(<Button size="icon">图标</Button> as any)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-9', 'w-9')
  })

  it('应该应用自定义className', () => {
    render(<Button className="custom-class">自定义</Button> as any)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('禁用状态下应该不响应点击', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>禁用按钮</Button> as any)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')

    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('使用asChild时应该渲染为Slot组件', () => {
    render(
      <Button asChild>
        <a href="/test">链接按钮</a>
      </Button> as any
    )

    const link = screen.getByRole('link', { name: '链接按钮' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('应该正确转发ref', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>引用按钮</Button> as any)

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('应该传递其他props', () => {
    render(<Button data-testid="test-button" aria-label="测试按钮">按钮</Button> as any)

    const button = screen.getByTestId('test-button')
    expect(button).toHaveAttribute('aria-label', '测试按钮')
  })

  it('应该包含SVG图标的样式', () => {
    render(
      <Button>
        <svg data-testid="icon">
          <path />
        </svg>
        带图标
      </Button> as any
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('[&_svg]:pointer-events-none', '[&_svg]:size-4', '[&_svg]:shrink-0')
  })

  describe('buttonVariants', () => {
    it('应该生成正确的默认类名', () => {
      const classes = buttonVariants()
      expect(classes).toContain('bg-primary')
      expect(classes).toContain('text-primary-foreground')
      expect(classes).toContain('h-9')
      expect(classes).toContain('px-4')
    })

    it('应该生成正确的变体类名', () => {
      const destructiveClasses = buttonVariants({ variant: 'destructive' })
      expect(destructiveClasses).toContain('bg-destructive')
      expect(destructiveClasses).toContain('text-destructive-foreground')

      const outlineClasses = buttonVariants({ variant: 'outline' })
      expect(outlineClasses).toContain('border')
      expect(outlineClasses).toContain('border-input')
    })

    it('应该生成正确的尺寸类名', () => {
      const smallClasses = buttonVariants({ size: 'sm' })
      expect(smallClasses).toContain('h-8')
      expect(smallClasses).toContain('px-3')
      expect(smallClasses).toContain('text-xs')

      const largeClasses = buttonVariants({ size: 'lg' })
      expect(largeClasses).toContain('h-10')
      expect(largeClasses).toContain('px-8')
    })

    it('应该合并自定义类名', () => {
      const customClasses = buttonVariants({ className: 'custom-class' })
      expect(customClasses).toContain('custom-class')
    })
  })
})
