# ADR-0008 — Contrato de dados: enums numéricos e datas ISO

- **Status:** Aceita
- **Data:** 2026-09-25
- **Decisores:** Equipe Ottawa Tech

## Contexto

A Especificação 1.0 (seção 10) define os enums do backend em C# com valores numéricos (por exemplo, `Ativo = 1`, `Inativo = 2`), e o contrato ([api-contract.md](../api-contract.md), seções 1 e 4) os trafega como números. As datas e os horários do contrato correspondem a `DateOnly` e `TimeOnly`, e os valores monetários a `decimal`.

No frontend, `tsconfig.app.json` ativa `erasableSyntaxOnly`, que não admite o `enum` do TypeScript (sintaxe que gera código em tempo de execução). Além disso, o backend ainda estava em construção e divergia do contrato: `Status` como `bool`, telefone como `int?`, método de pagamento como `string` e `StatusQuadra` com `Ativo` e `Inativo` (`api-contract.md`, seção 7). A leitura da API precisava tolerar essas variações sem contaminar o domínio.

## Decisão

1. **Enums** como objetos `as const` mais um tipo união com o mesmo nome (`StatusCliente`, `StatusQuadra`, `StatusReserva`, `StatusPagamento` e `MetodoPagamento`), com valores numéricos **idênticos** aos enums C#. Por exemplo, `StatusReserva = { Pendente: 1, Confirmada: 2, Cancelada: 3, Concluida: 4 }`. Cada enum tem rótulos (`*_LABEL`) e a lista de valores (`*_VALUES`). `Perfil` é texto (`'Cliente'` ou `'Administrador'`, a claim `role`). No fio, os enums trafegam como números.
2. **Datas e horários** como strings: `DateOnly` vira `"YYYY-MM-DD"` e `TimeOnly` vira `"HH:mm"` no domínio. No fio, o frontend envia `"HH:mm:ss"` (`19:00:00`) e aceita `"HH:mm"` ou `"HH:mm:ss"`. Data-hora é string ISO 8601 (`dataCriacao`, `dataPagamento` e `expiraEm`). As entidades não usam `Date`, e as datas de calendário são interpretadas no fuso local (`shared/lib/date.ts`).
3. **Dinheiro** como `number`. `valorHora` e `valor` seguem o `decimal` do backend; o cálculo arredonda a 2 casas (`calcularValorReserva`) e a exibição usa `formatBRL`. O `valor` da reserva é sempre calculado pelo servidor (RN07).
4. **Normalização na borda**, em `infrastructure/http/mappers`:
   - `campo()` lê chaves sem diferenciar caixa nem `_` e com apelidos (`clienteId`, `ClienteID`, `cliente_id`);
   - `criarLeitor` lê enums por número, texto numérico ou nome (sem acento e sem diferenciar caixa, com sinônimos como `Ativo` para `Ativa` em quadras) e também booleanos, dos modelos legados com `bool Status`;
   - `lerData` aceita `YYYY-MM-DD`, `DateTime` ISO e `dd/MM/yyyy`; `lerHora` aceita `HH:mm`, `HH:mm:ss`, `DateTime` e `{ hour, minute }`; `lerDataHora` trata `0001-01-01` como ausente e trunca frações com mais de 3 dígitos;
   - `lerNumero` aceita números em texto (`"80,5"`), e `lerLista` aceita arrays ou envelopes (`$values`, `items`, `data`);
   - `mapearSessao` usa o objeto `usuario` ou as claims do JWT.
5. **Requisições** sempre usam a forma canônica (`dto.ts` e `mappers/requisicoes.ts`). Uma resposta que não puder ser lida vira `AppError` ("Resposta inesperada do servidor").

## Consequências

**Positivas**

- Os valores dos enums são os mesmos nos dois lados, e o tipo união é derivado do objeto (`(typeof X)[keyof typeof X]`), sem duplicação. Funciona com `erasableSyntaxOnly` e `verbatimModuleSyntax`.
- Strings ISO são nativas em JSON e comparáveis como texto (por exemplo, `a.data.localeCompare(b.data)`), sem conversões de fuso nas datas de calendário.
- O adaptador absorve as variações do backend em construção sem afetar domínio nem interface; o contrato canônico está documentado e coberto por `mappers.test.ts`.

**Negativas e trade-offs**

- Os valores dos enums são mantidos à mão nos dois repositórios (não há geração de código); se divergirem, a leitura falha ou o valor é descartado.
- A tolerância dos mapeadores amplia o código e pode mascarar desvios do contrato; ela pode ser simplificada quando o backend estabilizar.
- `number` binário para dinheiro exige arredondamento explícito (`calcularValorReserva` e o total recebido do dashboard).
- O "hoje" e a leitura das datas dependem do fuso e do relógio do navegador (`Clock`), não do servidor.
- Há dois formatos de horário (`HH:mm` no domínio e `HH:mm:ss` no fio), convertidos nas bordas por `normalizeTime` e `paraHoraApi`.
- `Perfil` é texto e os demais enums são numéricos, duas convenções que vêm do contrato.

## Alternativas consideradas

- **`enum` ou `const enum` do TypeScript.** Não adotada: `erasableSyntaxOnly` rejeita o `enum`, e o comentário de `enums/index.ts` registra essa restrição.
- **Nomes (texto) como representação canônica.** Não adotada: a especificação define os enums com valores numéricos e o contrato os trafega como números. Os nomes continuam aceitos na leitura.
- **Objetos `Date` ou biblioteca de datas nas entidades.** Não adotada: strings ISO serializam direto (HTTP e `localStorage`) e evitam deslocamentos de fuso em datas sem horário; o projeto já tem utilitários próprios em `shared/lib/date.ts` e `time.ts`, sem dependência extra.
- **Gerar tipos a partir de OpenAPI ou Swagger.** Não adotada: o backend não tinha endpoints para gerar tipos, e o contrato foi escrito à mão em `api-contract.md`.

## Referências

- [`enums/index.ts`](../../src/domain/enums/index.ts) e [`entities/index.ts`](../../src/domain/entities/index.ts).
- [`date.ts`](../../src/shared/lib/date.ts) e [`time.ts`](../../src/shared/lib/time.ts).
- [`dto.ts`](../../src/infrastructure/http/dto.ts), [`enums.ts`](../../src/infrastructure/http/mappers/enums.ts), [`leitura.ts`](../../src/infrastructure/http/mappers/leitura.ts), [`entidades.ts`](../../src/infrastructure/http/mappers/entidades.ts), [`requisicoes.ts`](../../src/infrastructure/http/mappers/requisicoes.ts) e [`sessao.ts`](../../src/infrastructure/http/mappers/sessao.ts).
- [`mappers.test.ts`](../../src/infrastructure/http/__tests__/mappers.test.ts) e [`tsconfig.app.json`](../../tsconfig.app.json).
- [`api-contract.md`](../api-contract.md) (seções 1, 4 e 7) e [`architecture.md`](../architecture.md) (seção 9).
- [ADR-0002](0002-backend-simulado-no-navegador.md).
