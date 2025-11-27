import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import TagFilter from '@/components/prompt/TagFilter'

describe('TagFilter', () => {
  const mockTags = ['React', 'JavaScript', 'CSS', 'Node.js', 'TypeScript']
  const mockOnTagSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该渲染所有标签', () => {
    render(
      <TagFilter 
        allTags={mockTags}
        selectedTags={[]}
        onTagSelect={mockOnTagSelect}
      />
    )

    mockTags.forEach(tag => {
      expect(screen.getByText(tag)).toBeInTheDocument()
    })
  })

  it('应该正确显示选中和未选中的标签样式', () => {
    const selectedTags = ['React', 'JavaScript']
    
    render(
      <TagFilter 
        allTags={mockTags}
        selectedTags={selectedTags}
        onTagSelect={mockOnTagSelect}
      />
    )

    // 检查选中的标签
    const reactTag = screen.getByText('React')
    const jsTag = screen.getByText('JavaScript')
    
    // 选中的标签应该有default变体样式
    expect(reactTag.closest('[class*="variant"]')).toBeInTheDocument()
    expect(jsTag.closest('[class*="variant"]')).toBeInTheDocument()

    // 检查未选中的标签
    const cssTag = screen.getByText('CSS')
    expect(cssTag).toHaveClass('bg-background')
  })

  it('点击未选中的标签应该添加到选中列表', () => {
    const selectedTags = ['React']
    
    render(
      <TagFilter 
        allTags={mockTags}
        selectedTags={selectedTags}
        onTagSelect={mockOnTagSelect}
      />
    )

    const cssTag = screen.getByText('CSS')
    fireEvent.click(cssTag)

    expect(mockOnTagSelect).toHaveBeenCalledWith(['React', 'CSS'])
  })

  it('点击已选中的标签应该从选中列表中移除', () => {
    const selectedTags = ['React', 'JavaScript', 'CSS']
    
    render(
      <TagFilter 
        allTags={mockTags}
        selectedTags={selectedTags}
        onTagSelect={mockOnTagSelect}
      />
    )

    const jsTag = screen.getByText('JavaScript')
    fireEvent.click(jsTag)

    expect(mockOnTagSelect).toHaveBeenCalledWith(['React', 'CSS'])
  })

  it('应该为所有标签添加cursor-pointer和hover样式', () => {
    render(
      <TagFilter 
        allTags={mockTags}
        selectedTags={[]}
        onTagSelect={mockOnTagSelect}
      />
    )

    mockTags.forEach(tag => {
      const tagElement = screen.getByText(tag)
      expect(tagElement).toHaveClass('cursor-pointer', 'hover:opacity-80')
    })
  })

  it('空标签列表时应该不渲染任何内容', () => {
    const { container } = render(
      <TagFilter 
        allTags={[]}
        selectedTags={[]}
        onTagSelect={mockOnTagSelect}
      />
    )

    expect(container.firstChild.children).toHaveLength(0)
  })

  it('应该正确处理单个标签的选择和取消', () => {
    render(
      <TagFilter 
        allTags={['React']}
        selectedTags={[]}
        onTagSelect={mockOnTagSelect}
      />
    )

    const reactTag = screen.getByText('React')
    
    // 第一次点击 - 选中
    fireEvent.click(reactTag)
    expect(mockOnTagSelect).toHaveBeenCalledWith(['React'])

    // 重新渲染为选中状态
    const { rerender } = render(
      <TagFilter 
        allTags={['React']}
        selectedTags={['React']}
        onTagSelect={mockOnTagSelect}
      />
    )

    const selectedReactTag = screen.getByText('React')
    
    // 第二次点击 - 取消选中
    fireEvent.click(selectedReactTag)
    expect(mockOnTagSelect).toHaveBeenCalledWith([])
  })

  it('应该正确处理多个标签的复杂选择操作', () => {
    const { rerender } = render(
      <TagFilter 
        allTags={mockTags}
        selectedTags={[]}
        onTagSelect={mockOnTagSelect}
      />
    )

    // 选择第一个标签
    fireEvent.click(screen.getByText('React'))
    expect(mockOnTagSelect).toHaveBeenCalledWith(['React'])

    // 重新渲染并选择第二个标签
    rerender(
      <TagFilter 
        allTags={mockTags}
        selectedTags={['React']}
        onTagSelect={mockOnTagSelect}
      />
    )
    
    fireEvent.click(screen.getByText('JavaScript'))
    expect(mockOnTagSelect).toHaveBeenCalledWith(['React', 'JavaScript'])

    // 重新渲染并取消第一个标签
    rerender(
      <TagFilter 
        allTags={mockTags}
        selectedTags={['React', 'JavaScript']}
        onTagSelect={mockOnTagSelect}
      />
    )
    
    fireEvent.click(screen.getByText('React'))
    expect(mockOnTagSelect).toHaveBeenCalledWith(['JavaScript'])
  })

  it('应该保持标签的原始顺序', () => {
    render(
      <TagFilter 
        allTags={mockTags}
        selectedTags={[]}
        onTagSelect={mockOnTagSelect}
      />
    )

    const tagElements = screen.getAllByRole('button')
    const tagTexts = tagElements.map(el => el.textContent)
    
    expect(tagTexts).toEqual(mockTags)
  })

  it('应该正确处理重复标签名称', () => {
    const tagsWithDuplicates = ['React', 'React', 'JavaScript']
    
    render(
      <TagFilter 
        allTags={tagsWithDuplicates}
        selectedTags={[]}
        onTagSelect={mockOnTagSelect}
      />
    )

    // 应该渲染所有标签，包括重复的
    const reactTags = screen.getAllByText('React')
    expect(reactTags).toHaveLength(2)
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
  })

  it('应该使用flex布局和gap间距', () => {
    const { container } = render(
      <TagFilter 
        allTags={mockTags}
        selectedTags={[]}
        onTagSelect={mockOnTagSelect}
      />
    )

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('flex', 'flex-wrap', 'gap-2')
  })
})