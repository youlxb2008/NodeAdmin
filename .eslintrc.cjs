/**
 * 根 ESLint 配置（CommonJS 格式）
 * 用于 monorepo 顶层统一基础规则；各子包可在自身 .eslintrc.cjs 中覆盖/扩展
 */
module.exports = {
  root: true,
  env: { node: true, browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    // 关掉原生规则，使用 TS 版本（能识别 NestJS 构造函数 parameter properties）
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // 后端/脚本允许 console
    'no-console': 'off',
    // 项目初期允许 any，避免阻塞迭代
    '@typescript-eslint/no-explicit-any': 'off',
  },
  ignorePatterns: ['dist/**', 'node_modules/**', '**/*.d.ts'],
}
