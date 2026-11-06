# Migração Angular — 2026-10-22

- Apresentação migrada integralmente para Angular 21, com componentes standalone, Router, Forms e Signals.
- Domínio, casos de uso, mock, formato persistido e adaptadores REST preservados.
- Rotas de cliente e administrador, CRUD, reserva, alteração, cancelamento, pagamentos e recibos migrados.
- Testes de lógica preservados; TestBed e Playwright adicionados para a apresentação Angular.
- Documentação, build, instalação e instruções de desenvolvimento atualizados.

---

# Changelog

Todas as mudanças relevantes deste projeto são registradas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota o
[Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

- Documentação do projeto: README, guia de instalação e execução, telas e fluxos, regras de negócio,
  arquitetura com registros de decisão (ADRs), design system, estratégia de testes e guia de contribuição.

### Alterado

- Pastas organizadas por domínio ([ADR-0010](docs/adr/0010-organizacao-das-pastas-por-dominio.md)): cada
  tela fica em `src/features/<domínio>/` com o componente (`.ts`), o template (`.html`), os estilos (`.css`)
  e a lógica juntos; o compartilhado fica em `src/shared/`, a casca em `src/app/` e o núcleo em
  `src/core/`. O `app.css` global foi dividido entre as telas e `src/shared/styles/global.css`, sem mudança
  visual.
- Identidade visual da Ottawa Tech (design v2, 28/09/2026): tema escuro com ciano `#1fb4f5` e violeta
  `#7a5cff`, botão primário em degradê, fontes Sora e Figtree hospedadas localmente, símbolo "OT" no
  cabeçalho e favicon da Ottawa Tech.
- Textos mais diretos, sem jargão técnico: removidas as dicas de endpoint, a tag de rota nos títulos e a
  tag "MVP — Sprint 1 a 6"; avisos de quadra indisponível e de cancelamento reescritos.

### Removido

- Testes do repositório (unitários, de componentes e E2E) e as configurações do Vitest e do Playwright: ficam
  só na cópia local, ignorados pelo Git ([ADR-0011](docs/adr/0011-testes-fora-do-repositorio.md)).

## [1.0.0] - 2026-09-25

Primeira versão: MVP do frontend, cobrindo as Sprints 1 a 6 da Especificação 1.0.

### Adicionado

- **Acesso:** login, autocadastro do cliente (RF01), perfis Cliente e Administrador e proteção das rotas
  por perfil.
- **Cliente:** reservar quadra (data, quadra, duração e horário com valor calculado e pagamento
  simulado), minhas reservas (cancelamento com estorno e pagamento de pendências) e meus dados (RF02).
- **Administrador:** dashboard com indicadores do dia, grade de reservas (detalhe, alteração e
  cancelamento), quadras (cadastro, edição e status), clientes (busca, filtros, paginação e inativação) e
  pagamentos (confirmação e recibos).
- **Regras de negócio** RN01–RN10 aplicadas no domínio e no backend simulado.
- **Backend simulado no navegador** e **adaptadores HTTP** para a API REST, selecionados por
  `VITE_API_MODE`; contrato da API para a equipe do backend em `docs/api-contract.md`.
- **Arquitetura Limpa** (domain, application, infrastructure, presentation) com a regra de dependência
  verificada pelo ESLint e injeção de dependência em `src/di`.
- **Qualidade:** TypeScript estrito, ESLint, configuração do Prettier e mais de 230 testes
  (Vitest e Testing Library).
- Design system "Organic" do protótipo (tema claro, em tons de bege e laranja).

[Não lançado]: https://github.com/GabrielLTM/court-manager-frontend/compare/f3f8391...main
[1.0.0]: https://github.com/GabrielLTM/court-manager-frontend/commit/f3f8391
