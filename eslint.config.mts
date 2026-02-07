import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import unicorn from 'eslint-plugin-unicorn';
import prettier from 'eslint-plugin-prettier';

export default defineConfig([
    eslint.configs.recommended,
    tseslint.configs.strict,
    tseslint.configs.stylistic,
    eslintPluginPrettierRecommended,
    {
        plugins: {
            unicorn,
            prettier,
        },
        rules: {
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/no-extraneous-class': 'off',
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            complexity: ['error', 4],
            'max-params': ['error', 4],
            'no-console': 'error',
            'no-floating-decimal': 'error',
            'no-magic-numbers': ['error', { ignore: [0, 1, -1] }],
            'require-unicode-regexp': 'error',
            'no-confusing-arrow': ['error', { allowParens: true }],
            'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
            'no-duplicate-imports': 'error',
            'prefer-arrow-callback': ['error', { allowNamedFunctions: false, allowUnboundThis: true }],
        },
    },
    {
        files: ['src/main.ts'],
        rules: {
            'no-console': 'off',
        },
    },
    {
        files: ['test/**/*.ts'],
        rules: {
            'no-magic-numbers': 'off',
            complexity: 'off',
        },
    },
    {
        files: ['src/auto-run-scripts/index.ts'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    {
        files: ['src/manual-scripts/*.ts'],
        rules: {
            'no-console': 'off',
        },
    },
    {
        files: ['src/vocabulary/domains/LeitnerBoxAppearanceDifference.ts', 'src/vocabulary/domains/LeitnerBoxType.ts'],
        rules: {
            'no-magic-numbers': 'off',
        },
    },
]);
