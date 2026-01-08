import coreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [
      "**/__tests__/**",
      "**/__mocks__/**",
      "**/coverage/**",
      "**/.next/**",
      "**/node_modules/**",
    ],
  },
  ...coreWebVitals,
  {
    rules: {
      // 这些规则在当前代码库/React 版本组合下误报较多，先降级以保证 lint 可用
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
];

