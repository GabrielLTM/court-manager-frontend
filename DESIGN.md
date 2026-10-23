---
version: alpha
colors:
  background: '#040813'
  surface: '#0d1426'
  text: '#eaf0ff'
  primary: '#1fb4f5'
  secondary: '#7a5cff'
typography:
  heading:
    fontFamily: 'Sora Variable, Sora, system-ui, sans-serif'
  body:
    fontFamily: 'Figtree, system-ui, sans-serif'
rounded:
  sm: '8px'
  md: '16px'
  lg: '28px'
spacing:
  small: '8.8px'
  medium: '17.6px'
  large: '26.4px'
components:
  card:
    backgroundColor: '#0d1426'
    textColor: 'text'
---
# Ottawa Tech — Arena Beach Tennis

## Overview

Aplicação operacional para clientes reservarem quadras e administradores acompanharem a arena. Preservar a identidade Ottawa Tech: fundo azul escuro, ciano e violeta, quadra como elemento gráfico e tipografia Sora/Figtree. A migração de framework não é uma mudança de marca. Evitar aparência de landing page, cores decorativas por tela ou bibliotecas com tema alheio.

## Colors

O arquivo canônico é `src/presentation/styles/design-system.css` (modelo B: tokens existentes). Este documento espelha os valores; não gera uma segunda folha de tema. `background → --color-bg`, `surface → --color-surface`, `text → --color-text`, `primary → --color-accent`, `secondary → --color-accent-2`. Rampas completas, sombras e gradiente ficam nesse mesmo arquivo. `angular/app.css` consome os tokens e centraliza adaptações de componentes. Erro/perigo usa texto e borda rosa, sempre acompanhado por mensagem ou verbo explícito; status nunca depende apenas de cor.

## Typography

Títulos usam `--font-heading` (Sora Variable), corpo `--font-body` (Figtree), fontes locais. Interface em pt-BR; datas de calendário locais e valores BRL. Rótulos curtos e verbos consistentes. Números em cartões com hierarquia clara, sem transformar toda a interface em material promocional.

## Layout

Conteúdo até 1320px. Cabeçalho e navegação compartilhados. Agendamento usa etapas e resumo lateral; no celular o resumo segue o fluxo do documento. Quadras usam cartões; clientes e pagamentos usam tabelas paginadas com overflow horizontal local. O documento controla o scroll vertical. Referência estreita: 375px. Não limitar a altura de formulários para acomodar tabelas. Scrollbars globais derivam dos tokens neutros; forced-colors preserva o sistema operacional.

## Elevation & Depth

Contorno fino e sombras do sistema escuro. Elevação maior reservada a diálogos e notificações. Não introduzir sombras por tela.

## Shapes

Campos usam raio de 8px, superfícies de 28px, botões em pílula. O desenho de quadra aparece no acesso e nos cartões de quadra; o restante da aplicação privilegia informação operacional.

## Components

`EditorComponent`, `DialogComponent` e `PaginationComponent` em `src/presentation/angular/shared.ts` são os proprietários de comportamento. Classes `.btn`, `.card`, `.tag` e campos nativos compartilham o estilo global. `AppState` é proprietário de notificações e confirmações. Select e date nativos aceitam popup e interação do navegador; não prometemos geometria ou calendário desenhado pela aplicação. A faixa de sete dias do agendamento oferece escolha rápida em pt-BR.

## Do's and Don'ts

Manter foco visível, texto de estado, labels associados, botões semânticos, reduced-motion e dimensões utilizáveis no celular. Reutilizar componentes e tokens. Não substituir regras de dinheiro, permissão ou ciclo de vida na UI: consultar domínio e contrato REST. Não usar alert/confirm/prompt do navegador para decisões de produto.
