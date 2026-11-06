# Telas e fluxos

Todas as rotas são componentes Angular standalone, um por pasta de domínio em `src/features/` (cada um com `.ts`, `.html` e, quando precisa, `.css`). O tema e os fluxos permanecem compartilhados entre cliente e administrador. Capturas desta pasta anteriores à migração não são referência da implementação atual; veja o relatório de migração e a evidência E2E.

| Tela | Componente | Comportamento |
| --- | --- | --- |
| Entrar / Criar conta | `features/auth/auth.ts` | Validação, contas demo no mock, cadastro com login, origem segura após autenticação |
| Reservar quadra | `features/reservas/reservar/reservar.ts` | Data (faixa e campo), quadra, duração, slots com motivos, resumo e confirmação de pagamento |
| Minhas reservas | `features/reservas/minhas-reservas/minhas-reservas.ts` | Estatísticas, histórico ordenado, pagamento de reserva sem pagamento, cancelamento permitido e consequência financeira |
| Meus dados | `features/clientes/meus-dados.ts` | Cadastro preenchido, senha opcional, reset, salvar e sincronizar sessão |
| Dashboard | `features/dashboard/dashboard.ts` | Data, indicadores, ocupação e reservas recentes |
| Grade | `features/reservas/grade/grade.ts` | Grade diária, legenda, detalhe, alteração com disponibilidade sem a própria reserva, cancelamento administrativo |
| Quadras | `features/quadras/quadras.ts` | Criar, editar, preço por hora, tipo e status |
| Clientes | `features/clientes/clientes.ts` | Criar, editar, buscar por nome/CPF/e-mail, filtrar, paginar, inativar/reativar com histórico |
| Pagamentos | `features/pagamentos/pagamentos.ts` | Totais, filtros, paginação, confirmar dinheiro e consultar recibo |
| 404 | `app/not-found.ts` | Mensagem e retorno à home |

## Navegação e estados

Cabeçalho com identidade Ottawa Tech, sessão, sair e troca demo no mock. Menus seguem o perfil. Títulos por rota, link de pular para conteúdo e foco após navegação. Leituras têm carregamento, retry e vazio; formulários mantêm dados após erro e impedem duplicação. Diálogos têm nome, Escape, foco restaurado e confirmação antes de perder alterações. Busca e filtros de listas reiniciam a página.

## Roteiro de revisão

1. Entrar como cliente, escolher amanhã, quadra ativa, duração e horário livre; confirmar Pix.
2. Conferir o pagamento e cancelar a reserva futura; conferir estorno.
3. Fazer uma reserva em dinheiro; entrar como administrador, confirmar recebimento e consultar recibo.
4. Abrir a grade do dia, selecionar a reserva e alterar duração/horário/quadra; conferir os dados após salvar.
5. Cadastrar/editar quadra e cliente; testar status, pesquisa e paginação.
6. Atualizar perfil e conferir nome no cabeçalho; sair e entrar novamente.
7. Repetir o acesso e os formulários em 375px, navegar por teclado, abrir select e cancelar diálogos com Escape.

Regras detalhadas: [business-rules.md](business-rules.md). Contrato visual/comportamental: [DESIGN.md](../DESIGN.md) e [UX-CONTRACT.md](../UX-CONTRACT.md).

## Capturas da aplicação Angular

| Cliente | Administrador |
| --- | --- |
| ![Reservar quadra](images/angular/reservar.png) | ![Dashboard](images/angular/admin-dashboard.png) |
| ![Minhas reservas](images/angular/minhas-reservas.png) | ![Grade](images/angular/admin-grade.png) |
| ![Login no celular](images/angular/mobile-login.png) | ![Clientes](images/angular/admin-clientes.png) |
