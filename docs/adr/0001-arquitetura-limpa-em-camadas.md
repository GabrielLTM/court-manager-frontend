# ADR-0001 — Arquitetura limpa em camadas

- **Status:** Aceita
- **Data:** 2026-09-25
- **Decisores:** Equipe Ottawa Tech

## Contexto

O frontend precisa cobrir dois fluxos: o do cliente (consultar disponibilidade, reservar e pagar) e o do administrador (gerir clientes, quadras, reservas e pagamentos). A equipe pediu boas práticas de React e padrões de Arquitetura Limpa.

A Especificação 1.0 atribui ao frontend a apresentação e as validações de interface (seção 6.1) e ao backend as regras críticas (seção 6.3). As regras RN01–RN10 (seção 8) são o núcleo do sistema e são usadas em mais de um ponto: na interface (grade de horários e pré-validação), nos casos de uso e no backend simulado. O backend real ainda não existia ([ADR-0002](0002-backend-simulado-no-navegador.md)), então a interface precisava evoluir sem depender de HTTP, de armazenamento ou do formato final da API.

## Decisão

Organizar `src/` em camadas, com as dependências sempre apontando para dentro:

```text
domain  <-  application  <-  infrastructure / presentation  <-  di (composition root)
```

- **`domain`**: entidades, enums, regras puras (`domain/rules`) e `DomainError`. TypeScript puro, sem React nem axios.
- **`application`**: casos de uso, DTOs, portas (`QuadraRepository`, `ClienteRepository`, `ReservaRepository`, `PagamentoRepository`, `AuthGateway`, `SessionStore`, `Clock`) e a fachada `AppServices`, montada por `createAppServices`.
- **`infrastructure`**: implementa as portas (backend simulado, adaptadores HTTP com axios, `SessionStore` em `localStorage` e relógio do sistema).
- **`presentation`**: interface React. Recebe `AppServices` por injeção de dependência (`ServicesProvider`) e nunca importa a infraestrutura.
- **`di/container.ts`**: único ponto que conhece as implementações concretas; é chamado por `main.tsx`.
- **`src/shared`** (funções puras) e **`src/config`** são utilitários sem restrição de camada.

A regra é verificada por `npm run lint`: o `eslint.config.js` aplica `no-restricted-imports` por camada (tabela completa em [architecture.md](../architecture.md), seção 2).

## Consequências

**Positivas**

- As regras de negócio são testáveis sem DOM nem rede (`domain/rules/__tests__`), com o "agora" injetado por `Clock`.
- Trocar mock por HTTP altera apenas `createContainer`; a interface só enxerga `AppServices`.
- Os testes de interface usam `AppServices` falsos (`fakeServices.ts`) sobre o mapa de rotas real.
- Uma importação que cruze a fronteira falha o `npm run lint`.

**Negativas e trade-offs**

- Mais arquivos e indireção: uma funcionalidade nova passa por domínio, DTO e porta, caso de uso, dois adaptadores, hook e página ([architecture.md](../architecture.md), seção 12).
- A regra de lint casa apenas imports pelo alias `@/` e não proíbe `presentation → di`; hoje só `main.tsx` importa `di/container`. Além disso, `config/demo.ts` importa `domain/enums`.
- O backend simulado reutiliza `domain/rules` e validações da aplicação (`validarDadosCliente`, `verificarCancelamentoPermitido`). `infrastructure → application` é permitido, mas o mock deixa de ser uma verificação independente das regras.
- Os modelos de leitura detalhados (`ReservaDetalhada`, `PagamentoDetalhado`) são montados no caso de uso com várias consultas em paralelo, porque a API REST devolve recursos separados.

## Alternativas consideradas

- **Pastas por tipo técnico (`components/`, `hooks/`, `services/`) sem camadas.** Não adotada: não há fronteira verificável, e as regras tenderiam a viver em componentes e hooks, exigindo DOM para testá-las. Hoje elas têm testes sem DOM.
- **Organização só por feature (fatias verticais).** Não adotada: cada feature ficaria acoplada à fonte de dados, e regras compartilhadas seriam duplicadas ou importadas entre features. Por exemplo, a reserva do cliente e a alteração de reserva do administrador usam o mesmo `gerarSlots` do domínio.
- **Chamar axios e React Query direto nos componentes.** Não adotada: inviabiliza o backend simulado atrás das mesmas portas e os testes com `AppServices` falsos.

## Referências

- [`eslint.config.js`](../../eslint.config.js): regras de dependência por camada.
- [`container.ts`](../../src/di/container.ts): composition root.
- [`services.ts`](../../src/application/services.ts) e [`createAppServices.ts`](../../src/application/createAppServices.ts): fachada `AppServices`.
- [`repositories.ts`](../../src/application/ports/repositories.ts): portas de acesso a dados.
- [`reserva.rules.ts`](../../src/domain/rules/reserva.rules.ts): regras puras do domínio.
- [`architecture.md`](../architecture.md), [`business-rules.md`](../business-rules.md) e [`testing.md`](../testing.md).
- [ADR-0002](0002-backend-simulado-no-navegador.md) e [ADR-0004](0004-regras-de-negocio-no-dominio.md).
