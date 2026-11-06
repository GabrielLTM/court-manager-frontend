# Migração React → Angular

## Resultado e escopo

A apresentação foi substituída por Angular 21: bootstrap standalone, Router com carregamento sob demanda e guards, Forms, Signals, componentes e primitivas compartilhadas. As dependências e fontes React/JSX foram removidas. Os contratos, regras de negócio e funcionalidades foram mantidos nas camadas existentes.

`domain`, `application`, `infrastructure` e `shared` não receberam alterações. Permanecem os adaptadores HTTP, erros, enums numéricos, DTOs, relógio injetável, sessão, mock e formato de dados persistidos. A configuração conserva os nomes públicos `VITE_*` por compatibilidade; o builder da aplicação agora é Angular CLI.

## Paridade por capacidade

| Capacidade anterior | Implementação Angular | Evidência |
| --- | --- | --- |
| Entrar, criar conta e acesso demo | AuthComponent, EditorComponent, AppState | E2E de acesso e cadastro; erros RN02 por campo |
| Autorização e origem após login | authenticated/publicOnly e access.ts | Testes de guards, regressão de access.ts e E2E de perfis |
| Sessão, expiração, abas e perfil | SessionStore preservado e AppState | Suíte de armazenamento e E2E de logout entre abas |
| Cadastro e senha opcional | MeusDadosComponent e EditorComponent | E2E de atualização e login com senha mantida |
| Disponibilidade e reserva | ReservarComponent e regras preservadas | Regressão de slots e E2E com confirmação Pix/dinheiro |
| Histórico e estatísticas do cliente | MinhasReservasComponent e utilitários preservados | Suíte de utilitários, E2E e captura atual |
| Cancelamento e estorno | Casos de uso preservados e confirmação compartilhada | Testes de domínio/mock e E2E de ciclo financeiro |
| Alteração administrativa | GradeComponent e ReservarComponent reutilizado | E2E de alteração; bloqueio RN07 de mudança de valor pago |
| Dashboard por data e ocupação | DashboardComponent | Regressão do caso de uso/indicadores e navegação E2E |
| Grade diária e detalhes | GradeComponent e montarGrade | Regressão da grade e E2E com detalhe/alteração |
| Quadras: criar, editar, status | QuadrasComponent | E2E de criação, edição e manutenção |
| Clientes: CRUD lógico, busca e filtros | ClientesComponent | Regressão dos filtros, E2E de criação/edição/status/paginação |
| Pagamentos, confirmação e recibo | PagamentosComponent | Regressão de totais, E2E de recebimento e recibo |
| Loading, erro, retry e envio único | AsyncPage e EditorComponent | Testes de concorrência, retry, busy e validação |
| Erro de página, 404 e recuperação | AppErrorHandler, NavigationError e NotFoundComponent | Build/checagem estrita, E2E de 404 e ausência de erros de runtime |
| Teclado, formulários e mobile | Primitivas compartilhadas e CSS responsivo | TestBed e E2E a 375px, Escape, senha e select |

## Verificação

- Instalação limpa com `npm ci`.
- `npm run lint`.
- `npm run typecheck`: aplicação, templates, testes e scripts TypeScript.
- `npm test`: **188 testes em 24 arquivos**. Inclui os **179 testes puros anteriores** e nove testes Angular novos. Os 59 testes acoplados a componentes React foram substituídos por testes Angular e fluxos completos de navegador; as contagens não representam equivalência de cobertura percentual.
- `npm run build`: compilação Angular AOT de produção; smoke em navegador do build servido por preview confirmou login, disponibilidade, dashboard e recarga de rota protegida.
- `npm run test:e2e`: **seis cenários completos no Chromium**, incluindo ciclos financeiros, CRUD, cadastro, sessão entre abas, teclado e 375px.
- Auditoria estática premium em modo estrito: sem findings; relatório em `premium-audit.json`.
- `DESIGN.md` validado pelo CLI designmd, sem erros estruturais.
- Capturas atuais em `images/angular/`, revisadas em desktop e celular.

## Decisões observáveis

Os caminhos de navegação, contas demo, métodos de pagamento, estados de negócio e mensagens em português permanecem. A UI Angular usa os tokens existentes e reorganiza os componentes em uma camada compartilhada. Datas e selects usam popups do navegador, além da faixa rápida de dias do agendamento; a aparência e o idioma do popup dependem da plataforma. Datas e valores apresentados em textos da aplicação mantêm os formatadores pt-BR/BRL.

Não há cache global de servidor entre perfis. Cada página lê novamente ao entrar e após mutações; respostas antigas são descartadas. Mutações nunca são repetidas automaticamente. A validação de unicidade e os efeitos financeiros continuam sendo responsabilidade dos casos de uso e do backend.

## Limites

Os fluxos de navegador foram exercitados com o backend simulado. A integração ponta a ponta com uma API ASP.NET Core externa exige um backend compatível disponível e não foi validada nesta migração. Não há declaração de cobertura percentual, auditoria humana completa de acessibilidade nem teste em todos os navegadores. Os ADRs antigos preservam o histórico; o ADR-0009 registra a decisão vigente.
