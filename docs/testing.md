# Estratégia de testes

Como o projeto é testado, como executar a suíte e como escrever novos testes. As regras cobertas estão em [business-rules.md](business-rules.md) (a seção 4 liga cada RN aos seus testes); a arquitetura que torna isso possível (portas, injeção de dependência, relógio injetável) está em [architecture.md](architecture.md) e nos ADRs [0001](adr/0001-arquitetura-limpa-em-camadas.md) e [0002](adr/0002-backend-simulado-no-navegador.md). Para rodar o aplicativo, veja [getting-started.md](getting-started.md).

## 1. Filosofia e pirâmide

A arquitetura em camadas permite provar cada regra no nível mais baixo possível, sem navegador, rede nem relógio real; os testes de interface ficam com o que só a interface decide (fluxo, acessibilidade, mensagens). Tempo, HTTP e armazenamento entram por parâmetro ou por porta, então os testes os substituem.

| Nível | O que prova | Dublês e ambiente | Onde |
| --- | --- | --- | --- |
| 1. Domínio | Regras puras (RN01–RN10, valor, conflitos, horários, ciclo de vida) e utilitários | Nenhum; o "agora" entra como parâmetro | `src/domain/**/__tests__`, `src/shared/lib/__tests__` |
| 2. Casos de uso | Orquestração e pré-validação; o que é (ou não) chamado nas portas | Portas dubladas com `vi.fn`; relógio fixo | `src/application/use-cases/__tests__` |
| 3. Backend simulado | Casos de uso reais + `createMockBackend`: regras no "servidor", autorização por perfil, ciclo de vida, persistência | Latência 0, armazenamento em memória, relógio fixo | `src/infrastructure/mock/__tests__` |
| 4. Adaptadores | Cliente axios (token, tradução de erros), mapeadores do JSON, `SessionStore`, container de DI | Adapter do axios substituído; armazenamento em memória | `src/infrastructure/{http,storage}/__tests__`, `src/di/__tests__` |
| 5. Interface | Rotas e guards, páginas, componentes e a lógica pura de cada tela (`*.utils.ts`) | `AppServices` falso; páginas trocadas por `vi.mock` | `src/presentation/**/__tests__` |

Regra prática: uma regra nova ganha teste no nível 1 e um de integração no nível 3; o nível 5 só confirma que a tela mostra e dispara o que o caso de uso devolve. O nível 3 não é um oráculo independente: o mock reutiliza o domínio ([architecture.md](architecture.md), seção 13).

## 2. Stack e configuração

**Vitest 5**, ambiente **jsdom 30**, **Testing Library** (`@testing-library/react` 16, `dom` 10), **user-event 14** e **jest-dom 7** (versões em [package.json](../package.json)). O bloco `test` de [vite.config.ts](../vite.config.ts) e o arquivo [setup.ts](../src/test/setup.ts):

```ts
// vite.config.ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/setup.ts'],
  css: true,
},

// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  localStorage.clear();
});
```

- `globals: true` (com `vitest/globals` em [tsconfig.app.json](../tsconfig.app.json)) dispensa importar `describe`, `it`, `expect` e `vi`. Os dois estilos existem no repositório; em arquivos novos, importe de `vitest` explicitamente (recomendação).
- `css: true` faz o Vitest processar os arquivos CSS e CSS Modules importados pelos componentes; sem a opção, ele os trata como vazios.
- O setup carrega os matchers do jest-dom, desmonta a árvore React e zera o `localStorage` (banco simulado `arena.mock-db.v1` e sessão `arena.sessao`) após cada teste.
- Não há `include` customizado: valem `*.test.ts(x)`. Helpers dentro de `__tests__` não terminam em `.test.`, para não serem coletados. Cada arquivo roda em seu próprio jsdom.

## 3. Como executar

