import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Pastas: app (casca), features/<domínio> (telas), shared (UI e utilitários comuns) e core (núcleo).
 * Regras de dependência da Arquitetura Limpa dentro de core/:
 *   domain  <-  application  <-  infrastructure / interface (app, features, shared)  <-  di (composition root)
 * Camadas internas nunca importam camadas externas.
 */
const INTERFACE = ['@/app/*', '@/features/*', '@/shared/ui/*'];
const layer = (files, forbidden, message) => ({
  files,
  rules: {
    'no-restricted-imports': [
      'error',
      { patterns: forbidden.map((group) => ({ group: [group], message })) },
    ],
  },
});

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules', '.angular', 'out-tsc', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  layer(
    ['src/core/domain/**'],
    ['@/core/application/*', '@/core/infrastructure/*', '@/core/di/*', ...INTERFACE, '@angular/*', 'axios'],
    'A camada de domínio é pura: não pode depender de outras camadas nem de frameworks.',
  ),
  layer(
    ['src/core/application/**'],
    ['@/core/infrastructure/*', '@/core/di/*', ...INTERFACE, '@angular/*', 'axios'],
    'A camada de aplicação depende apenas do domínio (e de portas/abstrações).',
  ),
  layer(
    ['src/core/infrastructure/**'],
    ['@/core/di/*', ...INTERFACE, '@angular/*'],
    'A infraestrutura implementa portas da aplicação e não conhece a UI.',
  ),
  layer(
    ['src/app/**', 'src/features/**', 'src/shared/**'],
    ['@/core/infrastructure/*', '@/core/di/*', 'axios'],
    'A interface conversa com o núcleo via AppServices (injeção de dependência), nunca com a infraestrutura.',
  ),
]);
