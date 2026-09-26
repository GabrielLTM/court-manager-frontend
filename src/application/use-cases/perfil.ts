import type { SessionStore } from '@/application/ports';
import type { PerfilService } from '@/application/services';
import type { Cliente } from '@/domain/entities';
import { toISODate } from '@/shared/lib/date';
import type { AppDependencies } from './dependencies';
import { exigirClienteLogado } from './sessao';
import { normalizarDadosCliente, validarDadosCliente } from './validarDadosCliente';

/** RF02 — o cliente logado consulta e atualiza os próprios dados. */
export function createPerfilService({
  clienteRepository,
  sessionStore,
  clock,
}: AppDependencies): PerfilService {
  return {
    obter: async () => {
      const { clienteId } = exigirClienteLogado(sessionStore);
      return clienteRepository.obterPorId(clienteId);
    },
    atualizar: async (input) => {
      const { clienteId } = exigirClienteLogado(sessionStore);
      validarDadosCliente(input, { exigirSenha: false, hoje: toISODate(clock.now()) });
      // O status do cadastro só é alterado pelo administrador: reenviamos o valor atual.
      const atual = await clienteRepository.obterPorId(clienteId);
      const atualizado = await clienteRepository.atualizar(clienteId, {
        ...normalizarDadosCliente(input),
        status: atual.status,
        ...(input.senha ? { senha: input.senha } : {}),
      });
      sincronizarSessao(sessionStore, atualizado);
      return atualizado;
    },
  };
}

/** Mantém nome/e-mail exibidos no cabeçalho iguais aos dados recém-salvos. */
function sincronizarSessao(sessionStore: SessionStore, cliente: Cliente): void {
  const sessao = sessionStore.get();
  if (!sessao || sessao.usuario.clienteId !== cliente.id) return;
  if (sessao.usuario.nome === cliente.nome && sessao.usuario.email === cliente.email) return;
  sessionStore.set({
    ...sessao,
    usuario: { ...sessao.usuario, nome: cliente.nome, email: cliente.email },
  });
}
