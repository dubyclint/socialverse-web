import js from '@eslint/js'
import globals from 'globals'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'

// Nuxt/Nitro auto-imports are not visible to ESLint's scope analysis.
const nuxtAutoImports = {
  defineNuxtConfig: 'readonly',
  defineNuxtPlugin: 'readonly',
  defineNuxtRouteMiddleware: 'readonly',
  defineEventHandler: 'readonly',
  defineCachedFunction: 'readonly',
  defineWebSocketHandler: 'readonly',
  createError: 'readonly',
  getQuery: 'readonly',
  getRouterParam: 'readonly',
  getHeader: 'readonly',
  setHeader: 'readonly',
  setResponseStatus: 'readonly',
  readBody: 'readonly',
  readMultipartFormData: 'readonly',
  sendRedirect: 'readonly',
  useRuntimeConfig: 'readonly',
  useStorage: 'readonly',
  useNuxtApp: 'readonly',
  useRouter: 'readonly',
  useRoute: 'readonly',
  useState: 'readonly',
  useFetch: 'readonly',
  useAsyncData: 'readonly',
  useCookie: 'readonly',
  useHead: 'readonly',
  useSeoMeta: 'readonly',
  useSupabaseClient: 'readonly',
  useSupabaseUser: 'readonly',
  navigateTo: 'readonly',
  abortNavigation: 'readonly',
  $fetch: 'readonly',
  definePageMeta: 'readonly',
  defineAppConfig: 'readonly',
}

export default [
  {
    ignores: [
      '.nuxt/**',
      '.output/**',
      '.nitro/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      'android/**',
      'ios/**',
      'public/**',
      '**/*.min.js',
      'types/database.types.ts',
    ],
  },
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue']
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...nuxtAutoImports,
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      vue
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  },
  {
    // TypeScript's own compiler resolves identifiers; ESLint scope analysis
    // cannot see Nuxt/Nitro auto-imports or DOM lib types.
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      'no-undef': 'off'
    }
  },
  {
    files: ['supabase/functions/**/*.ts'],
    languageOptions: {
      globals: { Deno: 'readonly' }
    }
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue']
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...nuxtAutoImports,
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      vue
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  }
]
