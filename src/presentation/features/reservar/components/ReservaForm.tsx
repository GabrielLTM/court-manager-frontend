import { useReducer, useState } from 'react';
import { useNavigate } from 'react-router';
import type { Quadra, Slot } from '@/domain/entities';
import { MetodoPagamento } from '@/domain/enums';
import {
  MOTIVO_INDISPONIBILIDADE_LABEL,
  gerarSlots,
  janelaDeReserva,
} from '@/domain/rules';
import { DateSelector } from '@/presentation/components/DateSelector/DateSelector';
import { useHoje } from '@/presentation/hooks/useHoje';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useAuth } from '@/presentation/providers/AuthContext';
import { useToast } from '@/presentation/providers/ToastContext';
import { useCriarReserva, useDisponibilidade } from '@/presentation/queries';
import { ROUTES } from '@/presentation/routes/paths';
import { formatDataLonga } from '@/shared/lib/date';
import {
  avisoQuadraIndisponivel,
  horarioSelecionavel,
  mensagemReservaCriada,
  montarNovaReserva,
  resolverQuadra,
  selecaoInicial,
  selecaoReducer,
  type ReservaPendente,
} from '../reservar.utils';
import { ConfirmarReservaDialog } from './ConfirmarReservaDialog';
import { DuracaoOpcoes } from './DuracaoOpcoes';
import { Etapa } from './Etapa';
import { HorariosDisponiveis } from './HorariosDisponiveis';
import { QuadraOpcoes } from './QuadraOpcoes';
import { ResumoReserva } from './ResumoReserva';
import styles from './ReservaForm.module.css';

/** Passos 1–4 + resumo + confirmação com pagamento (RF09, RF10, RF14). */
export function ReservaForm({ quadras }: { quadras: readonly Quadra[] }) {
  const { hoje, agora } = useHoje();
  const { usuario } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const criarReserva = useCriarReserva();

  const [selecao, dispatch] = useReducer(selecaoReducer, null, () => selecaoInicial(hoje, quadras));
  const [metodo, setMetodo] = useState<MetodoPagamento>(MetodoPagamento.Pix);
  const [pendente, setPendente] = useState<ReservaPendente | null>(null);

  const { data, duracaoMinutos } = selecao;
  const quadra = resolverQuadra(quadras, selecao.quadraId);
  const disponibilidade = useDisponibilidade(quadra?.id, data);
  const slots = disponibilidade.data
    ? gerarSlots({ quadra, data, duracaoMinutos, ocupados: disponibilidade.data.ocupados, agora })
    : null;
  const horaInicio = horarioSelecionavel(slots, selecao.horaInicio);

  const avisarQuadraIndisponivel = (alvo: Quadra) => toast.show(avisoQuadraIndisponivel(alvo));
  const avisarHorarioIndisponivel = (slot: Slot) =>
    toast.show(MOTIVO_INDISPONIBILIDADE_LABEL[slot.motivo ?? 'ocupado']);

  const abrirConfirmacao = () => {
    if (quadra && horaInicio) setPendente({ quadra, data, horaInicio, duracaoMinutos });
  };

  const confirmar = async () => {
    if (!pendente) return;
    const clienteId = usuario?.clienteId;
    if (typeof clienteId !== 'number') {
      toast.error('Somente clientes podem realizar reservas.');
      return;
    }
    try {
      const { reserva } = await criarReserva.mutateAsync(montarNovaReserva(pendente, clienteId, metodo));
      setPendente(null);
      toast.success(mensagemReservaCriada(reserva));
      navigate(ROUTES.minhasReservas);
    } catch (erro) {
      // RN04 e afins: o backend revalida; a disponibilidade é recarregada pela invalidação do cache.
      toast.error(getErrorMessage(erro));
      setPendente(null);
      dispatch({ tipo: 'horario', horaInicio: null });
    }
  };

  return (
    <div className={styles.layout}>
      <div className={styles.etapas}>
        <Etapa titulo="1. Data" complemento={`Selecionada: ${formatDataLonga(data)}`}>
          <DateSelector
            value={data}
            onChange={(novaData) => dispatch({ tipo: 'data', data: novaData })}
            inicio={hoje}
            min={hoje}
            max={janelaDeReserva(hoje).fim}
            nota="Reservas até 30 dias à frente"
          />
        </Etapa>

        <Etapa titulo="2. Quadra">
          <QuadraOpcoes
            quadras={quadras}
            selecionadaId={quadra?.id ?? null}
            onSelecionar={(escolhida) => dispatch({ tipo: 'quadra', quadraId: escolhida.id })}
            onIndisponivel={avisarQuadraIndisponivel}
          />
        </Etapa>

        <Etapa titulo="3. Duração">
          <DuracaoOpcoes
            value={duracaoMinutos}
            onChange={(minutos) => dispatch({ tipo: 'duracao', duracaoMinutos: minutos })}
          />
        </Etapa>

        <Etapa titulo="4. Horários disponíveis">
          <HorariosDisponiveis
            quadra={quadra}
            consulta={disponibilidade}
            slots={slots}
            selecionado={horaInicio}
            onSelecionar={(hora) => dispatch({ tipo: 'horario', horaInicio: hora })}
            onIndisponivel={avisarHorarioIndisponivel}
          />
        </Etapa>
      </div>

      <ResumoReserva
        quadra={quadra}
        data={data}
        horaInicio={horaInicio}
        duracaoMinutos={duracaoMinutos}
        onConfirmar={abrirConfirmacao}
      />

      {pendente && (
        <ConfirmarReservaDialog
          reserva={pendente}
          metodo={metodo}
          onMetodoChange={setMetodo}
          enviando={criarReserva.isPending}
          onConfirmar={() => void confirmar()}
          onClose={() => setPendente(null)}
        />
      )}
    </div>
  );
}
