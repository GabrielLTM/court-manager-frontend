# Contribuindo

Use Node 24 LTS e `npm ci`, depois `npm run dev`. O projeto usa Angular 21 com componentes standalone e TypeScript estrito. Leia [arquitetura](docs/architecture.md), [regras](docs/business-rules.md), [DESIGN.md](DESIGN.md) e [UX-CONTRACT.md](UX-CONTRACT.md) antes de modificar fluxos.

## Fronteiras

- Domínio não depende de Angular, HTTP ou camadas externas.
- Aplicação depende do domínio e portas.
- Infraestrutura implementa portas e não conhece UI.
- Apresentação usa `AppServices` via `APP_SERVICES`/`AppState`; nunca axios nem repositórios.
- `src/main.ts` é o composition root Angular e usa a factory `core/di/container.ts`.

## Onde fica cada coisa

O que é de uma tela fica junto, na pasta do domínio: `src/features/quadras/` tem `quadras.ts` (componente), `quadras.html` (template), `quadras.css` (estilos só dessa tela), `quadras.utils.ts` (lógica pura), `quadras.schemas.ts` (validação) e `__tests__/`. Uma tela nova segue o mesmo padrão; o `.css` só existe quando a tela tem estilo próprio. O que várias telas usam fica em `src/shared/` (`ui/` para componentes e `styles/global.css` para estilos), a casca do app em `src/app/` e as regras de negócio em `src/core/`.

Escreva regras no domínio, orquestre casos de uso na aplicação e mantenha formatação/filtros puros nos `*.utils.ts` da tela. As telas reutilizam `EditorComponent`, `DialogComponent`, `PaginationComponent` (`src/shared/ui/`) e tokens globais. Não introduza uma segunda implementação de confirmação, validação ou estado de sessão por tela.

## Validação antes do push

```bash
npm run format
npm run lint
npm run typecheck
npm run build
```

Os testes não são versionados: ficam só na cópia local e o Git os ignora (veja [testes](docs/testing.md)). Se você tem a cópia, rode também `npm test` e `npm run test:e2e`. Confira sucesso, erro, vazio, carregamento, teclado, acesso por perfil e 375px. Não altere contratos financeiros ou permissões somente no frontend. Atualize docs e ADRs quando houver decisão durável.

Mantenha lockfile e instalação reproduzível. Nunca inclua `.env`, segredos, `node_modules`, `dist`, caches ou relatórios transitórios do Playwright no commit. Contas mock documentadas são dados públicos de demonstração.
