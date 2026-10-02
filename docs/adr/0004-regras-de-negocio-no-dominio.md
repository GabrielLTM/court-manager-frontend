# ADR-0004 — Regras de negócio no domínio

- **Status:** Aceita
- **Data:** 2026-09-25
- **Decisores:** Equipe Ottawa Tech

## Contexto

A Especificação 1.0 define as regras RN01–RN10 (seção 8), determina que as regras críticas sejam sempre validadas no backend (seção 6.3) e que as validações de interface melhorem a experiência sem substituir as do backend (seção 6.1).

No frontend, as mesmas regras são necessárias em três pontos: na interface (grade de horários e feedback imediato), nos casos de uso (pré-validação antes de gravar) e no backend simulado, que precisa se comportar como o servidor ([ADR-0002](0002-backend-simulado-no-navegador.md)). Várias regras dependem do instante atual: horário que já passou, janela de reservas de 30 dias e cancelamento até 4 horas antes do início.

## Decisão

- Implementar as regras como **funções puras e tipadas** em `domain/rules/` (`cliente.rules.ts`, `quadra.rules.ts`, `reserva.rules.ts` e `pagamento.rules.ts`), sobre entidades que são dados simples (interfaces).
- Centralizar os parâmetros operacionais em `REGRAS_RESERVA`: funcionamento das 07:00 às 22:00, durações de 60, 90 e 120 minutos, janela de 30 dias e antecedência de cancelamento de 4 horas.
- Representar violações com `DomainError`, que carrega `regra: CodigoRegra` (`RN01` a `RN10` ou `VALIDACAO`).
- Nunca ler o relógio dentro do domínio: as funções recebem `agora: Date`, fornecido pelo `Clock` injetado.
- Usar as mesmas funções nos três pontos:
  - **interface**: `gerarSlots`, `janelaDeReserva` e `calcularValorReserva`;
  - **aplicação**: `validarReserva` (via `preValidarReserva`), `podeCancelarReserva`, `pagamentoPodeSerConfirmado` e `validarDadosQuadra`;
  - **backend simulado**: `validarAgendamento` (que usa `validarReserva`), `cpfEmUso`, `emailEmUso`, `statusInicialDoPagamento` e `statusDoPagamentoAoCancelarReserva`.
- O backend real deve revalidar tudo; as regras que o servidor precisa aplicar estão em [api-contract.md](../api-contract.md) (seção 5) e o detalhamento em [business-rules.md](../business-rules.md).

## Consequências

**Positivas**

- As regras são testáveis sem DOM, com datas determinísticas (`domain/rules/__tests__`).
- Há uma fonte única para a interface, os casos de uso e o mock, então o comportamento é idêntico nos três pontos.
- Entidades como dados simples são serializáveis em JSON (HTTP e `localStorage`) e copiáveis com `clonar`.

**Negativas e trade-offs**

- Duplicação intencional com o backend C#: as regras existirão nas duas pontas, e a divergência é possível. O contrato em `api-contract.md` é a mitigação.
- A pré-validação no cliente não elimina corridas: duas pessoas podem ver o mesmo horário livre. Por isso o servidor revalida, e a interface trata o erro e recarrega a disponibilidade (`onSettled` em `useCriarReserva`).
- As mensagens de regra, com prefixo "RNxx —", nascem no domínio e chegam à interface. O design v2 reescreveu alguns avisos sem os códigos (por exemplo, `avisoQuadraIndisponivel` em `reservar.utils.ts`), mas outros ainda os exibem.
- As validações de formato do cadastro existem também em `validarDadosCliente` (aplicação) e nos esquemas Zod ([ADR-0006](0006-formularios-com-react-hook-form-e-zod.md)), com textos iguais mantidos à mão.
- O domínio depende de `shared/lib` (datas e horários), que também é puro.

## Alternativas consideradas

- **Regras nos componentes e hooks.** Não adotada: acoplaria as regras à interface, duplicaria a lógica entre telas (a reserva do cliente e a alteração do administrador usam `gerarSlots`) e exigiria DOM para testá-las.
- **Regras somente no backend e no mock.** Não adotada: a interface ficaria sem feedback imediato (grade de horários e pré-validação), e a especificação prevê validações de interface (seção 6.1).
- **Entidades ricas (classes com métodos).** Não adotada: as entidades trafegam como JSON (HTTP e `localStorage`) e o mock as copia por serialização (`clonar`); funções puras sobre dados simples evitam reidratar instâncias.

## Referências

- [`reserva.rules.ts`](../../src/domain/rules/reserva.rules.ts), [`cliente.rules.ts`](../../src/domain/rules/cliente.rules.ts), [`pagamento.rules.ts`](../../src/domain/rules/pagamento.rules.ts) e [`quadra.rules.ts`](../../src/domain/rules/quadra.rules.ts).
- [`DomainError.ts`](../../src/domain/errors/DomainError.ts) e [`clock.ts`](../../src/application/ports/clock.ts).
- [`validacaoReserva.ts`](../../src/application/use-cases/validacaoReserva.ts) e [`agendamento.ts`](../../src/infrastructure/mock/agendamento.ts).
- [`business-rules.md`](../business-rules.md), [`api-contract.md`](../api-contract.md) e [`testing.md`](../testing.md).
- [ADR-0001](0001-arquitetura-limpa-em-camadas.md) e [ADR-0006](0006-formularios-com-react-hook-form-e-zod.md).
