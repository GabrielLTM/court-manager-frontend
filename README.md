# Arena Beach Tennis — Frontend

Sistema de gestão de uma arena de beach tennis (projeto **Ottawa Tech**, disciplina de Frameworks Web).
É uma SPA em React que replica o protótipo _Arena Beach Tennis_: o **cliente** consulta a
disponibilidade das quadras, reserva um horário e acompanha o pagamento; o **administrador** gerencia
clientes, quadras, reservas e pagamentos na mesma aplicação.

O backend oficial é uma API REST em ASP.NET Core (repositório `OttawaTech-BackEnd`). Enquanto ela não
fica pronta, o frontend roda com um **backend simulado no navegador** que implementa o mesmo contrato e
as mesmas regras de negócio — basta trocar uma variável de ambiente para usar a API real.

## Sumário

- [Stack](#stack)
- [Como executar](#como-executar)
- [Modos de dados: mock × http](#modos-de-dados-mock--http)
- [Scripts](#scripts)
- [Arquitetura](#arquitetura)
- [Rotas](#rotas)
- [Requisitos e regras de negócio](#requisitos-e-regras-de-negócio)
- [Testes](#testes)

## Stack

| Tecnologia                               | Uso                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| React 19 + TypeScript 5.9 (`strict`)     | Interface                                                              |
| Vite 8                                   | Servidor de desenvolvimento (com proxy `/api`) e build                 |
| React Router 7                           | Rotas com carregamento sob demanda e guards por perfil                 |
| TanStack Query 5                         | Cache e sincronização dos dados do servidor                            |
| React Hook Form 7 + Zod 4                | Formulários e validação                                                |
| Axios                                    | Cliente HTTP (usado somente na camada de infraestrutura)               |
| CSS Modules + design system "Organic"    | Estilos com os tokens do protótipo (Caprasimo + Figtree)               |
| Vitest 5 + Testing Library + jsdom       | Testes                                                                 |
| ESLint 10 + typescript-eslint + Prettier | Qualidade e padronização (inclui a regra de dependência entre camadas) |

## Como executar

Pré-requisitos: **Node.js 20.19+** e npm.

```bash
npm install
npm run dev
```

Abra <http://localhost:5173>. Por padrão o app usa o backend simulado, então nenhum outro servidor é
necessário.

### Contas de demonstração (modo mock)

| Perfil        | E-mail              | Senha      |
| ------------- | ------------------- | ---------- |
| Cliente       | `isadora@email.com` | `123456`   |
| Administrador | `admin@arena.com`   | `admin123` |

- Na tela de login, **Acesso rápido (demonstração)** preenche essas credenciais.
- Dentro do sistema, o seletor **Cliente | Admin** do cabeçalho troca de conta sem precisar sair.
- Os demais clientes semeados (ex.: `bruna@email.com`) também usam a senha `123456`;
  `marina@email.com` está inativa e não consegue entrar.
- Também é possível criar uma conta nova em **Criar conta** (`/cadastro`).

Os dados simulados ficam no `localStorage` do navegador (chave `arena.mock-db.v1`; a sessão fica em
`arena.sessao`) e as reservas de exemplo são geradas em relação à data de hoje. Para voltar aos dados
iniciais, apague essas chaves (DevTools → Application → Local Storage) ou limpe os dados do site.

## Modos de dados: mock × http

A configuração fica no `.env` (use o `.env.example` como modelo):

| Variável            | Padrão                  | Descrição                                                                                                    |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `VITE_API_MODE`     | `mock`                  | `mock`: backend simulado no navegador (localStorage, latência de 150–400 ms). `http`: API REST ASP.NET Core. |
| `VITE_API_BASE_URL` | `/api`                  | Base URL do cliente HTTP. Com o proxy do Vite, mantenha `/api`.                                              |
| `VITE_BACKEND_URL`  | `http://localhost:5160` | Destino do proxy do Vite para `/api/*` (perfil `http` do `launchSettings.json` do backend).                  |

Para usar a API real:

1. Suba o backend no perfil `http` (`dotnet run --launch-profile http` no projeto `Ottawa Tech - BackEnd`),
   que escuta em <http://localhost:5160>.
2. Crie o `.env` a partir do modelo (`cp .env.example .env` — ele não é versionado) e defina `VITE_API_MODE=http`.
3. Rode `npm run dev`. O Vite repassa `/api/*` para o backend, sem problemas de CORS.

O contrato esperado da API (rotas, formatos, enums, erros e as regras que o servidor deve revalidar)
está em **[docs/api-contract.md](docs/api-contract.md)**.

## Scripts

| Comando              | O que faz                                                   |
| -------------------- | ----------------------------------------------------------- |
| `npm run dev`        | Servidor de desenvolvimento em <http://localhost:5173>      |
| `npm run build`      | Checagem de tipos (`tsc -b`) + build de produção em `dist/` |
| `npm run preview`    | Serve localmente o build de produção                        |
| `npm run typecheck`  | Somente a checagem de tipos                                 |
| `npm run lint`       | ESLint, incluindo as regras de dependência entre camadas    |
| `npm test`           | Executa os testes (Vitest)                                  |
| `npm run test:watch` | Testes em modo observação                                   |
| `npm run format`     | Formata `src/` com o Prettier                               |

## Arquitetura

O código segue a **Arquitetura Limpa**: as regras de negócio ficam no centro, sem depender de React,
HTTP ou armazenamento; as bordas (interface e infraestrutura) dependem do centro, nunca o contrário.

```text
                 ┌──────────────────────────────┐
                 │            domain            │  entidades, enums, regras RN01–RN10
                 └──────────────▲───────────────┘  (TypeScript puro)
                                │
                 ┌──────────────┴───────────────┐
                 │         application          │  casos de uso, DTOs, portas (interfaces),
                 └───────▲──────────────▲───────┘  fachada AppServices
                         │              │
       ┌─────────────────┴───┐      ┌───┴──────────────────┐
       │   infrastructure    │      │     presentation     │
       │  HTTP (axios), mock,│      │  React: rotas, telas,│
       │  localStorage, clock│      │  React Query, UI     │
       └─────────▲───────────┘      └───▲──────────────────┘
                 │                      │
                 └──────────┬───────────┘
                 ┌──────────┴───────────┐
                 │   di/container.ts    │  composition root: escolhe mock ou http
                 └──────────────────────┘  e injeta os casos de uso na interface
```

A seta aponta para quem é usado: `domain ← application ← infrastructure / presentation ← di`.
A apresentação recebe os casos de uso prontos (`AppServices`) por injeção de dependência
(`ServicesProvider`) e **nunca** conversa com repositórios, axios ou localStorage diretamente.

### Regra de dependência (verificada pelo ESLint)

O `eslint.config.js` aplica `no-restricted-imports` por camada; `npm run lint` falha se alguma
importação atravessar a fronteira errada:

| Camada               | Não pode importar                                                       |
| -------------------- | ----------------------------------------------------------------------- |
| `src/domain`         | `application`, `infrastructure`, `presentation`, `di`, `react`, `axios` |
| `src/application`    | `infrastructure`, `presentation`, `di`, `react`, `axios`                |
| `src/infrastructure` | `presentation`, `di`, `react`                                           |
| `src/presentation`   | `infrastructure`, `axios`                                               |

`src/shared` (funções puras de data, horário, moeda e máscaras) e `src/config` (variáveis de ambiente e
contas de demonstração) são utilitários sem dependências de camada.

### Estrutura de pastas

```text
src/
├── main.tsx                 # ponto de entrada: cria o container de DI e renderiza <App />
├── config/                  # variáveis VITE_* e contas de demonstração
├── domain/                  # entidades, enums (objetos `as const`), regras de negócio, DomainError
├── application/             # AppServices (fachada), casos de uso, DTOs, portas, AppError
├── infrastructure/
│   ├── http/                # adaptadores REST (axios) e mapeadores do contrato
│   ├── mock/                # backend simulado: mesmas rotas, regras e erros da API
│   ├── storage/             # SessionStore (token JWT + usuário) no localStorage
│   └── clock/               # relógio do sistema
├── di/container.ts          # composition root (mock × http)
├── presentation/
│   ├── app/                 # App, mapa de rotas, guards e layout autenticado
│   ├── features/            # telas por funcionalidade: auth, reservar, minhas-reservas,
│   │                        #   perfil, admin/* (dashboard, grade, quadras, clientes, pagamentos), errors
│   ├── components/          # design system (ui/), campos de formulário e componentes compartilhados
│   ├── providers/           # DI, React Query, sessão (AuthProvider) e toasts
│   ├── queries/             # hooks do React Query sobre os AppServices
│   ├── validation/          # esquemas Zod dos formulários
│   ├── hooks/ lib/ routes/  # utilitários da interface e caminhos das rotas
│   └── styles/              # tokens e classes do design system, fontes
├── shared/lib/              # datas, horários, moeda e máscaras
└── test/setup.ts            # configuração do Vitest
docs/api-contract.md         # contrato da API REST esperado do backend
```

## Rotas

| Rota                          | Perfil        | Tela                                                      |
| ----------------------------- | ------------- | --------------------------------------------------------- |
| `/`                           | —             | Redireciona para a home do perfil logado ou para `/login` |
| `/login`                      | Público       | Entrar                                                    |
| `/cadastro`                   | Público       | Criar conta (autocadastro do cliente)                     |
| `/reservar`                   | Cliente       | Reservar quadra — home do cliente                         |
| `/minhas-reservas`            | Cliente       | Minhas reservas (cancelar, pagar pendências)              |
| `/meus-dados`                 | Cliente       | Meus dados (atualizar o próprio cadastro)                 |
| `/admin` → `/admin/dashboard` | Administrador | Visão geral da arena — home do administrador              |
| `/admin/reservas`             | Administrador | Grade de reservas por dia e quadra                        |
| `/admin/quadras`              | Administrador | Quadras (cadastro, edição e status)                       |
| `/admin/clientes`             | Administrador | Clientes (busca, cadastro, edição, inativação)            |
| `/admin/pagamentos`           | Administrador | Pagamentos (confirmação e recibos)                        |
| qualquer outra                | —             | Página não encontrada (404)                               |

Comportamento dos guards:

- **Sem sessão** em uma rota protegida → `/login`, guardando a página de origem; depois de entrar, o
  usuário volta para ela se o perfil dele puder acessá-la (senão, vai para a home do perfil).
- **Perfil errado** (ex.: cliente em `/admin/...`) → home do próprio perfil.
- **Já autenticado** em `/login` ou `/cadastro` → home do perfil.
- **Sessão perdida** (clicar em _Sair_, token expirado ou resposta 401 da API) → volta automaticamente
  para `/login`, com aviso.

Cada página é carregada sob demanda (um chunk por rota), define o título da aba
(ex.: "Reservar quadra · Arena Beach Tennis") e a rolagem volta ao topo a cada navegação.

## Requisitos e regras de negócio

Requisitos funcionais cobertos (MVP, Sprints 1 a 6):

| Requisitos   | Funcionalidade                                                                                                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF01–RF04    | Clientes: autocadastro e cadastro pelo administrador (RF01), atualização dos dados — inclusive em _Meus dados_ (RF02) —, consulta com busca e paginação e inativação/reativação sem excluir o histórico (RF04) |
| RF05–RF08    | Quadras: cadastro e edição (RF05/RF06), status Ativa / Manutenção / Inativa (RF07) e consulta da disponibilidade por data                                                                                      |
| RF09–RF13    | Reservas: criação com pagamento (RF09), cálculo de horários livres e bloqueio de conflitos (RF10), consulta das reservas, cancelamento (RF12) e alteração de data, horário ou quadra (RF13)                    |
| RF14–RF16    | Pagamentos simulados: registro na reserva (RF14), consulta e confirmação de pagamentos pendentes pelo administrador (RF16)                                                                                     |
| Sprint 5 / 6 | Autenticação JWT com perfis Cliente e Administrador; dashboard com indicadores do dia e ocupação por quadra                                                                                                    |

Regras de negócio (validadas no domínio, no backend simulado e — conforme o contrato — no backend real):

| Regra | Descrição                                                        |
| ----- | ---------------------------------------------------------------- |
| RN01  | CPF único entre clientes ativos                                  |
| RN02  | E-mail único no cadastro                                         |
| RN03  | Somente quadras ativas recebem novas reservas                    |
| RN04  | Uma quadra não pode ter reservas com horários sobrepostos        |
| RN05  | Toda reserva pertence a um cliente (ativo)                       |
| RN06  | Toda reserva pertence a uma quadra                               |
| RN07  | Valor da reserva = valor por hora da quadra × duração            |
| RN08  | O cliente pode cancelar (ou alterar) até 4 horas antes do início |
| RN09  | Reserva cancelada libera o horário                               |
| RN10  | No máximo um pagamento ativo por reserva                         |

Parâmetros da agenda: funcionamento das 07h às 22h, durações de 1 hora, 1h30 ou 2 horas e reservas
de hoje até 30 dias à frente. Pagamento simulado: Pix e Cartão são aprovados na hora; Dinheiro fica
pendente até o administrador confirmar o recebimento. O cancelamento estorna o pagamento pago e
cancela o pendente.

A interface pré-valida os dados (campos obrigatórios, formatos de CPF, telefone, e-mail e senha), mas
o servidor sempre revalida tudo na gravação — os erros da API aparecem junto ao campo e em um aviso.

## Testes

```bash
npm test
```

Há testes unitários das regras de domínio, dos casos de uso, do backend simulado e dos adaptadores
HTTP, e testes de interface com Testing Library (rotas e guards, login/cadastro, telas do cliente e do
administrador).
