import js from '@eslint/js'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'

const baseConfig = js.configs.recommended

export default defineConfig([
  {
    ignores: ['node_modules', 'coverage'],
  },
  {
    ...baseConfig,
    files: ['**/*.js'],
    languageOptions: {
      ...baseConfig.languageOptions,
      sourceType: 'module',
      globals: {
        ...(baseConfig.languageOptions?.globals || {}),
        ...globals.node,
      },
    },
    rules: {
      ...baseConfig.rules,
      'no-console': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.test.js', '**/*.spec.js', 'tests/**/*.js'],
    languageOptions: {
      ...baseConfig.languageOptions,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  eslintConfigPrettier,
])
