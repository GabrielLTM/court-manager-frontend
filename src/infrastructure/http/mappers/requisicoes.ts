import type {
  AtualizarClienteInput,
  AtualizarReservaDados,
  CriarReservaDados,
  NovoClienteInput,
  QuadraInput,
  RegistrarClienteInput,
} from '@/application/dto';
import { normalizeTime } from '@/shared/lib/time';
import type {
  AtualizarReservaRequisicao,
  ClienteRequisicao,
  CriarReservaRequisicao,
  QuadraRequisicao,
  RegistroRequisicao,
} from '../dto';

/** Entidades/entradas → corpo JSON das requisições (datas "YYYY-MM-DD", horários "HH:mm:ss"). */

const paraHoraApi = (hora: string) => `${normalizeTime(hora)}:00`;
export const paraDataApi = (data: string) => data.slice(0, 10);
const paraDataOpcional = (data: string | null) => (data ? paraDataApi(data) : null);

export function paraQuadraRequisicao(input: QuadraInput): QuadraRequisicao {
  return { nome: input.nome, tipo: input.tipo, valorHora: input.valorHora, status: input.status };
}

export function paraClienteRequisicao(
  input: NovoClienteInput | AtualizarClienteInput,
): ClienteRequisicao {
  return {
    nome: input.nome,
    cpf: input.cpf,
    telefone: input.telefone,
    email: input.email,
    dataNascimento: paraDataOpcional(input.dataNascimento),
    status: input.status,
    ...(input.senha ? { senha: input.senha } : {}),
  };
}

export function paraRegistroRequisicao(input: RegistrarClienteInput): RegistroRequisicao {
  return {
    nome: input.nome,
    cpf: input.cpf,
    telefone: input.telefone,
    email: input.email,
    dataNascimento: paraDataOpcional(input.dataNascimento),
    senha: input.senha,
  };
}

export function paraAtualizarReservaRequisicao(
  dados: AtualizarReservaDados,
): AtualizarReservaRequisicao {
  return {
    quadraId: dados.quadraId,
    data: paraDataApi(dados.data),
    horaInicio: paraHoraApi(dados.horaInicio),
    horaFim: paraHoraApi(dados.horaFim),
  };
}

export function paraCriarReservaRequisicao(dados: CriarReservaDados): CriarReservaRequisicao {
  return { clienteId: dados.clienteId, ...paraAtualizarReservaRequisicao(dados) };
}

/** Query string sem parâmetros vazios (`undefined`, `null` ou ""). */
export function paraParametros(filtro: object = {}): Record<string, string | number | boolean> {
  const parametros: Record<string, string | number | boolean> = {};
  for (const [chave, valor] of Object.entries(filtro)) {
    if (typeof valor === 'number' || typeof valor === 'boolean') parametros[chave] = valor;
    else if (typeof valor === 'string' && valor.trim() !== '') parametros[chave] = valor.trim();
  }
  return parametros;
}
