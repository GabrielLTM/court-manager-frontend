import type { AxiosInstance } from 'axios';
import type { AuthGateway } from '@/application/ports';
import type { LoginRequisicao } from './dto';
import { mapearSessao } from './mappers/sessao';
import { paraRegistroRequisicao } from './mappers/requisicoes';

/** /api/auth — respostas `{ token, expiraEm?, usuario }` (ou apenas o JWT com os claims). */
export function createHttpAuthGateway(http: AxiosInstance): AuthGateway {
  return {
    login: async ({ email, senha }) => {
      const corpo: LoginRequisicao = { email, senha };
      return mapearSessao((await http.post<unknown>('/auth/login', corpo)).data);
    },
    registrar: async (dados) =>
      mapearSessao(
        (await http.post<unknown>('/auth/register', paraRegistroRequisicao(dados))).data,
      ),
  };
}
