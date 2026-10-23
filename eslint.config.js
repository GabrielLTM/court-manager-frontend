import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Regras de dependência da Arquitetura Limpa:
 *   domain  <-  application  <-  infrastructure / presentation  <-  di (composition root)
 * Camadas internas nunca importam camadas externas.
 */
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
    ['src/domain/**'],
    ['@/application/*', '@/infrastructure/*', '@/presentation/*', '@/di/*', '@angular/*', 'axios'],
    'A camada de domínio é pura: não pode depender de outras camadas nem de frameworks.',
  ),
  layer(
    ['src/application/**'],
    ['@/infrastructure/*', '@/presentation/*', '@/di/*', '@angular/*', 'axios'],
    'A camada de aplicação depende apenas do domínio (e de portas/abstrações).',
  ),
  layer(
    ['src/infrastructure/**'],
    ['@/presentation/*', '@/di/*', '@angular/*'],
    'A infraestrutura implementa portas da aplicação e não conhece a UI.',
  ),
  layer(
    ['src/presentation/**'],
    ['@/infrastructure/*', 'axios'],
    'A apresentação conversa com a aplicação via AppServices (injeção de dependência), nunca com a infraestrutura.',
  ),
]);
