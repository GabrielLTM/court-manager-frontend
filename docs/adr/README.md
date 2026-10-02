# Registros de decisão de arquitetura (ADRs)

Este diretório guarda as decisões arquiteturais do frontend da Arena Beach Tennis. O formato é o de Michael Nygard (título, status, contexto, decisão e consequências), com duas seções a mais: **Alternativas consideradas** e **Referências**. Os ADRs explicam o *porquê* do que [architecture.md](../architecture.md) descreve.

## Índice

| ADR | Título | Status | Data |
| --- | --- | --- | --- |
| [0001](0001-arquitetura-limpa-em-camadas.md) | Arquitetura limpa em camadas | Aceita | 2026-09-25 |
| [0002](0002-backend-simulado-no-navegador.md) | Backend simulado no navegador | Aceita | 2026-09-25 |
| [0003](0003-estado-do-servidor-com-tanstack-query.md) | Estado do servidor com TanStack Query | Aceita | 2026-09-25 |
| [0004](0004-regras-de-negocio-no-dominio.md) | Regras de negócio no domínio | Aceita | 2026-09-25 |
| [0005](0005-css-modules-e-design-tokens.md) | CSS Modules e design tokens | Aceita | 2026-09-25 |
| [0006](0006-formularios-com-react-hook-form-e-zod.md) | Formulários com React Hook Form e Zod | Aceita | 2026-09-25 |
| [0007](0007-identidade-visual-ottawa-tech.md) | Identidade visual Ottawa Tech | Aceita | 2026-09-28 |
| [0008](0008-contrato-de-dados-enums-numericos-e-datas-iso.md) | Contrato de dados: enums numéricos e datas ISO | Aceita | 2026-09-25 |

## Legenda de status

| Status | Significado |
| --- | --- |
| Proposta | Em discussão; ainda não vale como decisão. |
| Aceita | Em vigor: o código segue a decisão. |
| Rejeitada | Avaliada e descartada; fica registrada para guardar o motivo. |
| Obsoleta | Deixou de valer sem decisão substituta (por exemplo, a funcionalidade foi removida). |
| Substituída por ADR-NNNN | Trocada por uma decisão posterior, com link para ela. |

## Como escrever um novo ADR

Escreva um ADR quando a decisão for difícil de reverter, atravessar mais de uma camada ou limitar escolhas futuras (nova biblioteca de estado, formato de dados, fronteira entre camadas, estratégia de autenticação). Mudanças de rotina não precisam de ADR.

1. Escolha o próximo número sequencial (quatro dígitos) e crie `NNNN-titulo-em-kebab-case.md` nesta pasta.
2. Copie o modelo abaixo e preencha todas as seções. Use português, um único título `#` e blocos de código com a linguagem indicada.
3. Fundamente os fatos no repositório, com links relativos para arquivos (por exemplo, `../../src/di/container.ts`) e documentos. Cite a Especificação 1.0 por seção, pois ela não está no repositório.
4. Registre consequências **positivas e negativas** e não invente motivações: se o motivo de uma escolha não está documentado, descreva a decisão e as consequências. Em "Alternativas consideradas", registre opções comparáveis e o motivo técnico verificável para não adotá-las.
5. Adicione a linha ao índice acima e, se for o caso, cite o ADR em [architecture.md](../architecture.md).
6. Não reescreva um ADR aceito. Para mudar uma decisão, crie um novo ADR e marque o antigo como "Substituída por ADR-NNNN" (só o status e o link do antigo mudam).

### Modelo

```markdown
# ADR-NNNN — Título curto

- **Status:** Proposta
- **Data:** AAAA-MM-DD
- **Decisores:** Equipe Ottawa Tech

## Contexto

Problema, forças em jogo e restrições (código, especificação, prazos).

## Decisão

O que foi decidido, em frases afirmativas ("Usar...", "Manter...").

## Consequências

**Positivas**
- ...

**Negativas e trade-offs**
- ...

## Alternativas consideradas

- **Opção A.** Não adotada: motivo técnico.

## Referências

- [`arquivo.ts`](../../src/caminho/arquivo.ts)
```
