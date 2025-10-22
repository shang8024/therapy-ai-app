// @config/eslint — shared flat config for monorepo
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import nodePlugin from "eslint-plugin-node";
import pluginPrettier from "eslint-plugin-prettier";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactNative from "eslint-plugin-react-native";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  // 1) Global ignores
  {
    name: "global-ignores",
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.expo/**",
      "**/.expo-shared/**",
      "**/.turbo/**",
      "**/coverage/**",
    ],
  },

  // 2) Base JS config for all files
  {
    name: "base-js",
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports,
      prettier: pluginPrettier,
    },
    rules: {
      "no-console": "warn",
      "no-debugger": "warn",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "prettier/prettier": ["warn"],
      // import hygiene
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },

  // 3) TypeScript config
  {
    name: "base-ts",
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true, // allow per-package tsconfig.json
        tsconfigRootDir: process.cwd(),
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
      "unused-imports": unusedImports,
      prettier: pluginPrettier,
    },
    rules: {
      "no-console": "warn",
      "no-debugger": "warn",
      "prettier/prettier": ["warn"],
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // import rules for TS
      "import/extensions": "off",
      "import/no-unresolved": "off", // TS handles this
    },
  },

  // 4) React / React Hooks (common)
  {
    name: "react-common",
    files: ["**/*.{tsx,jsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      prettier: pluginPrettier,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        __DEV__: true,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/jsx-uses-react": "off", // new JSX transform
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "jsx-a11y/alt-text": "warn",
      "prettier/prettier": ["warn"],
    },
  },

  // 5) React Native / Expo app overrides
  {
    name: "react-native-app",
    files: ["apps/mobile/**/*.{ts,tsx,js,jsx}"],
    plugins: {
      "react-native": reactNative,
    },
    rules: {
      "react-native/no-unused-styles": "warn",
      "react-native/no-inline-styles": "off", // allow inline styles in RN
      "react-native/no-color-literals": "off",
      "react-native/no-single-element-style-arrays": "warn",
    },
  },

  // 6) Node / API service overrides
  {
    name: "node-api",
    files: ["apps/api/**/*.{ts,js}"],
    plugins: {
      node: nodePlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "node/no-unsupported-features/es-syntax": "off",
      "node/no-missing-import": "off", // resolved by TS/node
    },
  },

  // 7) Disable stylistic conflicts with Prettier (must come last)
  prettier,
];
