// ESLint配置文件 (新格式 - ESLint 9.x)
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  // 全局配置
  {
    // 忽略的文件和目录
    ignores: [
      "dist/**",
      "node_modules/**",
      "*.config.js",
      "*.config.cjs",
      "package-lock.json",
      "yarn.lock",
      "*.d.ts",
    ],
  },
  // 基础配置
  js.configs.recommended,
  // Prettier配置
  prettierConfig,
  {
    // 针对所有文件的配置
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
      },
      // 添加全局变量定义
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Promise: "readonly",
      },
    },
    // 插件
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: prettierPlugin,
    },
    // 规则
    rules: {
      // 基本规则
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-undef": "error",

      // TypeScript规则
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Prettier规则
      "prettier/prettier": [
        "warn",
        {
          endOfLine: "auto", // 解决CRLF/LF行尾问题
        },
      ],
    },
  },
  // TypeScript特定配置
  {
    files: ["**/*.{ts,tsx}"],
    // 添加TypeScript推荐规则
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
];