```bash
npm test                          # vitest run: toda a suíte, uma vez
npm run test:watch                # vitest em modo observação (reexecuta ao salvar)
npx vitest run src/domain/rules/__tests__/reserva.rules.test.ts   # um arquivo
npx vitest run src/infrastructure                                  # uma pasta
npx vitest run -t "RN04"                                           # por nome (describe + it)
npx vitest run src/infrastructure/mock/__tests__/reservas.test.ts -t "RN08"   # arquivo + nome
npm test -- src/presentation/features/admin                        # argumentos vão para o vitest
npx vitest run --reporter=verbose                                  # lista cada teste
```

No modo observação, `p` filtra por arquivo e `t` por nome do teste. **Portão de qualidade**: rode `npm run lint && npm run typecheck && npm test && npm run build` antes de integrar (não há CI versionado neste repositório).

| Comando | O que roda | Falha quando |
| --- | --- | --- |
| `npm run lint` | `eslint .`: regras recomendadas do JS e do typescript-eslint, `react-hooks`, `react-refresh` e a regra de dependência entre camadas ([eslint.config.js](../eslint.config.js)) | Variável não usada (exceto `_arg`), hook mal usado, import que atravessa camadas |
| `npm run typecheck` | `tsc -b --noEmit` ([tsconfig.app.json](../tsconfig.app.json): `strict`, `noUnused*`, `erasableSyntaxOnly`; inclui `src`, logo os testes) | Erro de tipo, inclusive em testes e nos serviços falsos |
| `npm test` | Vitest | Teste falho |
| `npm run build` | `tsc -b && vite build` | Erro de tipo ou de empacotamento |

Regra de camadas (`no-restricted-imports`, vale também para os testes): `src/domain` não importa `application`, `infrastructure`, `presentation`, `di`, `react` nem `axios`; `src/application` não importa `infrastructure`, `presentation`, `di`, `react` nem `axios`; `src/infrastructure` não importa `presentation`, `di` nem `react`; `src/presentation` não importa `infrastructure` nem `axios`. Por isso testes de interface usam `AppServices` falsos, e só `infrastructure/mock/__tests__` e `di/__tests__` ligam o backend simulado aos casos de uso reais. `npm run format` (Prettier) não faz parte do portão.

## 4. Onde ficam os testes

| Pasta (`__tests__/` ao lado do código) | O que se testa | Exemplo |
| --- | --- | --- |
| `src/domain/rules/__tests__/` | Regras puras: RN01–RN10, `gerarSlots`, `validarReserva`, pagamento | [reserva.rules.test.ts](../src/domain/rules/__tests__/reserva.rules.test.ts) |
| `src/application/use-cases/__tests__/` | Casos de uso com portas dubladas | [reservas.test.ts](../src/application/use-cases/__tests__/reservas.test.ts) |
| `src/infrastructure/mock/__tests__/` | Backend simulado com casos de uso reais: regras, 401/403, ciclo de vida, dashboard | [reservas.test.ts](../src/infrastructure/mock/__tests__/reservas.test.ts), [auth.test.ts](../src/infrastructure/mock/__tests__/auth.test.ts), [administracao.test.ts](../src/infrastructure/mock/__tests__/administracao.test.ts) |
| `src/infrastructure/http/__tests__/` | Cliente axios (token, erros) e mapeadores tolerantes | [httpClient.test.ts](../src/infrastructure/http/__tests__/httpClient.test.ts), [mappers.test.ts](../src/infrastructure/http/__tests__/mappers.test.ts) |
| `src/infrastructure/storage/__tests__/`, `src/di/__tests__/` | Sessão (persistência, expiração, abas) e composition root | [LocalStorageSessionStore.test.ts](../src/infrastructure/storage/__tests__/LocalStorageSessionStore.test.ts), [container.test.ts](../src/di/__tests__/container.test.ts) |
| `src/shared/lib/__tests__/` | Datas, horários, moeda e máscaras | [lib.test.ts](../src/shared/lib/__tests__/lib.test.ts) |
| `src/presentation/app/__tests__/` | Rotas, guards, layout, 404 | [router.test.tsx](../src/presentation/app/__tests__/router.test.tsx), [access.test.ts](../src/presentation/app/__tests__/access.test.ts) |
| `src/presentation/components/**/__tests__/` | Componentes do design system | [ui.test.tsx](../src/presentation/components/ui/__tests__/ui.test.tsx), [DateSelector.test.tsx](../src/presentation/components/DateSelector/__tests__/DateSelector.test.tsx) |
| `src/presentation/features/<tela>/__tests__/` | Páginas (`*Page.test.tsx`) e lógica pura da tela (`*.utils.test.ts`) | [ReservarPage.test.tsx](../src/presentation/features/reservar/__tests__/ReservarPage.test.tsx), [reservar.utils.test.ts](../src/presentation/features/reservar/__tests__/reservar.utils.test.ts) |

