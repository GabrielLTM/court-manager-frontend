# Guia de contribuição

Obrigado por querer contribuir com o frontend da Arena Beach Tennis. Este guia explica como preparar o
ambiente, como trabalhar com branches e commits, o que verificar antes de abrir um pull request e as
regras de arquitetura que mantêm o código organizado.

## Sumário

- [Antes de começar](#antes-de-começar)
- [Fluxo de trabalho](#fluxo-de-trabalho)
- [Convenção de commits](#convenção-de-commits)
- [Verificações antes do pull request](#verificações-antes-do-pull-request)
- [Regras de arquitetura](#regras-de-arquitetura)
- [Padrões de código](#padrões-de-código)
- [Testes](#testes)
- [Documentação](#documentação)
- [Pull requests](#pull-requests)
- [Reportando problemas e sugestões](#reportando-problemas-e-sugestões)

## Antes de começar

1. Leia o [README](README.md) e o [guia de instalação](docs/getting-started.md); o sistema roda com
   `npm install && npm run dev`, sem backend.
2. Entenda o domínio em [docs/business-rules.md](docs/business-rules.md) e o desenho do código em
   [docs/architecture.md](docs/architecture.md). As decisões já tomadas estão nos
   [ADRs](docs/adr/README.md).
3. Use Node.js 20.19 ou superior.

## Fluxo de trabalho

1. Atualize a `main` e crie uma branch curta para a mudança:

   ```bash
   git switch main && git pull
   git switch -c feat/filtro-de-reservas-por-status
   ```

2. Faça commits pequenos e coesos, seguindo a [convenção abaixo](#convenção-de-commits).
3. Rode as [verificações](#verificações-antes-do-pull-request).
4. Envie a branch e abra um [pull request](#pull-requests) para a `main`.

Nome das branches: `tipo/descricao-curta-em-minusculas`, usando os mesmos tipos dos commits
(`feat/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`).

## Convenção de commits

O projeto usa [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/), com a descrição
em português:

```text
tipo(escopo opcional): descrição curta no presente

Corpo opcional explicando o porquê da mudança.
```

| Tipo | Quando usar |
| --- | --- |
| `feat` | Nova funcionalidade para o usuário |
| `fix` | Correção de bug |
| `docs` | Somente documentação |
| `style` | Formatação, sem mudança de comportamento |
| `refactor` | Reorganização de código sem mudar o comportamento |
| `test` | Criação ou ajuste de testes |
| `perf` | Melhoria de desempenho |
| `build` | Dependências e configuração de build |
| `chore` | Tarefas de manutenção |

Exemplos reais do histórico do projeto:

```text
feat: paleta da Ottawa Tech (tema escuro) e identidade visual do design v2
chore: remove node_modules do versionamento
```

Use `!` depois do tipo para mudanças que quebram compatibilidade (`feat!: ...`) e descreva o impacto no
corpo do commit.

## Verificações antes do pull request

Todas devem passar localmente:

```bash
npm run lint        # ESLint e regra de dependência entre camadas
npm run typecheck   # TypeScript em modo estrito
npm test            # testes (Vitest)
npm run build       # tipos + build de produção
```

Atalho: `npm run lint && npm run typecheck && npm test && npm run build`.

## Regras de arquitetura

O código segue a Arquitetura Limpa. O `npm run lint` bloqueia importações que atravessam a fronteira
errada:

| Camada | Não pode importar |
| --- | --- |
| `src/domain` | `application`, `infrastructure`, `presentation`, `di`, `react`, `axios` |
| `src/application` | `infrastructure`, `presentation`, `di`, `react`, `axios` |
| `src/infrastructure` | `presentation`, `di`, `react` |
| `src/presentation` | `infrastructure`, `axios` |

Na prática:

- **Regra de negócio** vai em `src/domain/rules`, como função pura, e é reutilizada pela interface e pelo
  backend simulado. Nunca escreva uma regra de negócio dentro de um componente React.
- **Casos de uso** ficam em `src/application/use-cases` e dependem apenas de portas (interfaces).
- **HTTP, `localStorage` e relógio** ficam em `src/infrastructure`. Toda chamada nova precisa de adaptador
  HTTP **e** de implementação no backend simulado, para o app continuar funcionando nos dois modos.
- **A interface** só enxerga os casos de uso por `useServices()` e pelos hooks de `presentation/queries`.
- Lógica de apresentação não trivial vai em arquivos `*.utils.ts` puros, testados sem renderizar a tela.

O passo a passo para criar uma funcionalidade está em
[docs/architecture.md](docs/architecture.md#12-guia-como-adicionar-uma-funcionalidade).

## Padrões de código

- **TypeScript estrito**, sem `any` (use `unknown` e estreitamento de tipo). Use `import type` para tipos.
- **Sem `enum` do TypeScript** (o projeto usa `erasableSyntaxOnly`): represente enums como objetos
  `as const`, como em [`src/domain/enums`](src/domain/enums/index.ts).
- **Nomes e textos:** conceitos do domínio e mensagens ao usuário em português, como na especificação;
  convenções do ecossistema React (`useX`, `XProvider`) em inglês. Siga o estilo do arquivo vizinho.
- **Estilos:** CSS Modules ao lado do componente, usando os tokens `var(--...)` do
  [design system](docs/design-system.md). Não escreva cores fixas.
- **Componentes pequenos** e reutilização dos componentes de `src/presentation/components/ui`.
- **Formatação:** Prettier (`.prettierrc.json`: aspas simples, ponto e vírgula, 100 colunas). O código
  existente ainda não foi todo normalizado; formate os arquivos que você alterar com
  `npx prettier --write <arquivos>`, para o pull request não carregar mudanças de estilo alheias.

## Testes

- Toda mudança de comportamento vem com teste; correção de bug começa por um teste que falha.
- Regras de domínio e casos de uso: testes unitários. Telas: Testing Library, consultando por papel ou
  rótulo e simulando o usuário com `userEvent`.
- Nomes de teste descrevem o comportamento, em português.

Convenções, auxiliares e exemplos em [docs/testing.md](docs/testing.md).

## Documentação

Atualize a documentação no mesmo pull request que muda o código:

| Se você mudou... | Atualize |
| --- | --- |
| Regra de negócio, perfil ou permissão | [docs/business-rules.md](docs/business-rules.md) |
| Rota, endpoint, formato de dado ou enum | [docs/api-contract.md](docs/api-contract.md) |
| Camadas, estado, erros ou fluxo de dados | [docs/architecture.md](docs/architecture.md) e, se for uma decisão nova, um [ADR](docs/adr/README.md) |
| Token de cor, tipografia ou componente de UI | [docs/design-system.md](docs/design-system.md) |
| Uma tela ou um fluxo | [docs/screens.md](docs/screens.md) e a captura em `docs/images/` |
| Passos de instalação ou configuração | [docs/getting-started.md](docs/getting-started.md) e o README |
| Algo visível para quem usa ou mantém o projeto | [CHANGELOG.md](CHANGELOG.md), na seção "Não lançado" |

Decisões de arquitetura são registradas em um novo ADR; ADRs aceitos não são reescritos, são substituídos
por um novo.

## Pull requests

O título segue a convenção de commits. Sugestão de descrição:

```markdown
## O que muda
Resumo objetivo da mudança.

## Por quê
Problema ou requisito (cite o RF/RN ou a issue, se houver).

## Como testar
1. Passos para ver o resultado funcionando.

## Capturas de tela
(Se mudou a interface.)

## Checklist
- [ ] `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam
- [ ] Testes novos ou atualizados
- [ ] Documentação e CHANGELOG atualizados
```

Na revisão, observamos: respeito às camadas, regras de negócio no domínio, testes que descrevem o
comportamento, uso dos tokens do design system e documentação em dia.

## Reportando problemas e sugestões

Abra uma issue descrevendo:

- **O que aconteceu** e **o que você esperava**;
- **Passos para reproduzir**, incluindo o perfil usado (Cliente ou Administrador) e o modo (`mock` ou
  `http`);
- **Ambiente:** navegador e versão, versão do Node;
- **Capturas de tela** ou mensagens do console, se ajudarem.

Para sugestões, explique o problema que a ideia resolve e, se possível, como ela se encaixa nas regras
de negócio da especificação.
