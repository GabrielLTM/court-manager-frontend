# Contribuindo

Use Node 24 LTS e `npm ci`, depois `npm run dev`. O projeto usa Angular 21 com componentes standalone e TypeScript estrito. Leia [arquitetura](docs/architecture.md), [regras](docs/business-rules.md), [DESIGN.md](DESIGN.md) e [UX-CONTRACT.md](UX-CONTRACT.md) antes de modificar fluxos.

## Fronteiras

- Domínio não depende de Angular, HTTP ou camadas externas.
- Aplicação depende do domínio e portas.
- Infraestrutura implementa portas e não conhece UI.
- Apresentação usa `AppServices` via `APP_SERVICES`/`AppState`; nunca axios nem repositórios.
- `src/main.ts` é o composition root Angular e usa a factory `di/container.ts`.

Escreva regras no domínio, orquestre casos de uso na aplicação e mantenha formatação/filtros puros em `presentation/features`. Componentes em `presentation/angular` reutilizam `EditorComponent`, `DialogComponent`, `PaginationComponent` e tokens globais. Não introduza uma segunda implementação de confirmação, validação ou estado de sessão por tela.

## Validação antes do push

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

O E2E requer Chromium (`CHROMIUM_PATH` pode apontar a instalação local). Teste sucesso, erro, vazio, carregamento, teclado, acesso por perfil e 375px. Não altere contratos financeiros ou permissões somente no frontend. Atualize docs, testes e ADRs quando houver decisão durável.

Mantenha lockfile e instalação reproduzível. Nunca inclua `.env`, segredos, `node_modules`, `dist`, caches ou relatórios transitórios do Playwright no commit. Contas mock documentadas são dados públicos de demonstração.
