# Contrato da API REST — Arena Beach Tennis (Ottawa Tech)

Referência para a equipe do backend (ASP.NET Core). O frontend consome exatamente este contrato no
modo `VITE_API_MODE=http` (adaptadores em `src/infrastructure/http`). O backend simulado
(`src/infrastructure/mock`, modo `mock`) implementa as mesmas rotas e regras e serve como
**implementação de referência** — em caso de dúvida, o comportamento dele é o esperado.

## 1. Convenções

| Item | Formato |
| --- | --- |
| Base URL | `/api` — em desenvolvimento o Vite repassa `/api/*` para `VITE_BACKEND_URL` (padrão `http://localhost:5160`, perfil `http` do `launchSettings.json`), sem CORS. |
| JSON | camelCase (padrão do `System.Text.Json`). |
| Datas (`DateOnly`) | `"2026-09-20"` |
| Horários (`TimeOnly`) | o frontend envia `"19:00:00"`; aceita `"19:00"` ou `"19:00:00"` na resposta. |
| Data-hora (`DateTime`) | ISO 8601, ex.: `"2026-09-20T18:42:00Z"`. Campos opcionais vêm como `null` (não use `0001-01-01`). |
| Enums | **números** com os valores dos enums C# (seção 4). Nomes também são aceitos na leitura. |
| Valores | `decimal` como número: `142.5`. |
| CPF | string `"000.000.000-00"` (o frontend envia com máscara; compare **apenas os dígitos**). |
| Telefone | string `"(51) 99812-4477"` — não use `int` (11 dígitos não cabem em `int`). |

Listas são arrays JSON simples (sem paginação no servidor; o frontend pagina localmente).

## 2. Autenticação (JWT Bearer)

- Públicos: `POST /api/auth/login` e `POST /api/auth/register`. Todas as demais rotas exigem
  `Authorization: Bearer <token>`.
- Claims do token: `sub` (id do usuário), `name`, `email`, `role` (`Cliente` ou `Administrador`),
  `clienteId` (perfil Cliente) e `exp`. Os `ClaimTypes` longos do .NET também são aceitos.
- Validade sugerida: 8 horas. Qualquer **401** (exceto no login) faz o frontend encerrar a sessão.

### POST /api/auth/login

```json
{ "email": "isadora@email.com", "senha": "123456" }
```

`200 OK` (mesmo formato no registro):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiraEm": "2026-09-21T02:00:00Z",
  "usuario": { "id": 1, "nome": "Isadora Oliveira", "email": "isadora@email.com", "perfil": "Cliente", "clienteId": 1 }
}
```

- E-mail comparado sem diferenciar maiúsculas. Administrador: `"perfil": "Administrador"`, `"clienteId": null`.
- `401` e-mail ou senha inválidos · `403` cliente inativo (`detail`: "Cadastro inativo. Procure a administração da arena.").
- Se `usuario` for omitido, o frontend lê os dados dos claims do JWT.

### POST /api/auth/register (RF01 — autocadastro)

```json
{ "nome": "Helena Souza", "cpf": "529.982.247-25", "telefone": "(51) 99999-0000",
  "email": "helena@email.com", "dataNascimento": "2001-05-10", "senha": "segredo1" }