## 5. Helpers e fixtures

**Relógio injetável.** O domínio recebe `agora: Date`; casos de uso e mock usam `clock.now()` ([clock.ts](../src/application/ports/clock.ts)); a interface usa `useHoje()`, que lê `services.clock`. Em teste, injete um relógio fixo (nenhum teste usa `vi.useFakeTimers`) e construa datas no fuso local, como `new Date(2026, 8, 20, 10, 0)` (20/09/2026 10:00, o "hoje" do protótipo). Exceções que leem o relógio real: a validação Zod de nascimento ([schemas.ts](../src/presentation/validation/schemas.ts)) e o atributo `max` do campo de data.

**Backend simulado.** [ambiente.ts](../src/infrastructure/mock/__tests__/ambiente.ts) monta o ambiente dos testes de integração: relógio fixo, latência zero e banco em memória (`storage` nulo).

```ts
const clock: Clock = { now: () => new Date(agora) };
const backend = createMockBackend({ sessionStore, clock, latencyMs: 0, storage });
const services = createAppServices({ ...backend, sessionStore, clock });
```

`criarAmbiente(inicio?, storage?)` devolve `services`, `backend` (repositórios diretos, sem a pré-validação do caso de uso), `sessionStore`, `definirAgora`, `entrarComoCliente` e `entrarComoAdmin`; `HOJE` e `AMANHA` também são exportados. O relógio padrão é 20/09/2026 12:00 e a semente é relativa a ele, então os dados reproduzem o protótipo (RSV-1041, Quadra 01, 19:00–20:00).

```ts
const { services, backend, entrarComoCliente, entrarComoAdmin } = criarAmbiente(
  new Date(2026, 8, 20, 16, 0),
);
await entrarComoCliente();
await expect(services.reservas.cancelar(1041)).rejects.toMatchObject({ regra: 'RN08' });
await expect(backend.reservaRepository.cancelar(1041)).rejects.toMatchObject({ regra: 'RN08' });

await entrarComoAdmin();
const cancelada = await services.reservas.cancelar(1041);
expect(cancelada.status).toBe(StatusReserva.Cancelada);
```

**Portas dubladas** (nível 2): o `montar()` de [reservas.test.ts](../src/application/use-cases/__tests__/reservas.test.ts) cria todas as portas com `vi.fn` e `createAppServices`.

```ts
const { services, deps } = montar({});
await expect(services.reservas.criar(novaReserva)).rejects.toMatchObject({ regra: 'RN04' });
expect(deps.reservaRepository.criar).not.toHaveBeenCalled();
```

**Serviços falsos de interface** ([app/testing/](../src/presentation/app/testing/)). `createFakeServices({ sessao })` devolve `{ services, definirSessao }`: autenticação em memória e reativa, `perfil` funcional e relógio fixo; os demais serviços rejeitam, e o objeto é `satisfies AppServices`, então um método novo no contrato quebra o `typecheck` até entrar no fake. `renderAppAt(path, services)` renderiza providers + rotas reais em um roteador de memória (`QueryClient` com `retry: false`) e devolve `{ router, user, ...view }`; `renderWithProviders(ui, services)` faz o mesmo sem rotas.

