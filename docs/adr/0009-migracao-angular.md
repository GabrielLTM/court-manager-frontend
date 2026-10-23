# ADR-0009 — Migração da apresentação para Angular

- **Status:** Aceita por solicitação do mantenedor
- **Data:** 2026-10-22
- **Substitui:** ADR-0003, parte de CSS Modules do ADR-0005 e integração React Hook Form do ADR-0006

## Contexto

O mantenedor solicitou migrar integralmente o frontend React para Angular, atualizar a documentação e preservar as funcionalidades. O domínio, a aplicação e a infraestrutura já eram independentes do framework.

## Decisão

Usar Angular 21, componentes standalone, Router com guards e lazy loading, Forms e Signals. Manter TypeScript 5.9 compatível, DTOs, enums, casos de uso, backend simulado, armazenamento e adaptadores HTTP. `bootstrapApplication` recebe `APP_SERVICES` do composition root existente.

A UI é reimplementada em `presentation/angular`. `EditorComponent`, `DialogComponent` e `PaginationComponent` centralizam comportamento. Zod e máscaras existentes permanecem. O tema global e fontes locais são preservados; o layout Angular usa CSS global compartilhado, sem CSS Modules. `AppState` substitui os providers de sessão, toast e confirmação.

Cada página lê seus dados e relê após mutações, descartando respostas antigas. Não há cache compartilhado entre perfis. Não há retry automático de mutações. O contrato de acesso mantém retorno seguro à origem e home por perfil. Nomes `VITE_*` permanecem compatíveis, traduzidos pelo script de entrada para o builder Angular.

## Consequências

Eliminar dependências e fontes React, JSX, React Router, React Hook Form e TanStack Query. Manter testes puros e adicionar TestBed e Playwright para componentes e fluxos reais. A contagem de testes não é comparável diretamente com a suíte React removida; a evidência é organizada por capacidade no relatório de migração.

Seletores de data/select usam o navegador; as funcionalidades de seleção permanecem, sem promessa de identidade visual exata do popup entre sistemas operacionais. A integração HTTP real depende do backend e é uma validação separada.

## Referências

- [Arquitetura](../architecture.md)
- [Relatório de migração](../angular-migration.md)
- [Contrato de UX](../../UX-CONTRACT.md)
