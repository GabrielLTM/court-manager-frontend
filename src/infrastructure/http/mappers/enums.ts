import {
  MetodoPagamento,
  Perfil,
  StatusCliente,
  StatusPagamento,
  StatusQuadra,
  StatusReserva,
} from '@/domain/enums';

/**
 * Enums podem chegar como número (padrão do System.Text.Json), string numérica ou nome
 * (JsonStringEnumConverter) — com ou sem acento, em qualquer caixa e com sinônimos usuais
 * (o StatusQuadra do backend usa "Ativo"/"Inativo"). Alguns modelos atuais usam `bool Status`.
 */

const normalizarRotulo = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

interface Booleano<T> {
  verdadeiro: T;
  falso: T;
}

function criarLeitor<T extends number>(
  valores: Record<string, T>,
  sinonimos: Record<string, T>,
  booleano?: Booleano<T>,
): (valor: unknown) => T | null {
  const validos = Object.values(valores);
  const porNome = new Map<string, T>();
  for (const [nome, valor] of Object.entries(valores)) porNome.set(normalizarRotulo(nome), valor);
  for (const [nome, valor] of Object.entries(sinonimos)) porNome.set(normalizarRotulo(nome), valor);
  const porNumero = (numero: number) => validos.find((v) => v === numero) ?? null;

  return (valor) => {
    if (typeof valor === 'number') return porNumero(valor);
    if (typeof valor === 'boolean')
      return booleano ? (valor ? booleano.verdadeiro : booleano.falso) : null;
    if (typeof valor !== 'string') return null;
    const texto = valor.trim();
    if (/^\d+$/.test(texto)) return porNumero(Number(texto));
    return porNome.get(normalizarRotulo(texto)) ?? null;
  };
}

export const lerStatusCliente = criarLeitor<StatusCliente>(
  StatusCliente,
  { Ativa: StatusCliente.Ativo, Inativa: StatusCliente.Inativo },
  { verdadeiro: StatusCliente.Ativo, falso: StatusCliente.Inativo },
);

export const lerStatusQuadra = criarLeitor<StatusQuadra>(
  StatusQuadra,
  {
    Ativo: StatusQuadra.Ativa,
    Disponivel: StatusQuadra.Ativa,
    Inativo: StatusQuadra.Inativa,
    'Em manutenção': StatusQuadra.Manutencao,
  },
  { verdadeiro: StatusQuadra.Ativa, falso: StatusQuadra.Inativa },
);

export const lerStatusReserva = criarLeitor<StatusReserva>(StatusReserva, {
  Confirmado: StatusReserva.Confirmada,
  Cancelado: StatusReserva.Cancelada,
  Concluído: StatusReserva.Concluida,
  Finalizada: StatusReserva.Concluida,
});

export const lerStatusPagamento = criarLeitor<StatusPagamento>(
  StatusPagamento,
  {
    Paga: StatusPagamento.Pago,
    Aprovado: StatusPagamento.Pago,
    Cancelada: StatusPagamento.Cancelado,
    Estornada: StatusPagamento.Estornado,
    Reembolsado: StatusPagamento.Estornado,
  },
  { verdadeiro: StatusPagamento.Pago, falso: StatusPagamento.Pendente },
);

export const lerMetodoPagamento = criarLeitor<MetodoPagamento>(MetodoPagamento, {
  'Cartão de crédito': MetodoPagamento.Cartao,
  'Cartão de débito': MetodoPagamento.Cartao,
  Credito: MetodoPagamento.Cartao,
  Debito: MetodoPagamento.Cartao,
  Especie: MetodoPagamento.Dinheiro,
});

const PERFIS: Record<string, Perfil> = {
  cliente: Perfil.Cliente,
  administrador: Perfil.Administrador,
  admin: Perfil.Administrador,
};

/** Perfil em texto ou lista de roles (claims com várias roles): Administrador prevalece. */
export function lerPerfil(valor: unknown): Perfil | null {
  if (Array.isArray(valor)) {
    const perfis = valor.map(lerPerfil);
    if (perfis.includes(Perfil.Administrador)) return Perfil.Administrador;
    return perfis.includes(Perfil.Cliente) ? Perfil.Cliente : null;
  }
  return typeof valor === 'string' ? (PERFIS[normalizarRotulo(valor)] ?? null) : null;
}
