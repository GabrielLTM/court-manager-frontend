import { MetodoPagamento } from '@/domain/enums';

/** Texto de apoio exibido abaixo das opções de pagamento (pagamento simulado — seção 7.4). */
export function ajudaMetodoPagamento(metodo: MetodoPagamento): string {
  return metodo === MetodoPagamento.Dinheiro
    ? 'Pague na arena; o administrador confirma o recebimento.'
    : 'Pagamento simulado — aprovado na hora.';
}
