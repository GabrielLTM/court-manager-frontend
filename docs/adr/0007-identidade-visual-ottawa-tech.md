# ADR-0007 — Identidade visual Ottawa Tech

- **Status:** Aceita
- **Data:** 2026-09-28
- **Decisores:** Equipe Ottawa Tech

## Contexto

A primeira versão do frontend (2026-09-25) usava o design system "Organic" do protótipo, de tema claro: fundo `#f5ead8`, superfície `#ebddc5`, texto `#201e1d`, destaque laranja `#c67139` (`--color-accent`), verde `#7a8a5e` (`--color-accent-2`) e fontes Caprasimo (títulos) e Figtree (corpo).

Em 2026-09-28 a interface migrou para a paleta da Ottawa Tech, em tema escuro, conforme o design v2 da equipe: fundo `#040813`, superfície `#0d1426`, texto `#eaf0ff`, destaque ciano `#1fb4f5`, segundo destaque violeta `#7a5cff`, fontes Sora (títulos) e Figtree (corpo) e o símbolo da Ottawa Tech como marca. Como os estilos já dependiam de tokens ([ADR-0005](0005-css-modules-e-design-tokens.md)), a migração podia se concentrar neles.

## Decisão

A mudança foi feita no commit `a56a1cd`:

- **Tokens** (`design-system.css`): mantidos os nomes `--color-*`, com `color-scheme: dark` e novos valores. As rampas `neutral`, `accent` e `accent-2` foram refeitas para fundo escuro (o passo `100` é o mais próximo do fundo e o `900` o mais claro). O botão primário passou a usar `--gradient-brand` (ciano para violeta) e `--gradient-brand-hover`, e as sombras viraram contorno fino mais escuridão ambiente.
- **Fontes**: os títulos usam Sora, auto-hospedada pelo pacote `@fontsource-variable/sora` (importado no CSS e declarado em `package.json`), com `--font-heading-weight` de 600. A Caprasimo e seus arquivos `woff2` foram removidos; a Figtree continua em `styles/fonts`.
- **Marca**: `BrandMark` exibe o símbolo (`presentation/assets/ottawa-tech-simbolo.jpg`) e "Arena Beach Tennis", com a assinatura "by Ottawa Tech" no tamanho `lg` (tela de login). Favicon e `apple-touch-icon` em PNG, gerados a partir do logo, substituem o `favicon.svg`; `index.html` passa a ter `theme-color` `#040813` e a descrição "Arena Beach Tennis by Ottawa Tech".
- **Textos**: `PageHeader` deixou de exibir a tag de rota; as dicas de endpoint (por exemplo, "POST /api/auth/login") saíram das telas; os avisos de quadra indisponível (`avisoQuadraIndisponivel`) e de cancelamento foram reescritos sem códigos de regra; a tag "MVP — Sprint 1 a 6" saiu do login.
- **Testes**: atualizados para os novos textos, com um teste novo para o aviso de quadra indisponível.

## Consequências

**Positivas**

- A troca ficou concentrada em tokens, marca e textos. As mudanças de API em componentes foram mínimas: `PageHeader` perdeu a propriedade `route` e `BrandMark` ganhou `assinatura`.
- A interface passa a usar a identidade da Ottawa Tech, com botão primário em degradê.
- As fontes continuam hospedadas no projeto, sem CDN.

**Negativas e trade-offs**

- Restam cores fixas fora dos tokens: `BrandMark.module.css` usa `#040813`, o ícone SVG embutido em `Input.module.css` tem a cor no data URI e `.btn-primary` usa `color: #fff`. O contraste do botão primário é discutido em [design-system.md](../design-system.md).
- Os nomes `accent` e `accent-2` foram mantidos, mas as cores mudaram (o `accent-2` era verde-oliva e agora é violeta); por isso o nome do token já não descreve a cor.
- O nome "Organic" permanece no cabeçalho de `design-system.css`, como origem dos tokens, mesmo com os valores retunados.
- Existe um único tema (escuro); não há alternância.
- O símbolo é uma imagem raster (JPG), exibida com `object-fit: cover` sobre fundo fixo.

## Alternativas consideradas

- **Manter a paleta Organic (bege e laranja).** Não adotada: o design v2 da equipe define a identidade da Ottawa Tech para a interface.
- **Oferecer os dois temas, com alternância claro e escuro.** Não adotada: ampliaria o escopo da migração (duas rampas tonais e dois conjuntos de contraste a manter), e a decisão foi migrar para o tema escuro.
- **Trocar os valores diretamente nos componentes e CSS Modules.** Não adotada: os tokens existem para isso ([ADR-0005](0005-css-modules-e-design-tokens.md)) e evitam editar dezenas de arquivos.
- **Carregar a Sora de um CDN.** Não adotada: o projeto hospeda as próprias fontes; a Sora vem de um pacote npm e é empacotada no build.

## Referências

- [`design-system.css`](../../src/presentation/styles/design-system.css): tokens e fontes.
- [`BrandMark.tsx`](../../src/presentation/components/ui/BrandMark.tsx) e [`BrandMark.module.css`](../../src/presentation/components/ui/BrandMark.module.css).
- [`ottawa-tech-simbolo.jpg`](../../src/presentation/assets/ottawa-tech-simbolo.jpg), [`favicon.png`](../../public/favicon.png) e [`apple-touch-icon.png`](../../public/apple-touch-icon.png).
- [`index.html`](../../index.html) e [`package.json`](../../package.json).
- [`design-system.md`](../design-system.md) e [`screens.md`](../screens.md).
- [ADR-0005](0005-css-modules-e-design-tokens.md).
