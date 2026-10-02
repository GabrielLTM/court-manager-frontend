# Guia de instalação e execução

Este guia leva do `git clone` até o sistema rodando, e mostra como apontar o frontend para a API real,
gerar o build de produção e resolver os problemas mais comuns. Para uma visão geral do projeto, veja o
[README](../README.md).

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Primeiro acesso](#primeiro-acesso)
- [Configuração](#configuração)
- [Backend simulado e dados de demonstração](#backend-simulado-e-dados-de-demonstração)
- [Usando a API real](#usando-a-api-real)
- [Build de produção e deploy](#build-de-produção-e-deploy)
- [Verificações de qualidade](#verificações-de-qualidade)
- [Solução de problemas](#solução-de-problemas)

## Pré-requisitos

| Ferramenta | Versão | Observação |
| --- | --- | --- |
| Node.js | 20.19 ou superior | Confira com `node -v`. Define-se em `engines` no `package.json`. |
| npm | 10 ou superior | Vem com o Node 20. |
| Git | qualquer versão recente | Para clonar o repositório. |
| Navegador | versão atual do Chrome, Edge, Firefox ou Safari | Usado para abrir o sistema. |
| .NET SDK | 10 | Somente para rodar o backend real; o frontend não precisa. |

## Instalação

```bash
git clone https://github.com/GabrielLTM/court-manager-frontend.git
cd court-manager-frontend
npm install
npm run dev
```

O Vite imprime o endereço, normalmente <http://localhost:5173>. Se a porta estiver ocupada, ele usa a
próxima livre; veja o endereço no terminal.

Em integração contínua ou quando quiser instalar exatamente as versões do `package-lock.json`, use
`npm ci` no lugar de `npm install`.

## Primeiro acesso

Sem nenhuma configuração, o sistema usa o [backend simulado](#backend-simulado-e-dados-de-demonstração).
Entre com uma das contas de demonstração:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Cliente | `isadora@email.com` | `123456` |
| Administrador | `admin@arena.com` | `admin123` |

Na tela de login, os botões de **Acessar como** preenchem as credenciais. Os demais clientes de exemplo
(como `bruna@email.com`) também usam a senha `123456`; `marina@email.com` está inativa e não consegue
entrar, o que serve para testar o bloqueio de cadastros inativos.

Roteiro rápido para conhecer o sistema (cerca de dois minutos):

1. Entre como **Cliente** e abra **Reservar quadra**.
2. Escolha o dia seguinte, a Quadra 01, 1 hora e um horário livre; confirme com **Pix**.
3. Em **Minhas reservas**, veja a nova reserva paga e experimente **Cancelar** em uma reserva futura:
   o pagamento passa a **Estornado**.
4. Troque para **Admin** no seletor do cabeçalho e abra **Grade de reservas**: a reserva aparece na
   grade, e clicar nela mostra o detalhe.
5. Em **Pagamentos**, confirme um pagamento pendente (reservas pagas em dinheiro começam pendentes).

Cada tela é descrita em [screens.md](screens.md).

## Configuração

A configuração é feita por variáveis de ambiente do Vite, lidas de um arquivo `.env` na raiz. Todas são
opcionais.

```bash
cp .env.example .env
```

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_API_MODE` | `mock` | `mock`: backend simulado no navegador. `http`: API REST ASP.NET Core. |
| `VITE_API_BASE_URL` | `/api` | Base URL usada pelo cliente HTTP no modo `http`. Com o proxy do Vite, mantenha `/api`. |
| `VITE_BACKEND_URL` | `http://localhost:5160` | Para onde o servidor de desenvolvimento repassa as chamadas `/api/*`. |

Pontos de atenção:

- O arquivo `.env` não é versionado; o modelo é o `.env.example`.
- Reinicie o `npm run dev` depois de alterar o `.env`.
- Somente variáveis com o prefixo `VITE_` chegam ao código do navegador, e seus valores ficam
  **embutidos no build**. Nunca coloque segredos nelas.
- Qualquer valor diferente de `http` em `VITE_API_MODE` mantém o modo `mock`.

## Backend simulado e dados de demonstração

No modo `mock`, um backend completo roda dentro do navegador: ele implementa as mesmas rotas, regras de
negócio (RN01–RN10), autorização por perfil e erros do contrato da API, com latência artificial de
150 a 400 ms para parecer uma rede real. Veja a motivação em
[ADR-0002](adr/0002-backend-simulado-no-navegador.md).

| O quê | Onde |
| --- | --- |
| Banco simulado (clientes, quadras, reservas, pagamentos) | `localStorage`, chave `arena.mock-db.v1` |
| Sessão (token JWT simulado e usuário) | `localStorage`, chave `arena.sessao` |
| Dados iniciais | Gerados na primeira carga, **em relação à data de hoje** (reservas de hoje, de amanhã etc.) |

Os dados pertencem ao navegador e ao endereço em uso: outro navegador, uma janela anônima ou outra
porta começam do zero. Para restaurar os dados de demonstração, execute no console do navegador (DevTools,
aba Console) e recarregue:

```js
localStorage.removeItem('arena.mock-db.v1');
localStorage.removeItem('arena.sessao');
location.reload();
```

## Usando a API real

O frontend já tem os adaptadores HTTP para o contrato descrito em [api-contract.md](api-contract.md).
Para usá-los:

1. **Suba o backend** (projeto `Ottawa Tech - BackEnd`, ASP.NET Core) no perfil `http`:

   ```bash
   dotnet run --launch-profile http
   ```

   Ele escuta em <http://localhost:5160>, o endereço padrão de `VITE_BACKEND_URL`.
2. **Configure o frontend**: crie o `.env` (`cp .env.example .env`) e defina `VITE_API_MODE=http`.
3. **Reinicie** o `npm run dev`. O Vite repassa `/api/*` para o backend, sem problemas de CORS.
4. Confira na aba Network do navegador: as chamadas devem ir para `/api/...` (por exemplo,
   `POST /api/auth/login` ao entrar).

Se você preferir o perfil `https` do backend (`https://localhost:7279`), ajuste `VITE_BACKEND_URL` e
confie no certificado de desenvolvimento (`dotnet dev-certs https --trust`); o perfil `http` evita esse
passo.

> **Estado do backend.** Na última verificação (25/09/2026, branch `Release`), o backend tinha só as
> entidades, os enums e um controller de teste: faltavam o banco, a autenticação JWT e os endpoints do
> contrato. Enquanto isso, o modo `http` mostra "Não foi possível conectar ao servidor" ou erros 404. A
> [seção 7 do contrato](api-contract.md#7-ajustes-necessários-no-backend-estado-verificado-em-25092026)
> lista os ajustes necessários.

## Build de produção e deploy

```bash
npm run build     # checa os tipos e gera os arquivos estáticos em dist/
npm run preview   # serve o build localmente para conferir (http://localhost:4173)
```

O resultado em `dist/` é um site estático: qualquer hospedagem de arquivos serve. Duas exigências:

- **Fallback de SPA.** As rotas são resolvidas no navegador (`/reservar`, `/admin/clientes`...), então
  qualquer caminho desconhecido precisa devolver o `index.html`.
- **Variáveis no momento do build.** Para o modo `http` em produção, defina-as ao compilar. O proxy
  `/api` do Vite existe apenas em desenvolvimento.

```bash
VITE_API_MODE=http VITE_API_BASE_URL=/api npm run build
```

Exemplo de Nginx com fallback de SPA e proxy para o backend no mesmo domínio (sem CORS):

```nginx
server {
  listen 80;
  root /var/www/arena/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:5160;   # backend ASP.NET Core
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Se o backend ficar em outro domínio, use uma URL absoluta em `VITE_API_BASE_URL`
(por exemplo, `https://api.exemplo.com/api`) e habilite CORS no backend para a origem do frontend.

## Verificações de qualidade

```bash
npm run lint        # ESLint e regra de dependência entre camadas
npm run typecheck   # TypeScript em modo estrito
npm test            # testes (Vitest)
npm run build       # tipos + build de produção
```

Rode as quatro antes de abrir um pull request ([CONTRIBUTING.md](../CONTRIBUTING.md)). O que cada teste
cobre está em [testing.md](testing.md).

## Solução de problemas

| Sintoma | Causa provável | Como resolver |
| --- | --- | --- |
| `npm install` reclama da versão do Node | Node abaixo de 20.19 | Atualize o Node (por exemplo, com `nvm install 22`) e rode `node -v`. |
| O endereço não é `localhost:5173` | Porta ocupada: o Vite usa a próxima livre | Use o endereço mostrado no terminal ou rode `npm run dev -- --port 5180`. |
| Mudei o `.env` e nada mudou | O Vite lê o `.env` ao iniciar | Pare e rode `npm run dev` de novo. |
| "Não foi possível conectar ao servidor" ao entrar | Modo `http` com o backend desligado | Suba o backend ou volte para `VITE_API_MODE=mock`. |
| Os dados de exemplo parecem desatualizados ou estranhos | O banco simulado fica no `localStorage` e foi gerado em outra data | [Restaure os dados](#backend-simulado-e-dados-de-demonstração). |
| Sou levado ao login sozinho | Sessão expirada (8 horas) ou resposta 401 da API | Entre de novo; o aviso "Sua sessão expirou" confirma o motivo. |
| Erro de CORS em produção | Frontend e API em origens diferentes sem CORS habilitado | Use um proxy reverso para `/api` ou habilite CORS no backend. |
| Ao recarregar `/reservar` em produção aparece 404 | Hospedagem sem fallback de SPA | Configure o fallback para `index.html` ([exemplo](#build-de-produção-e-deploy)). |