```

`201 Created` com o mesmo corpo do login (cliente criado **Ativo** e já autenticado).
`400` validação · `409` RN01 (CPF) / RN02 (e-mail).

## 3. Rotas

Perfis: **C** = Cliente, **A** = Administrador.

| Método | Rota | Perfis | Resposta |
| --- | --- | --- | --- |
| GET | `/api/quadras` | C, A | `200` Quadra[] (todas, inclusive inativas/em manutenção) |
| GET | `/api/quadras/{id}` | C, A | `200` Quadra · `404` |
| POST | `/api/quadras` | A | `201` Quadra |
| PUT | `/api/quadras/{id}` | A | `200` Quadra (ou `204`) |
| DELETE | `/api/quadras/{id}` | A | `204` — inativação lógica (`status = Inativa`, RF07) |
| GET | `/api/quadras/{id}/disponibilidade?data=YYYY-MM-DD` | C, A | `200` Disponibilidade |
| GET | `/api/clientes?busca=&status=` | A | `200` Cliente[] — `busca` em nome, CPF ou e-mail |
| GET | `/api/clientes/{id}` | A; C só o próprio | `200` Cliente · `403` · `404` |
| POST | `/api/clientes` | A | `201` Cliente |
| PUT | `/api/clientes/{id}` | A; C só o próprio (sem mudar `status`) | `200` Cliente (ou `204`) |
| DELETE | `/api/clientes/{id}` | A | `204` — inativação sem excluir histórico (RF04) |
| GET | `/api/reservas?clienteId=&quadraId=&data=&status=` | A; C com `clienteId` = o próprio | `200` Reserva[] |
| GET | `/api/reservas/{id}` | A; C só as próprias | `200` Reserva |
| POST | `/api/reservas` | C (para si); A (qualquer cliente) | `201` Reserva (`status = Pendente`) |
| PUT | `/api/reservas/{id}` | C (próprias); A | `200` Reserva (RF13) |
| POST | `/api/reservas/{id}/cancelar` | C (próprias); A | `200` Reserva (RF12/RN08) |
| GET | `/api/pagamentos?status=&clienteId=&reservaId=` | A; C com `clienteId` = o próprio | `200` Pagamento[] |
| GET | `/api/pagamentos/{id}` | A; C (das próprias reservas) | `200` Pagamento |
| POST | `/api/pagamentos` | C (próprias reservas); A | `201` Pagamento (RF14) |
| POST | `/api/pagamentos/{id}/confirmar` | A | `200` Pagamento (RF16) |

Parâmetros de consulta vazios não são enviados. Para o perfil Cliente, listar sem `clienteId` ou com
o id de outro cliente → `403`. `PUT`/`POST .../cancelar|confirmar` podem responder `204`: o frontend
relê o recurso com `GET`.

### Corpos

**Quadra** — envio: `{ "nome": "Quadra 07", "tipo": "Beach Tennis", "valorHora": 85, "status": 1 }`

```json
{ "id": 1, "nome": "Quadra 01", "tipo": "Beach Tennis", "valorHora": 80, "status": 1 }
```

**Disponibilidade** — somente reservas não canceladas; não expõe quem reservou:

```json
{ "quadraId": 1, "data": "2026-09-20", "abertura": "07:00:00", "fechamento": "22:00:00",
  "ocupados": [ { "inicio": "10:00:00", "fim": "11:00:00" }, { "inicio": "19:00:00", "fim": "20:00:00" } ] }
```

**Cliente** — envio (POST/PUT): campos abaixo + `"senha"` (obrigatória no POST; no PUT, ausente = mantém a atual). A senha **nunca** é devolvida.

```json
{ "id": 1, "nome": "Isadora Oliveira", "cpf": "012.345.678-90", "email": "isadora@email.com",
  "telefone": "(51) 99812-4477", "dataNascimento": "1998-03-14", "status": 1 }
```

**Reserva** — envio (POST): `{ "clienteId": 1, "quadraId": 1, "data": "2026-09-20", "horaInicio": "19:00:00", "horaFim": "20:00:00" }`;
PUT: os mesmos campos sem `clienteId`. O `valor` é **sempre calculado pelo servidor** (RN07).

```json
{ "id": 1041, "clienteId": 1, "quadraId": 1, "data": "2026-09-20", "horaInicio": "19:00:00",
  "horaFim": "20:00:00", "valor": 80, "status": 2, "dataCriacao": "2026-09-10T12:12:00Z" }
