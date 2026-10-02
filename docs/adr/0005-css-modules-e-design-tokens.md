# ADR-0005 — CSS Modules e design tokens

- **Status:** Aceita
- **Data:** 2026-09-25
- **Decisores:** Equipe Ottawa Tech

## Contexto

O protótipo "Arena Beach Tennis" traz o design system "Organic": tokens em variáveis CSS (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--font-*`) e classes de componente globais (`.btn`, `.card`, `.tag`, `.input`, `.field`, `.seg`, `.dialog`, `.table`), tudo em CSS puro. O arquivo `design-system.css` foi extraído desse protótipo.

A interface React precisa de componentes reutilizáveis (`Button`, `Card`, `Dialog`), de estilos específicos por tela, de nomes de classe sem colisão e, preferencialmente, sem custo de execução para aplicar estilos.

## Decisão

- Manter `design-system.css` como a camada **global** de tokens e classes-base. Ela é carregada uma única vez por `styles/index.css`, importado em `main.tsx`.
- Escrever os estilos específicos de cada componente ou feature em **CSS Modules** (`*.module.css`), ao lado do componente, consumindo os tokens com `var(--...)`. O `clsx` compõe as classes.
- Fazer os primitivos de `components/ui` encapsularem as classes globais (`Button` aplica `btn` e `btn-primary`; `Card` aplica `card`). As páginas usam os componentes, não as classes diretamente.
- Hospedar as fontes no próprio projeto, sem CDN: arquivos `woff2` em `styles/fonts` (a fonte dos títulos passou a vir do pacote `@fontsource-variable/sora`, como registra o [ADR-0007](0007-identidade-visual-ottawa-tech.md)).
- Tratar os tokens como a **API de tema**: mudar a identidade visual é retunar o `:root` de `design-system.css`.

## Consequências

**Positivas**

- Escopo local de classes (os nomes são gerados por módulo), sem colisões entre telas.
- Nenhum custo de execução de estilo: não há CSS-in-JS. O Vite trata CSS Modules sem dependência extra, e o Vitest os processa com `css: true`.
- O tema é trocável pelos tokens. O [ADR-0007](0007-identidade-visual-ottawa-tech.md) trocou a paleta e as fontes alterando principalmente `design-system.css`.
- Reaproveitamento direto do design system do protótipo.

**Negativas e trade-offs**

- Duas convenções coexistem (classes globais e módulos), o que exige disciplina para decidir onde cada estilo vive.
- As classes globais disputam o mesmo escopo e a especificidade precisa de cuidado; por exemplo, `index.css` usa `:where()` no `hover` dos links para que `.pill` e `.btn` sempre vençam.
- Não há lint de CSS nem verificação do uso de tokens, então sobram valores fixos: `BrandMark.module.css` usa `#040813` e o ícone SVG embutido em `Input.module.css` carrega a cor dentro do data URI.
- Existe um único tema (`color-scheme: dark`); não há alternância claro e escuro.

## Alternativas consideradas

- **Tailwind CSS.** Não adotada: o protótipo já entrega tokens e classes em CSS puro, e adotar classes utilitárias exigiria reescrever o design system existente.
- **CSS-in-JS (styled-components ou Emotion).** Não adotada: acrescenta dependência e custo de execução, e não aproveita o CSS do protótipo.
- **Um único CSS global com convenção BEM.** Não adotada: sem escopo local, o risco de colisão cresce a cada tela e componente.
- **Biblioteca de componentes (MUI ou Chakra).** Não adotada: imporia tema e componentes próprios, distantes do design system do protótipo e da identidade da Ottawa Tech.

## Referências

- [`design-system.css`](../../src/presentation/styles/design-system.css) e [`index.css`](../../src/presentation/styles/index.css).
- [`Button.tsx`](../../src/presentation/components/ui/Button.tsx), [`Button.module.css`](../../src/presentation/components/ui/Button.module.css) e [`Card.tsx`](../../src/presentation/components/ui/Card.tsx).
- [`main.tsx`](../../src/main.tsx) e [`vite.config.ts`](../../vite.config.ts) (`test.css`).
- [`design-system.md`](../design-system.md) e [`architecture.md`](../architecture.md) (seção 10).
- [ADR-0007](0007-identidade-visual-ottawa-tech.md).
