import type { Clock } from '@/application/ports';
import { statusEfetivoDaReserva } from '@/domain/rules';
import type { AutorizacaoMock } from './autorizacao';
import type { BancoMock } from './banco';
import type { DadosMock } from './tipos';

/** O que cada repositório simulado recebe para atender uma "requisição". */
export interface ContextoMock {
  /**
   * Simula uma chamada à API: aguarda a latência e executa a operação numa transação atômica,
   * devolvendo uma cópia profunda do resultado (nada do "servidor" vaza por referência).
   */
  executar<T>(operacao: (dados: DadosMock, agora: Date) => T): Promise<T>;
  autorizacao: AutorizacaoMock;
}

export function criarContextoMock(opcoes: {
  banco: BancoMock;
  clock: Clock;
  autorizacao: AutorizacaoMock;
  aguardar: () => Promise<void>;
}): ContextoMock {
  const { banco, clock, autorizacao, aguardar } = opcoes;
  return {
    autorizacao,
    executar: async (operacao) => {
      await aguardar();
      const agora = clock.now();
      return banco.transacao((dados) => {
        atualizarStatusEfetivo(dados, agora);
        return operacao(dados, agora);
      });
    },
  };
}

/** Reserva Confirmada cujo horário já terminou passa a Concluída (persistido a cada acesso). */
function atualizarStatusEfetivo(dados: DadosMock, agora: Date): void {
  for (const reserva of dados.reservas) reserva.status = statusEfetivoDaReserva(reserva, agora);
}
