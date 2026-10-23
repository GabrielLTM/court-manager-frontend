# Instalação e execução

## Pré-requisitos

Node.js 22.12+ (recomendado: 24 LTS), npm e Git. O backend .NET é opcional para integração HTTP; o fluxo padrão funciona inteiramente no navegador.

```bash
git clone https://github.com/GabrielLTM/court-manager-frontend.git
cd court-manager-frontend
npm ci
npm run dev
```

O Angular CLI usa a porta 5173. Para trocar: `npm run dev -- --port 5180`. O servidor de desenvolvimento não é uma hospedagem de produção.

## Contas e persistência

Cliente: `isadora@email.com` / `123456`. Administrador: `admin@arena.com` / `admin123`. Os botões de acesso rápido preenchem essas contas públicas de demonstração. O mock semeia dados relativos à data atual; mantém `arena.mock-db.v1` e `arena.sessao` no localStorage. Para reiniciar a demonstração, remova somente essas duas chaves no navegador e recarregue.

## Variáveis

Copiar `.env.example` para `.env` é opcional. Os nomes foram preservados para compatibilidade:

| Nome | Padrão | Efeito |
| --- | --- | --- |
| `VITE_API_MODE` | `mock` | `http` ativa adaptadores REST |
| `VITE_API_BASE_URL` | `/api` | Base das requisições HTTP |
| `VITE_BACKEND_URL` | `http://localhost:5160` | Destino do proxy de desenvolvimento |

`scripts/ng.mjs` lê a configuração pública para `ng serve` e `ng build`. Reinicie o servidor após mudanças. Valores ficam embutidos no frontend; não use segredos. `.env` permanece ignorado pelo Git.

## API real

Inicie um backend compatível com [api-contract.md](api-contract.md), defina `VITE_API_MODE=http`, mantenha a base `/api` e configure o destino do backend. O proxy existe somente em desenvolvimento. Para HTTPS, o certificado precisa ser válido e confiável; não desative a verificação TLS. A integração depende de o backend implementar os endpoints e não foi comprovada pelos testes com mock.

## Build e deploy

```bash
npm run build
npm run preview
```

Publique o conteúdo de **`dist/court-manager/browser`**. Configure fallback de SPA para `index.html` em todas as rotas de navegação. No modo HTTP, configure um proxy reverso `/api` ou uma base absoluta com CORS no backend. Os valores públicos devem ser definidos antes do build.

## Qualidade

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Para E2E, Chromium deve estar em `/usr/bin/chromium` ou no caminho definido por `CHROMIUM_PATH`. As falhas incluem trace e screenshot em `test-results/`.

## Problemas comuns

| Problema | Ação |
| --- | --- |
| Erro de versão Node | Usar Node 24 LTS e executar `npm ci` |
| Porta ocupada | Escolher outra porta com `--port` |
| Falha de login no modo HTTP | Verificar backend, contrato e destino do proxy |
| Rotas retornam 404 em produção | Configurar fallback para `index.html` |
| Configuração não mudou | Reiniciar o servidor ou refazer o build |
| Dados de demonstração antigos | Remover as duas chaves do mock e recarregar |
| Chromium ausente | Instalar um navegador suportado e definir `CHROMIUM_PATH` |
