import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { fixupConfigRules } from '@eslint/compat';
import nx from '@nx/eslint-plugin';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});

export default [
  ...fixupConfigRules(compat.extends('eslint-config-prettier')),
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/out-tsc/**', '**/coverage/**', '**/.next/**', 'next-env.d.ts'],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: { '@nx': nx },
  },
  ...fixupConfigRules(compat.extends('plugin:@nx/typescript')),
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: { project: ['tsconfig.base.json'] },
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.tsx'],
    languageOptions: { globals: { ...globals.browser } },
  },
];