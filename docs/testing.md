# Testes

Os testes não fazem parte do repositório: ficam só na cópia local de quem desenvolve, e o Git os ignora (veja o
`.gitignore` e o [ADR-0011](adr/0011-testes-fora-do-repositorio.md)). Quem clona o projeto não recebe os testes; no
repositório, o comportamento é protegido pelo lint, pelo typecheck (que inclui os templates) e pelo build.

## O que fica só na cópia local

| Arquivos | Conteúdo |
| --- | --- |
| `src/**/__tests__/` | Testes unitários (Vitest): regras do domínio, casos de uso, backend simulado, adaptadores HTTP, lógica das telas e componentes Angular (TestBed) |
| `src/test/setup.ts`, `src/app/testing/` | Inicialização do TestBed e dados de apoio |
| `vite.config.ts` | Configuração do Vitest (jsdom e o plugin que embute `templateUrl` e `styleUrl`) |
| `e2e/`, `playwright.config.ts` | Fluxos completos no navegador (Playwright) |
| `tsconfig.tests.json` | Typecheck dos testes |
| `scripts/capture-screens.mjs` | Gera as capturas de `docs/images/angular/` |

## Como rodar

Com a cópia local:

```bash
npm test
npm run test:watch
npm run test:e2e
npx tsc -p tsconfig.tests.json
```

- `npm test` precisa do Node 22 ou 24: a partir do Node 25, o `localStorage` embutido no Node atrapalha o jsdom.
- O E2E sobe o Angular CLI na porta 5174 e usa o Chromium em `/usr/bin/chromium`. Em outra máquina, defina
  `CHROMIUM_PATH`; no macOS, o Chrome fica em `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
- `git clean -X` (ou `-x`) apaga os arquivos ignorados pelo Git e, com eles, os testes locais.
