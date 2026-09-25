import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
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
  globalIgnores(['dist', 'coverage', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
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
    ['@/application/*', '@/infrastructure/*', '@/presentation/*', '@/di/*', 'react', 'axios'],
    'A camada de domínio é pura: não pode depender de outras camadas nem de frameworks.',
  ),
  layer(
    ['src/application/**'],
    ['@/infrastructure/*', '@/presentation/*', '@/di/*', 'react', 'axios'],
    'A camada de aplicação depende apenas do domínio (e de portas/abstrações).',
  ),
  layer(
    ['src/infrastructure/**'],
    ['@/presentation/*', '@/di/*', 'react'],
    'A infraestrutura implementa portas da aplicação e não conhece a UI.',
  ),
  layer(
    ['src/presentation/**'],
    ['@/infrastructure/*', 'axios'],
    'A apresentação conversa com a aplicação via AppServices (injeção de dependência), nunca com a infraestrutura.',
  ),
]);
