# Design system Ottawa Tech

A aplicação Angular preserva o tema escuro, ciano/violeta e as fontes locais Sora/Figtree da identidade existente. O contexto durável e o mapeamento de tokens estão em [DESIGN.md](../DESIGN.md); os estados e fluxos estão em [UX-CONTRACT.md](../UX-CONTRACT.md).

## Fontes de estilo

- `src/presentation/styles/design-system.css`: proprietário canônico das cores, rampas, fontes, espaçamentos, raios, sombras e classes-base.
- `src/presentation/styles/index.css`: entrada global, utilidades de acessibilidade e reduced-motion.
- `src/presentation/angular/app.css`: layout responsivo e adaptações dos componentes Angular, consumindo os tokens existentes.

O builder Angular inclui as folhas globalmente por `angular.json`. Não há CSS Modules nem estilos em JavaScript. Não copiar tokens para temas independentes.

## Primitivas

`EditorComponent` centraliza formulários e validação; `DialogComponent` centraliza modal nativo; `PaginationComponent` centraliza navegação de listas; `AppState` e `AppComponent` centralizam notificações e confirmação. As classes `.btn`, `.card`, `.tag`, `.field`, `.actions` e `.table-scroll` garantem consistência visual.

Inputs de senha têm mostrar/ocultar; selects e datas usam controles nativos com popup do navegador. A aplicação não estiliza nem promete dimensões de popup nativo. Tabelas têm scroll horizontal local; formulários seguem o scroll natural do documento. Diálogos limitam a altura à viewport e permitem scroll interno.

## Verificação

Manter contraste, nomes acessíveis, foco visível, labels associados, mensagens textuais, teclado, reduced-motion e layout estreito. A auditoria estática é evidência complementar; os fluxos são testados em navegador por Playwright.
