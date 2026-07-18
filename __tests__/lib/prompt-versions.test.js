import { allocateNextVersion, suggestNextVersion } from '@/lib/prompt-versions'

describe('prompt-versions', () => {
  describe('suggestNextVersion', () => {
    it('应该对语义化版本递增 patch', () => {
      expect(suggestNextVersion('1.2.3')).toBe('1.2.4')
    })

    it('应该对两位版本递增 minor', () => {
      expect(suggestNextVersion('2.4')).toBe('2.5')
    })

    it('应该在空值时回退到 1.0.0', () => {
      expect(suggestNextVersion('')).toBe('1.0.0')
      expect(suggestNextVersion(null)).toBe('1.0.0')
    })

    it('应该对非数字版本追加 restored 后缀', () => {
      expect(suggestNextVersion('beta')).toBe('beta-restored')
    })
  })

  describe('allocateNextVersion', () => {
    it('应该避开已存在的版本号', () => {
      expect(allocateNextVersion(['1.0.0', '1.0.1'], '1.0.1')).toBe('1.0.2')
    })
  })
})
