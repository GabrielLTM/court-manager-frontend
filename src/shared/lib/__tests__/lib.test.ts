import { addDays, diffDays, formatDataCurta, formatDataLonga, formatMesAno } from '../date';
import { formatBRL, formatCodigoReserva, formatDuracao, formatDuracaoLonga, iniciais, parseDecimal } from '../format';
import { maskCpf, maskTelefone } from '../masks';
import { addMinutes, normalizeTime, toMinutes } from '../time';

describe('date', () => {
  it('soma dias atravessando meses e calcula diferenças', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(diffDays('2026-10-19', '2026-09-20')).toBe(29);
  });
  it('formata datas no padrão brasileiro', () => {
    expect(formatDataCurta('2026-09-20')).toBe('20/09');
    expect(formatDataLonga('2026-09-20')).toBe('20/09/2026');
    expect(formatMesAno('2026-09-20')).toBe('Setembro 2026');
  });
});

describe('time', () => {
  it('converte horários', () => {
    expect(toMinutes('19:30')).toBe(1170);
    expect(addMinutes('18:00', 90)).toBe('19:30');
    expect(normalizeTime('19:00:00')).toBe('19:00');
  });
});

describe('format', () => {
  it('formata moeda, duração e código da reserva', () => {
    expect(formatBRL(142.5)).toBe('R$ 142,50');
    expect(formatDuracao(90)).toBe('1h30');
    expect(formatDuracao(120)).toBe('2h');
    expect(formatDuracaoLonga(60)).toBe('1 hora');
    expect(formatDuracaoLonga(120)).toBe('2 horas');
    expect(formatCodigoReserva(1041)).toBe('RSV-1041');
    expect(iniciais('Isadora Oliveira')).toBe('IO');
  });
  it('interpreta valores decimais em formato brasileiro', () => {
    expect(parseDecimal('80,50')).toBe(80.5);
    expect(parseDecimal('1.240,00')).toBe(1240);
    expect(Number.isNaN(parseDecimal(''))).toBe(true);
  });
});

describe('masks', () => {
  it('aplica máscaras progressivas', () => {
    expect(maskCpf('01234567890')).toBe('012.345.678-90');
    expect(maskCpf('0123')).toBe('012.3');
    expect(maskTelefone('51998124477')).toBe('(51) 99812-4477');
    expect(maskTelefone('5133334444')).toBe('(51) 3333-4444');
  });
});
