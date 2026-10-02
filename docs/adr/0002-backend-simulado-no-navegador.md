# ADR-0002 — Backend simulado no navegador

- **Status:** Aceita
- **Data:** 2026-09-25
- **Decisores:** Equipe Ottawa Tech

## Contexto

Em 2026-09-25, o ramo `Release` do repositório do backend (commit `ab1c4d5`) tinha apenas entidades, enums e um controller de teste, sem `DbContext` funcional e sem os endpoints previstos na Especificação 1.0 (`/api/clientes`, `/api/quadras`, `/api/reservas`, `/api/pagamentos` e `/api/auth/*`). Sem API, o frontend não poderia ser executado nem testado de ponta a ponta.

A especificação também define limites que o frontend deve respeitar: ele nunca acessa o banco de dados e as regras críticas são sempre validadas no backend, por exemplo, a disponibilidade verificada de novo na criação da reserva (seção 6.3). O frontend precisava demonstrar o fluxo completo (reservar, pagar, cancelar e administrar) com as regras RN01–RN10 e a autorização por perfil, sem esperar o backend.

## Decisão

Implementar as mesmas **portas** de `application/ports` em dois adaptadores intercambiáveis, escolhidos no composition root por `VITE_API_MODE` (`mock`, o padrão, ou `http`):

1. **`infrastructure/mock`**: backend simulado em processo, atrás das portas.
   - Persiste em `localStorage` (chave `arena.mock-db.v1`), com transações atômicas sobre uma cópia e releitura do armazenamento a cada operação.
   - Simula latência de 150 a 400 ms e cria uma semente de demonstração relativa a hoje.
   - Autoriza por perfil com um JWT simulado (assinatura FNV-1a com segredo local, validade de 8 h): `AppError` 401 e 403.
   - Revalida as regras como "servidor" (`validarAgendamento`, que usa `validarReserva`) e calcula o valor (RN07), lançando `AppError` (401, 403, 404, 409) e `DomainError` (validações e regras).
2. **`infrastructure/http`**: adaptadores axios que implementam o contrato REST, com `Authorization: Bearer`, tradução de falhas em `AppError` (`mapearErroHttp`) e mapeadores tolerantes (chaves sem diferenciar caixa, enums por número ou nome, `TimeOnly` como `19:00:00`).

O contrato de referência é o [api-contract.md](../api-contract.md); em caso de dúvida, o comportamento do mock é o esperado. Em desenvolvimento, o proxy do Vite repassa `/api` para `VITE_BACKEND_URL` (padrão `http://localhost:5160`).

## Consequências

**Positivas**

- O app roda, é demonstrado e testado sem backend: `npm run dev` usa o mock, e os testes criam o ambiente com latência 0, relógio fixo e armazenamento em memória (`criarAmbiente`).
- O contrato fica executável: rotas, status e regras que o backend precisa seguir estão codificados no mock.
- Passar para a API real é uma variável de ambiente; interface e casos de uso não mudam.
- Regras e autorização são exercitadas desde o início, inclusive o 401 que encerra a sessão.

**Negativas e trade-offs**

- O mock não é um servidor: os dados ficam por navegador, sem multiusuário nem concorrência reais. O segredo do JWT simulado está no código do cliente; o token só detecta edição manual e não é segurança.
- Há risco de divergência entre o mock e o backend real. O contrato, a leitura tolerante e as regras compartilhadas reduzem o risco, mas o backend precisa reimplementar as regras (seção 6.3 da especificação).
- O mock reutiliza `domain/rules` e validações da aplicação, então não é um oráculo independente.
- No modo mock, `infrastructure/http` não é exercitado em tempo de execução: há testes do cliente axios e dos mapeadores, mas não de requisições dos `Http*Repository` nem contra uma API real.
- `container.ts` importa os dois adaptadores de forma estática; ambos fazem parte do bundle e o modo é decidido em tempo de execução.
- Mapeadores tolerantes ampliam o código e podem mascarar desvios do contrato.
- Contas de demonstração, `DemoRoleSwitch` e `AcessoRapido` só existem no modo mock, que não deve ser usado em produção.

## Alternativas consideradas

- **Esperar o backend.** Não adotada: sem API não haveria como executar nem testar os fluxos de reserva e pagamento, nem validar o contrato com a interface.
- **Servidor HTTP falso (json-server ou MSW).** Não adotada: exigiria um processo ou service worker adicional e a reimplementação de regras e autorização como handlers HTTP. O mock em processo roda com `npm run dev` e nos testes Vitest, sem rede.
- **Dados fixos em memória, sem regras.** Não adotada: não permitiria exercitar RN01–RN10 nem a autorização por perfil no fluxo real.

## Referências

- [`container.ts`](../../src/di/container.ts) e [`env.ts`](../../src/config/env.ts): escolha do backend.
- [`backend.ts`](../../src/infrastructure/backend.ts): tipo comum aos dois adaptadores.
- [`createMockBackend.ts`](../../src/infrastructure/mock/createMockBackend.ts), [`banco.ts`](../../src/infrastructure/mock/banco.ts), [`autorizacao.ts`](../../src/infrastructure/mock/autorizacao.ts) e [`token.ts`](../../src/infrastructure/mock/token.ts).
- [`createHttpBackend.ts`](../../src/infrastructure/http/createHttpBackend.ts) e [`erros.ts`](../../src/infrastructure/http/erros.ts).
- [`vite.config.ts`](../../vite.config.ts): proxy `/api`.
- [`api-contract.md`](../api-contract.md), [`architecture.md`](../architecture.md) (seção 9) e [`getting-started.md`](../getting-started.md).
- [ADR-0001](0001-arquitetura-limpa-em-camadas.md) e [ADR-0008](0008-contrato-de-dados-enums-numericos-e-datas-iso.md).
