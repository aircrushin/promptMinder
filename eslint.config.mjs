import next from "@next/eslint-plugin-next";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@next/next": next,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
    },
  },
];
