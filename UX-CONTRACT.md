# Contrato de UX

Idioma pt-BR, moeda BRL, calendário gregoriano e datas interpretadas no fuso local. Produto para gestão de arena no Brasil; não há escopo Japão. Interface administrativa e transacional, não marketing.

## Fontes de negócio

| Tema | Fonte |
| --- | --- |
| Permissão e perfis | `docs/business-rules.md`, `domain/enums`, casos de uso e autorização do mock |
| Reserva, alteração, cancelamento | `docs/business-rules.md`, `domain/rules/reserva.rules.ts` |
| Pagamento e estorno | `docs/api-contract.md`, `domain/rules/pagamento.rules.ts` |
| Cadastro e unicidade | `domain/rules/cliente.rules.ts`, `application/use-cases` |
| Persistência e API | `docs/adr/0002-backend-simulado-no-navegador.md`, `docs/api-contract.md` |

O contrato descreve consequências de interface; as regras de negócio não são redefinidas aqui.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Select/Listbox | EditorComponent e select nativo | DESIGN.md e shared.ts | native | TestBed e e2e/migration.spec.ts |
| Date | Campos date nativos e BookingComponent | DESIGN.md e regras de reserva | native e faixa de dias | E2E de reserva e alteração |
| Form | EditorComponent | validation/schemas.ts e shared.ts | cadastro, edição, login | editor.test.ts e E2E |
| Scrollbar | angular/app.css | DESIGN.md e design-system.css | global e overflow horizontal de tabela | E2E de layout |
| Toast | AppState e AppComponent | state.ts | informação e erro | E2E e testes Angular |
| CRUD | Casos de uso e componentes Angular | contrato REST e regras de negócio | diálogo, perfil inline, reserva com navegação | E2E completo |

Não há seleção em massa ou exclusão definitiva de registros. Select/date têm popups sob responsabilidade do navegador; datas continuam editáveis pelo teclado. Não se promete geometria própria para esses popups.

## Fluxos

| Operação | Pendente | Sucesso | Falha e recuperação | Fonte |
| --- | --- | --- | --- | --- |
| Criar/editar cliente ou quadra | Campos e submit bloqueados | Fechar diálogo, reler lista, toast | Preservar valores e associar erros | RF01–RF07, casos de uso |
| Editar perfil | Submit bloqueado | Permanecer, reset do formulário, sessão atualizada | Preservar campos e mostrar erro | RF02 |
| Reservar | Confirmação com valor e método | Minhas reservas e toast | Recarregar disponibilidade, limpar horário | RF09, RF14, RN03–RN07 |
| Alterar reserva | Confirmação e submit bloqueado | Fechar diálogo e reler grade | Manter seleção e revalidar | RF13, RN08 |
| Cancelar reserva | Confirmação com consequência financeira | Reler lista/grade, toast | Mostrar motivo e permitir retry | RF12, RN08–RN10 |
| Confirmar dinheiro | Confirmação explícita do recebimento | Reler pagamentos, recibo | Não repetir mutação automaticamente | RF16 |
| Inativar cliente | Confirmação com preservação do histórico | Reler lista | Mostrar erro | RF04 |

## Estados e acesso

Toda leitura assíncrona tem carregamento, mensagem de erro e retry. Tabelas têm vazio e paginação de oito itens; a grade diária é limitada aos horários do domínio. Busca de clientes é local sobre o conjunto retornado pelo contrato atual, com limpar e reset de página. Busca/filtros permanecem locais à página, como na implementação anterior; não são enviados à URL por conterem CPF/nome/e-mail. Respostas antigas não sobrescrevem consultas mais recentes.

Guards preservam acesso por perfil; o backend também autoriza operações. Sem sessão, ir ao login; perfil errado, voltar à home do próprio perfil. Sessão perdida redireciona imediatamente. Não manter cache global com dados do usuário anterior.

## Acessibilidade e integridade

Formulários `novalidate`, erro textual associado e foco no primeiro campo inválido. Senhas mascaradas com botão mostrar/ocultar; não persistir dados de formulário sensíveis. Alterações não salvas exigem confirmação no diálogo da aplicação para navegação/fechamento; unload usa o mecanismo do navegador. Login é transitório e pode ser descartado sem confirmação.

Diálogos usam `showModal`, nome único, Escape, foco inicial e restauração. Confirmações começam na ação de voltar. Fundo isolado e scroll bloqueado enquanto modal aberto. Mutações não aceitam envio duplicado. Foco após navegação segue para conteúdo. Links têm destino, botões têm nome e semântica. Estados usam texto além de cor; animação respeita reduced-motion. Verificar 375px, desktop, teclado, popup nativo e recuperação de erro no navegador.