```tsx
const pagina = (titulo: string) => screen.findByRole('heading', { level: 1, name: titulo });

const { services } = createFakeServices({ sessao: SESSAO_CLIENTE });
const { router } = renderAppAt('/admin/quadras', services);

expect(await pagina('Página: Reservar quadra')).toBeInTheDocument();
expect(router.state.location.pathname).toBe('/reservar');
```

**Páginas do administrador** ([fixtures.ts](../src/presentation/features/admin/__tests__/fixtures.ts), [renderizarAdmin.tsx](../src/presentation/features/admin/__tests__/renderizarAdmin.tsx)). Fábricas com sobrescrita parcial (`umaQuadra`, `umaReserva`, `umPagamento`, `umPagamentoDetalhado`, `umCliente`, `QUADRAS_PROTOTIPO`) e `renderizarAdmin(ui, servicos)` (serviços parciais), com sessão de administrador, relógio em `AGORA_TESTE` e `QueryClient` sem retentativas. As páginas do cliente usam `criarServicos()` e `renderizar()` locais (Reservar, Minhas reservas) ou `createFakeServices` com `renderWithProviders` (Meus dados, Entrar).

```tsx
const { servicos, confirmar } = criarServicos(); // { pagamentos: { listar: vi.fn(...), confirmar } }
renderizarAdmin(<PagamentosPage />, servicos);
await user.click(await screen.findByRole('button', { name: 'Confirmar pagamento RSV-1044' }));
expect(confirmar).toHaveBeenCalledWith(4);
```

**HTTP.** [httpClient.test.ts](../src/infrastructure/http/__tests__/httpClient.test.ts) troca `http.defaults.adapter` por uma função que responde (ou lança `AxiosError`), sem rede.

## 6. Convenções

- **Nomes em português que descrevem o comportamento**, citando a regra quando couber: `describe('RN08 — cancelamento')`, `it('cliente não cancela a menos de 4 horas do início')`.
- **Consulte pelo que o usuário percebe**: `getByRole('button', { name: ... })`, `findByLabelText('Nome completo')`, `within(dialogo)`; toasts em `getByRole('status')` e erros de campo em `getByRole('alert')`. Não há `data-testid` nem snapshots. Quando o texto repete (um "Cancelar" por linha), o componente expõe um `aria-label` com o código da reserva (`Cancelar reserva RSV-1041`) e o teste usa esse nome.
- **`userEvent` em vez de `fireEvent`**, de preferência com `const user = userEvent.setup()` e `await user.click(...)`. Única exceção: `fireEvent.mouseDown` no fundo do `Dialog` em [ui.test.tsx](../src/presentation/components/ui/__tests__/ui.test.tsx).
- **Um comportamento por `it`**: vários `expect` são aceitos se verificam o mesmo cenário.
- **Sem tempo nem rede reais**: `latencyMs: 0`, armazenamento em memória, adapter do axios falso, relógio injetado. Use `findBy*` para esperar elementos e `waitFor` só para estados sem elemento (ex.: `document.title`).
- **Testes independentes**: cada teste monta seus serviços e seu `QueryClient`; nada de estado compartilhado.
- **Erro do servidor em interface**: `services.perfil.atualizar.mockRejectedValueOnce(new AppError(msg, { code: 'CONFLITO', status: 409, fieldErrors: { cpf: [msg] } }))`.
- **Trocar uma página por `vi.mock`** (as páginas são `lazy` e têm `export default`), como em [router.test.tsx](../src/presentation/app/__tests__/router.test.tsx); para um erro esperado de renderização, silencie `console.error` com `vi.spyOn` e restaure no fim.

```tsx
const { paginaFalsa } = vi.hoisted(() => ({
  paginaFalsa: (titulo: string) => async () => {
    const { createElement } = await import('react');
    return { default: () => createElement('h1', null, titulo) };
  },
}));
vi.mock('@/presentation/features/reservar/ReservarPage', paginaFalsa('Página: Reservar quadra'));
```

## 7. Como adicionar um teste

**Nova regra de domínio**

