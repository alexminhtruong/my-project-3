import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {
      js,
      '@stylistic': stylistic,
    },
    rules: {
      'indent': ['error', 2],
      '@stylistic/indent': ['error', 2],
    },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser },
  },
]);
