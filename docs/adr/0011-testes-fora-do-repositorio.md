# ADR-0011 — Testes fora do repositório

- **Status:** Aceita
- **Data:** 2026-11-07
- **Decisores:** Equipe Ottawa Tech

## Contexto

O repositório tinha 33 arquivos de teste e de configuração de testes, com cerca de 3.500 linhas: testes unitários
com Vitest, testes de componentes com TestBed e fluxos no navegador com Playwright. A equipe quer um repositório
menor, só com o código do sistema, e os testes podem rodar apenas na máquina de quem desenvolve.

## Decisão

Tirar os testes do controle de versão e mantê-los só na cópia local, ignorados pelo `.gitignore`: as pastas
`__tests__/`, `src/test/`, `src/app/testing/` e `e2e/`, além de `vite.config.ts`, `playwright.config.ts`,
`tsconfig.tests.json` e `scripts/capture-screens.mjs`.

As dependências (Vitest, jsdom e Playwright) e os comandos `npm test`, `npm run test:watch` e `npm run test:e2e`
continuam no `package.json` para rodar a cópia local. O `npm run typecheck` passa a checar só a aplicação.

## Consequências

**Positivas**

- O repositório fica só com o código do sistema, a configuração e a documentação.

**Negativas e trade-offs**

- Quem clona o projeto não tem testes: `npm test` e `npm run test:e2e` não encontram arquivos. No repositório, só o
  lint, o typecheck e o build protegem o código.
- Os testes existem em uma só máquina. Se ela se perder, só dá para recuperá-los do histórico do Git, com os
  caminhos antigos (commit `618277b`).
- Mudanças nos testes não passam por revisão, e os testes podem ficar desatualizados em relação ao código.
- `git clean -X` apaga os arquivos ignorados e, com eles, os testes locais.

## Alternativas consideradas

- **Manter os testes versionados.** Não adotada: é o que a equipe quer reduzir.
- **Apagar os testes.** Não adotada: a equipe quer continuar rodando os testes localmente.

## Referências

- [`.gitignore`](../../.gitignore) e [testing.md](../testing.md).
- [ADR-0010](0010-organizacao-das-pastas-por-dominio.md).