1. Escreva a função pura em `src/domain/rules/*.rules.ts` (sem React nem axios; o "agora" por parâmetro) e exporte em `rules/index.ts`. Se ela lança, use `DomainError('RNxx', mensagem)`.
2. Teste em `src/domain/rules/__tests__/`: exemplo da especificação, valores de fronteira (ex.: exatamente 4 h) e caso de falha; para erros, `toThrow(expect.objectContaining({ regra: 'RNxx' }))`.
3. Ligue a regra ao caso de uso e ao mock e cubra com `criarAmbiente`, chamando também `backend.*Repository` direto para provar a revalidação no "servidor".
4. Atualize a seção 4 de [business-rules.md](business-rules.md).

**Novo caso de uso**

1. Declare o método em `application/services.ts` (e DTOs/portas); implemente em `use-cases/` recebendo `AppDependencies` (um serviço novo também é ligado em `createAppServices.ts`).
2. Teste com portas dubladas, no molde de `use-cases/__tests__/reservas.test.ts`: caminho feliz, falha de pré-validação (porta não chamada) e restrição por perfil.
3. Implemente no mock (`Mock*Repository`, via `executar` e `autorizacao`) e teste por `criarAmbiente`, incluindo 401 e 403.
4. Para HTTP, adicione o adaptador e o mapeador (teste em `http/__tests__/mappers.test.ts`) e atualize [api-contract.md](api-contract.md). Adicione o método ao `createFakeServices`.

**Nova tela**

1. Crie `features/<tela>/XPage.tsx` com `export default`, a entrada em `lazyPages.ts`, o caminho em `routes/paths.ts`, a rota em `router.tsx` e o item em `navigation.ts`. Rota de cliente também entra em `ROTAS_DO_CLIENTE` de `guards/access.ts`.
2. Extraia a lógica de visão para `<tela>.utils.ts` e teste-a sem React em `__tests__/<tela>.utils.test.ts`.
3. Escreva `__tests__/XPage.test.tsx` com serviços parciais (`vi.fn`) e `renderizarAdmin` (admin), `renderWithProviders` + `createFakeServices` (cliente) ou um `MemoryRouter` local.
4. Cubra carregamento, dados, a interação com `userEvent`, a chamada ao serviço com os argumentos certos, o toast ou diálogo e o caminho de erro (`mockRejectedValueOnce`).
5. Se mudou o acesso por perfil, acrescente casos em `router.test.tsx` e `access.test.ts`.

## 8. Limites e próximos passos

Não há: testes **end-to-end** em navegador real; **cobertura** (nenhum provedor instalado, e `coverage` só aparece no `.gitignore` e no ignore do ESLint); **regressão visual** nem checagem automática de acessibilidade; **pipeline de CI**. O jsdom não faz layout, então responsividade e CSS não são verificados. Corridas reais de RN04 (duas pessoas no mesmo horário, no banco) não são reproduzíveis no mock, cujas operações são atômicas em um único processo. Os testes rodam no fuso da máquina, sem matriz de fusos.

Cobertura parcial: os `Http*Repository` não têm teste de requisição (só o cliente axios e os mapeadores; o `container.test.ts` apenas monta o modo `http`); hooks de `presentation/queries`, `lib/errors.ts`, `lib/serverErrors.ts` e `usePagination` só são exercitados via páginas.

Próximos passos sugeridos:

1. Instalar `@vitest/coverage-v8`, configurar `test.coverage` e fixar limites para `src/domain` e `src/application`.
2. Testar os `Http*Repository` com o adapter falso (URL, parâmetros e corpo) e, com a API pronta, rodar os cenários de `infrastructure/mock/__tests__` contra `createHttpBackend` como testes de contrato (os dois implementam `AdaptadoresBackend`).
3. Adicionar um fluxo E2E (por exemplo com Playwright, em modo `mock`, controlando o relógio do navegador): login, reservar, pagar, cancelar e confirmar pagamento.
4. Criar um pipeline com lint, typecheck, testes e build; avaliar `vitest-axe` e testes diretos dos hooks de `queries`.
