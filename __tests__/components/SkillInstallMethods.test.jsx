import { render, screen, fireEvent } from '@testing-library/react'
import { SkillInstallMethods } from '@/components/skill/SkillInstallMethods'

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}))

jest.mock('@/lib/clipboard', () => ({
  useClipboard: () => ({
    copy: jest.fn(),
    copied: false,
  }),
}))

describe('SkillInstallMethods', () => {
  const skill = {
    slug: 'find-skills',
    source: 'vercel-labs/skills',
    sourceType: 'github',
    installUrl: 'https://github.com/vercel-labs/skills',
  }

  it('应该展示与 skills.sh 一致的 Command 安装命令', () => {
    render(<SkillInstallMethods skill={skill} />)

    expect(screen.getByText(
      '$ npx skills add https://github.com/vercel-labs/skills --skill find-skills'
    )).toBeInTheDocument()
  })

  it('切换到 Prompt 时应展示 skills use 安装提示词', () => {
    render(<SkillInstallMethods skill={skill} />)

    fireEvent.click(screen.getByRole('button', { name: 'Prompt' }))

    expect(screen.getByText(
      /Run `npx skills use "https:\/\/github.com\/vercel-labs\/skills" --skill "find-skills"`/
    )).toBeInTheDocument()
  })

  it('缺少安装源时不应渲染', () => {
    const { container } = render(
      <SkillInstallMethods
        skill={{
          slug: 'lark-approval',
          source: 'open.feishu.cn',
          sourceType: 'well-known',
          installUrl: null,
        }}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })
})
