/**
 * Mensagens exibidas ao usuário que são compartilhadas entre os casos de uso e os adaptadores
 * (API HTTP e backend simulado), garantindo o mesmo texto nos dois modos de execução.
 */
export const MENSAGENS = {
  sessaoExpirada: 'Sua sessão expirou. Entre novamente.',
  acessoNegado: 'Você não tem permissão para realizar esta operação.',
  areaDoCliente: 'Esta área é exclusiva para clientes.',
  credenciaisInvalidas: 'E-mail ou senha inválidos.',
  cadastroInativo: 'Cadastro inativo. Procure a administração da arena.',
  pagamentoNaoPendente: 'Somente pagamentos pendentes podem ser confirmados.',
  pagamentoNaoRegistrado:
    'Reserva criada, mas o pagamento não foi registrado. Tente novamente em Minhas reservas.',
  metodoPagamentoInvalido: 'Selecione uma forma de pagamento válida.',
} as const;
