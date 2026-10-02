# ADR-0003 — Estado do servidor com TanStack Query

- **Status:** Aceita
- **Data:** 2026-09-25
- **Decisores:** Equipe Ottawa Tech

## Contexto

As telas consomem listas e detalhes carregados de forma assíncrona (API ou mock com latência de 150 a 400 ms) e alterados por mutações. Vários dados alimentam mais de uma tela: reservas e pagamentos aparecem em "Minhas reservas", na grade, em "Pagamentos" e no dashboard. Cada tela precisa dos estados de carregamento, erro e vazio, e a disponibilidade de horários precisa ser consultada de novo depois que uma reserva é criada ou falha por conflito (RN04).

A Especificação 1.0 (seção 6.1) pede que o frontend exiba reservas e pagamentos recebidos da API e mensagens de sucesso, alerta e erro.

## Decisão

Usar **TanStack Query 5** para todo o estado que vem do servidor.

- Os hooks de `presentation/queries/*` chamam `AppServices` por `useServices()`; nunca axios nem repositórios ([ADR-0001](0001-arquitetura-limpa-em-camadas.md)).
- `keys.ts` define `queryRoots` (por exemplo, `['reservas']`) e `queryKeys` (raiz mais parâmetros). Como as chaves compartilham o prefixo, `useInvalidate()` invalida uma raiz inteira, e cada mutação invalida as raízes afetadas (tabela em [architecture.md](../architecture.md), seção 5).
- `useCriarReserva` invalida em `onSettled`, inclusive após erro, para recarregar a disponibilidade; as demais mutações invalidam em `onSuccess`.
- `createQueryClient()` define `staleTime` de 30 s, sem refetch ao focar a janela, nenhuma nova tentativa para `DomainError` nem para `AppError` com `status` abaixo de 500, até 2 novas tentativas nos demais erros e mutações sem retry. `useDisponibilidade` fica desabilitada sem quadra e usa `staleTime` de 10 s.
- `AsyncContent` padroniza carregando, erro (com "Tentar novamente") e conteúdo; `getErrorMessage` converte o erro em texto.
- `AuthProvider` chama `queryClient.clear()` em login, cadastro e logout.
- Sessão e toasts **não** usam o React Query: são `SessionStore` com `useSyncExternalStore` e um contexto próprio. Não há store global (Redux, Zustand).

## Consequências

**Positivas**

- Cache, deduplicação de consultas e estados `pending` e `error` prontos; menos código por tela.
- A invalidação por raiz mantém a grade, o dashboard, "Minhas reservas" e a disponibilidade coerentes depois de reservar, alterar ou cancelar.
- A política de retry separa erros de negócio e de cliente (não se repetem) de falhas de rede e 5xx.
- Os testes usam um `QueryClient` com `retry: false` (`renderApp.tsx`), sem esperas por novas tentativas.

**Negativas e trade-offs**

- A invalidação é manual: esquecer uma raiz deixa uma tela desatualizada. Por isso `useAtualizarCliente` também invalida `reservas` e `pagamentos`, que exibem o nome do cliente.
- Não há atualização em tempo real (sem polling nem push). Com `staleTime` de 30 s e sem refetch ao focar a janela, mudanças feitas por outras pessoas só aparecem após invalidação ou nova consulta.
- As chaves não incluem o usuário. O cache é descartado nas trocas de conta feitas por `AuthProvider`, mas, em logout forçado (401 ou expiração), só no login seguinte.
- Os modelos detalhados são compostos no caso de uso: `reservas.listar` consulta reservas, quadras, pagamentos e clientes em paralelo, o que multiplica requisições no modo `http`.
- Alterar e cancelar reserva invalidam apenas em `onSuccess`; após um conflito ao alterar, a grade de horários só é atualizada por nova invalidação ou consulta.

## Alternativas consideradas

- **Redux Toolkit (com RTK Query).** Não adotada: traria store global, reducers e boilerplate para um app em que quase todo o estado compartilhado é dado do servidor. O React Query cobre cache, invalidação e mutações, e o estado restante (sessão e toasts) é pequeno.
- **`useEffect` e `useState` com chamadas manuais.** Não adotada: repetiria carregamento, erro, cancelamento e deduplicação em cada tela, sem invalidação compartilhada entre telas.
- **Context ou Zustand com cache próprio.** Não adotada: exigiria reimplementar deduplicação, `staleTime`, retry e invalidação por chave.

## Referências

- [`keys.ts`](../../src/presentation/queries/keys.ts), [`useInvalidate.ts`](../../src/presentation/queries/useInvalidate.ts) e [`reservas.ts`](../../src/presentation/queries/reservas.ts).
- [`queryClient.ts`](../../src/presentation/providers/queryClient.ts) e [`AuthProvider.tsx`](../../src/presentation/providers/AuthProvider.tsx).
- [`AsyncContent.tsx`](../../src/presentation/components/ui/AsyncContent.tsx) e [`renderApp.tsx`](../../src/presentation/app/testing/renderApp.tsx).
- [`architecture.md`](../architecture.md) (seções 4 e 5) e [`testing.md`](../testing.md).
- [ADR-0001](0001-arquitetura-limpa-em-camadas.md).
