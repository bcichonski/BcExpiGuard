import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['build/**', 'node_modules/**', '.nm-trash-delete-me/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    ...react.configs.flat.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      // Automatic JSX runtime: no React import needed in scope.
      ...react.configs.flat['jsx-runtime'].rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Legacy code has many untyped components; rewriting is out of scope.
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'warn',
      'no-unused-vars': 'warn',
      // CRA's preset did not flag these; rewriting reducers is out of scope.
      'no-case-declarations': 'warn',
      'no-prototype-builtins': 'warn',
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
    },
  },
  ...tseslint.configs.recommended.map((c) => ({ ...c, files: ['**/*.{ts,tsx}'] })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['e2e/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['src/tests/**', 'src/setupTests.js', 'src/**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
  },
  {
    files: ['*.config.mjs', '*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];
