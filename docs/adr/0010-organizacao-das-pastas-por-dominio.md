# ADR-0010 — Organização das pastas por domínio

- **Status:** Aceita
- **Data:** 2026-11-06
- **Decisores:** Equipe Ottawa Tech
- **Complementa:** [ADR-0009](0009-migracao-angular.md), que colocava toda a interface em `presentation/angular`

## Contexto

Depois da migração para Angular ([ADR-0009](0009-migracao-angular.md)), todas as telas ficavam juntas em
`src/presentation/angular/`, com o template escrito dentro do `.ts` e os estilos de todas elas em um único
`app.css` global. A lógica de cada tela continuava nas pastas herdadas do React
(`presentation/features/admin/quadras/`, `presentation/components/MetodoPagamentoPicker/`,
`presentation/validation/`).

Para mexer em uma tela, era preciso abrir três lugares. A tela de quadras, por exemplo, tinha o componente em
`presentation/angular/courts.component.ts`, a lógica em `presentation/features/admin/quadras/quadras.utils.ts`
e os estilos espalhados no `app.css`. A equipe achou essa organização confusa e pediu que o que é de uma tela
fique junto: `quadras.ts`, `quadras.html` e `quadras.css` lado a lado.

## Decisão

Organizar a interface **por domínio** e agrupar o núcleo em uma única pasta:

| Pasta | Conteúdo |
| --- | --- |
| `src/features/<domínio>/` | As telas do domínio. Cada tela tem `<tela>.ts` (componente), `<tela>.html` (template) e, se tiver estilo próprio, `<tela>.css`. Ao lado ficam a lógica pura (`*.utils.ts`) e a validação (`*.schemas.ts`). Domínios: `auth`, `reservas`, `quadras`, `clientes`, `pagamentos` e `dashboard`. |
| `src/shared/` | O que mais de uma tela usa: componentes (`ui/`), estilos globais e tokens (`styles/`), assets e utilitários puros (`lib/`). |
| `src/app/` | A casca do app: componente raiz, rotas e guards, estado global (`AppState`) e página 404. |
| `src/core/` | O núcleo sem Angular, com as mesmas camadas de antes: `domain/`, `application/`, `infrastructure/` e `di/`. |

- Os arquivos seguem o guia de estilo do Angular 20+: `quadras.ts`, sem o sufixo `.component`. As classes
  das telas foram renomeadas para combinar com o arquivo (`CourtsComponent` virou `QuadrasComponent`).
- Os componentes usam `templateUrl` e `styleUrl`. O `app.css` global foi dividido: o que só uma tela usa foi
  para o `.css` dela, com o encapsulamento padrão do Angular; o que várias telas usam ficou em
  `src/shared/styles/global.css`.
- Um domínio com várias telas grandes ganha uma subpasta por tela: `reservas/reservar/`,
  `reservas/minhas-reservas/` e `reservas/grade/`. Nos demais domínios, os arquivos ficam na raiz da pasta.
- Imports dentro da mesma pasta são relativos; entre pastas, usam o alias `@/`.
- O `eslint.config.js` aplica a regra de dependência a `src/core/*` e trata `app`, `features` e `shared`
  como a interface, que não pode importar `core/infrastructure`, `core/di` nem `axios`.
- O comportamento não mudou. Uma comparação do estilo computado e da posição de cada elemento, em todas as
  telas e em três larguras, não encontrou diferença entre o build antigo e o novo.

## Consequências

**Positivas**

- O que é de uma tela fica em uma pasta: `src/features/quadras/` reúne componente, template, estilos,
  lógica e validação.
- Os estilos de uma tela não vazam para as outras, e o `global.css` ficou só com o que é compartilhado.
- A raiz de `src/` passou a ter `app`, `features`, `shared`, `core`, `config` e `test`.
- As camadas, as portas e os adaptadores do núcleo não mudaram, então os ADRs 0001, 0002, 0004, 0007 e 0008
  continuam valendo.

**Negativas e trade-offs**

- Regras de negócio, casos de uso e adaptadores de cada domínio continuam no núcleo (`src/core/`), não na
  pasta do domínio: quem muda uma regra mexe em `core/` e em `features/`.
- Um domínio pode importar outro (por exemplo, `auth` usa os campos de `clientes`, e a grade usa a tela de
  reservar); não há regra de lint para fronteiras entre domínios.
- Telas sem estilo próprio (minhas reservas, meus dados, pagamentos e 404) não têm `.css`.
- A mudança moveu quase todos os arquivos. O git acompanha as renomeações, mas o histórico de um arquivo
  antes da mudança exige `git log --follow`.

## Alternativas consideradas

- **Manter tudo em `presentation/angular`.** Não adotada: é a organização que a equipe achou confusa.
- **Manter os estilos globais em um só arquivo.** Não adotada: deixaria o `.css` longe da tela, o oposto do
  que foi pedido.
- **Módulos completos por domínio**, com `domain/`, `application/`, `infrastructure/` e `ui/` dentro de
  cada um. Não adotada: o backend simulado e os adaptadores HTTP compartilham banco, semente, autorização e
  mapeadores entre domínios, então dividir o núcleo exigiria mais arquivos e mais imports cruzados, sem
  ganho para quem trabalha nas telas.

## Referências

- [`eslint.config.js`](../../eslint.config.js): regras de dependência.
- [`src/features/quadras`](../../src/features/quadras), [`src/features/reservas`](../../src/features/reservas),
  [`src/shared/ui`](../../src/shared/ui), [`app.routes.ts`](../../src/app/app.routes.ts) e
  [`global.css`](../../src/shared/styles/global.css).
- [`architecture.md`](../architecture.md) (seção "Pastas") e o [README](../../README.md) (estrutura do projeto).
- [ADR-0001](0001-arquitetura-limpa-em-camadas.md) e [ADR-0009](0009-migracao-angular.md).