```

**Pagamento** — envio (POST): `{ "reservaId": 1041, "metodo": 1 }` (o valor vem da reserva).

```json
{ "id": 1, "reservaId": 1041, "valor": 80, "metodo": 1, "status": 2, "dataPagamento": "2026-09-10T12:14:00Z" }
```

## 4. Enums

| Enum | Valores |
| --- | --- |
| StatusCliente | `1` Ativo · `2` Inativo |
| StatusQuadra | `1` Ativa · `2` Inativa · `3` Manutenção |
| StatusReserva | `1` Pendente · `2` Confirmada · `3` Cancelada · `4` Concluída |
| StatusPagamento | `1` Pendente · `2` Pago · `3` Cancelado · `4` Estornado |
| MetodoPagamento | `1` Pix · `2` Cartão · `3` Dinheiro |
| Perfil (claim `role`) | `"Cliente"` · `"Administrador"` |

## 5. Regras de negócio validadas no servidor

O frontend pré-valida (seção 6.3 da especificação), mas o backend deve **revalidar tudo** na gravação.

- **RN01** — CPF único entre clientes **ativos** (criar, editar e reativar) → `409`.
- **RN02** — e-mail único (inclusive em relação às contas administrativas) → `409`.
- **RN03** — só quadras `Ativa` recebem novas reservas → `400`.
- **RN04** — sem sobreposição na mesma quadra/data; intervalos semiabertos `[início, fim)`:
  19:00–20:00 × 19:30–20:30 conflita; 19:00–20:00 × 20:00–21:00 não → `409`.
- **RN05/RN06** — reserva exige cliente existente e **ativo** e quadra existente → `400`/`404`.
- **RN07** — `valor = valorHora × horas` (R$ 80/h × 2h = R$ 160); ignorar qualquer valor enviado.
- **RN08** — Cliente cancela (ou altera) até **4 horas antes** do início; Administrador cancela qualquer
  reserva ainda não encerrada; reservas canceladas ou concluídas não podem ser canceladas → `400`.
- **RN09** — reserva cancelada libera o horário (não conta em conflitos nem na disponibilidade).
- **RN10** — no máximo um pagamento ativo (`Pendente`/`Pago`) por reserva → `409`.
- **Agenda** — funcionamento 07:00–22:00; durações de 60, 90 ou 120 min; janela de hoje até hoje + 29
  dias; horário já passado não pode ser reservado → `400`.
- **Pagamento simulado (7.4)** — Pix/Cartão → `Pago` com `dataPagamento` = agora; Dinheiro → `Pendente`.
  Registrar o pagamento muda a reserva `Pendente` → `Confirmada`. Confirmar (admin) só vale para
  `Pendente` (senão `409`) e define `Pago` + `dataPagamento`. Não registrar pagamento de reserva cancelada.
- **Cancelamento** — reserva → `Cancelada`; pagamento `Pago` → `Estornado`, `Pendente` → `Cancelado`.
- **Alteração (RF13)** — mesmas validações da criação, desconsiderando a própria reserva; recalcula o
  valor (pagamento pendente acompanha; se já pago e o valor mudar → `400`).
- **Conclusão** — reserva `Confirmada` cujo horário terminou é devolvida como `Concluida`.

## 6. Erros

Use `ProblemDetails` (RFC 9457) com a mensagem ao usuário **em português no `detail`**; para validação,
`ValidationProblemDetails` com `errors` por campo (chaves em camelCase). O frontend também aceita
`{ "message": "..." }` ou texto simples.

```json
{ "title": "Conflito de horário", "status": 409,
  "detail": "RN04 — já existe uma reserva para esta quadra neste horário.",
  "errors": { "horaInicio": ["RN04 — já existe uma reserva para esta quadra neste horário."] } }
```

| Status | Uso | Tratamento no frontend |
| --- | --- | --- |
| 400 | validação / regra de negócio | mensagem + erros por campo |
| 401 | token ausente, inválido ou expirado; no login, credenciais inválidas | encerra a sessão (exceto no login) |
| 403 | perfil sem permissão; cliente inativo no login | "Você não tem permissão..." |
| 404 | recurso inexistente | "Registro não encontrado." |
| 409 | RN01, RN02, RN04, RN10, confirmar pagamento não pendente | mensagem do `detail` |
| 5xx | falha inesperada | mensagem genérica |

## 7. Ajustes necessários no backend atual (branch `Release`)

- `Reserva` não tem `QuadraId` (RN06) e usa `ClienteID`/`id` com grafias diferentes — padronize `Id`, `ClienteId`, `QuadraId`.
- `Status` como `bool` em `Quadra`, `Reserva` e `Pagamento` e `ClienteAtivo` em `Cliente` → use os enums da seção 4.
- `Cliente.Telefone` é `int?` → `string`. `Pagamento.Metodo` é `string` → `MetodoPagamento`. `Pagamento.DataPagamento` → `DateTime?`.
- `StatusQuadra` usa `Ativo/Inativo`; a especificação usa `Ativa/Inativa` (os números são iguais, o frontend aceita os dois).
- `Program.cs`: registrar autenticação JWT (`AddAuthentication().AddJwtBearer`, `UseAuthentication`) e `[Authorize(Roles = "Administrador")]` nas rotas administrativas.
