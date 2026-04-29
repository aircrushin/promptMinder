const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

describe('lint configuration', () => {
  it('应该使用 ESLint CLI 而不是已移除的 next lint', () => {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    expect(packageJson.scripts.lint).toContain('eslint');
    expect(packageJson.scripts.lint).not.toContain('next lint');
  });

  it('应该忽略 Next.js 构建产物目录', async () => {
    const configUrl = pathToFileURL(path.join(process.cwd(), 'eslint.config.mjs')).href;
    const configModule = await import(configUrl);
    const eslintConfig = configModule.default;
    const ignoreConfig = eslintConfig.find((entry) => Array.isArray(entry.ignores));

    expect(ignoreConfig).toBeDefined();
    expect(ignoreConfig.ignores).toContain('.next/**');
  });
});
