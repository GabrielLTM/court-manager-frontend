# Arquitetura

A aplicação usa Angular 21 com componentes standalone, Angular Router, Angular Forms e Signals. O domínio e os casos de uso continuam em TypeScript puro. O [ADR-0009](adr/0009-migracao-angular.md) substitui as decisões de apresentação anteriores.

## Camadas

| Camada | Responsabilidade | Dependências |
| --- | --- | --- |
| `core/domain` | Entidades, enums numéricos, RN01–RN10 | Nenhum framework ou HTTP |
| `core/application` | Casos de uso, DTOs, `AppServices`, portas `SessionStore` e `Clock` | Domínio |
| `core/infrastructure` | Adaptadores REST axios, backend mock, localStorage, relógio | Aplicação e domínio |
| `app`, `features`, `shared` | Componentes Angular, rotas, formulários, estado e lógica de exibição | Aplicação e domínio |
| `core/di` | Escolha mock/HTTP e montagem dos serviços | Adaptadores e aplicação |

O ESLint impõe as fronteiras por aliases `@/`. Os casos de uso e a infraestrutura foram preservados durante a migração. A lógica pura de cada tela fica em `features/**/*.utils.ts`, fora dos componentes.

## Pastas

A interface é organizada por domínio ([ADR-0010](adr/0010-organizacao-das-pastas-por-dominio.md)): o que é de uma tela fica junto.

| Pasta | Conteúdo |
| --- | --- |
| `src/features/<domínio>/` | As telas do domínio. Cada tela tem `<tela>.ts` (componente), `<tela>.html` (template) e, quando tem estilo próprio, `<tela>.css`; ao lado ficam a lógica pura (`*.utils.ts`) e a validação (`*.schemas.ts`). Domínios: `auth`, `reservas` (com `reservar/`, `minhas-reservas/` e `grade/`), `quadras`, `clientes`, `pagamentos` e `dashboard`. |
| `src/shared/` | O que várias telas usam: `ui/` (`DialogComponent`, `EditorComponent`, `PaginationComponent`, `AsyncPage`), `styles/` (tokens, `global.css` e fontes), `assets/` e `lib/`. |
| `src/app/` | A casca: `app.ts`/`.html`/`.css`, `app.routes.ts` (rotas e guards), `app-state.ts` (sessão, avisos e confirmação) e página 404. |
| `src/core/` | O núcleo sem Angular: `domain/`, `application/`, `infrastructure/` e `di/`. |

Os componentes usam `templateUrl` e `styleUrl`. Os estilos de um componente valem só para o template dele (encapsulamento padrão do Angular); classes usadas por várias telas, como `.btn`, `.card` e `.tag`, ficam em `src/shared/styles/global.css`.

## Bootstrap e injeção

`src/main.ts` usa `bootstrapApplication(AppComponent)` e `provideRouter(routes)`. A factory `createContainer` fornece o token `APP_SERVICES`; a apresentação injeta esse token por `AppState`. Nenhum componente conhece os repositórios ou axios.

`AppState` mantém a sessão e notificações com Signals, assina `auth.subscribe` e verifica expiração. O `SessionStore` existente sincroniza abas e remove sessões inválidas. Guards leem a sessão atual, protegem os perfis e mantêm a origem do login. O roteador carrega componentes sob demanda e atualiza o título do documento.

## Dados assíncronos

Cada página possui seus dados; não há cache de servidor global compartilhado entre perfis. `AsyncPage.request` expõe carregamento, erro e retry e usa um contador para descartar respostas de requisições antigas ou páginas destruídas. Após uma mutação, a página relê seus dados; navegar para outra tela faz uma leitura nova. `ReservarComponent` aplica a mesma proteção às consultas de disponibilidade. Mutações não são repetidas automaticamente, evitando duplicação de pagamentos e reservas.

## Formulários e acessibilidade

`EditorComponent` centraliza campos, validação Zod, máscaras, associação de erros, foco no primeiro erro, senha com mostrar/ocultar, reset e proteção de dados não salvos. `DialogComponent` usa `HTMLDialogElement.showModal`: isolamento do fundo, Escape, foco e restauração do foco. `PaginationComponent` mantém os limites de página. As páginas reutilizam essas primitivas.

As decisões observáveis estão em [UX-CONTRACT.md](../UX-CONTRACT.md); tokens e identidade estão em [DESIGN.md](../DESIGN.md). O domínio continua decidindo permissões, disponibilidade e ciclos financeiros.

## Reserva e pagamento

1. Consultar quadras e disponibilidade; `gerarSlots` filtra as opções pelas regras existentes.
2. Selecionar data, quadra, duração e horário; mudanças invalidam o horário.
3. Exibir resumo e confirmar método.
4. Chamar `reservas.criar`, que mantém a pré-validação e chamadas existentes de reserva e pagamento.
5. Após sucesso, navegar para Minhas reservas; após erro, recarregar a disponibilidade.

Reserva e pagamento continuam sendo operações distintas no contrato HTTP. Falha do pagamento pode deixar uma reserva sem pagamento; o usuário pode pagá-la depois. O backend é responsável pela autorização e revalidação de conflitos. Alterações administrativas usam `slotsDaAlteracao`, que remove a própria reserva dos intervalos ocupados.

## Build e configuração

Angular CLI compila templates AOT e produz `dist/court-manager/browser`. `scripts/ng.mjs` lê `.env`, arquivos por modo e variáveis do processo com a precedência do loader Vite, mantendo os nomes públicos existentes `VITE_*`. O objeto `ARENA_ENV` é definido em build. O proxy de desenvolvimento é gerado em `.angular/proxy.json` (ignorado pelo Git) e mantém verificação TLS.

Os testes ficam fora do repositório, só na cópia local; veja [testing.md](testing.md).
