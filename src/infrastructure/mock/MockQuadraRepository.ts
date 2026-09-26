import type { QuadraInput } from '@/application/dto';
import type { QuadraRepository } from '@/application/ports';
import type { Quadra } from '@/domain/entities';
import { StatusQuadra, STATUS_QUADRA_VALUES } from '@/domain/enums';
import { DomainError } from '@/domain/errors/DomainError';
import { intervalosOcupados, REGRAS_RESERVA, validarDadosQuadra } from '@/domain/rules';
import { isISODate } from '@/shared/lib/date';
import { buscarQuadra, porId, proximoId } from './consultas';
import type { ContextoMock } from './contexto';

/** /api/quadras — leitura para qualquer usuário autenticado; escrita só do administrador. */
export function createMockQuadraRepository({
  executar,
  autorizacao,
}: ContextoMock): QuadraRepository {
  return {
    listar: () =>
      executar((dados) => {
        autorizacao.autenticar();
        return [...dados.quadras].sort(porId);
      }),
    obterPorId: (id) =>
      executar((dados) => {
        autorizacao.autenticar();
        return buscarQuadra(dados, id);
      }),
    criar: (input) =>
      executar((dados) => {
        autorizacao.exigirAdministrador();
        const quadra: Quadra = { id: proximoId(dados.quadras), ...validarQuadra(input) };
        dados.quadras.push(quadra);
        return quadra;
      }),
    atualizar: (id, input) =>
      executar((dados) => {
        autorizacao.exigirAdministrador();
        const quadra = buscarQuadra(dados, id);
        Object.assign(quadra, validarQuadra(input));
        return quadra;
      }),
    inativar: (id) =>
      executar((dados) => {
        autorizacao.exigirAdministrador();
        buscarQuadra(dados, id).status = StatusQuadra.Inativa;
      }),
    consultarDisponibilidade: (quadraId, data) =>
      executar((dados) => {
        autorizacao.autenticar();
        buscarQuadra(dados, quadraId);
        if (!isISODate(data)) throw new DomainError('VALIDACAO', 'Data inválida.');
        // RN09: reservas canceladas não ocupam horário. O retorno não expõe quem reservou.
        return {
          quadraId,
          data,
          abertura: REGRAS_RESERVA.abertura,
          fechamento: REGRAS_RESERVA.fechamento,
          ocupados: intervalosOcupados(dados.reservas, quadraId, data),
        };
      }),
  };
}

function validarQuadra(input: QuadraInput): QuadraInput {
  validarDadosQuadra(input);
  if (!STATUS_QUADRA_VALUES.includes(input.status))
    throw new DomainError('VALIDACAO', 'Status da quadra inválido.');
  return {
    nome: input.nome.trim(),
    tipo: input.tipo.trim(),
    valorHora: Math.round(input.valorHora * 100) / 100,
    status: input.status,
  };
}
