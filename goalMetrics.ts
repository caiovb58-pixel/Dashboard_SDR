import { SDR } from './types';

export interface GoalProgressStats {
  realizedProgress: number;
  expectedProgress: number;
  progressGap: number;
  temperature: string;
  labelColor: string;
  barColor: string;
  currentDaysElapsed: number;
  totalDaysInMonth: number;
  remainingDays: number;
  totalRealized: number;
  totalTarget: number;
  expectedRealizedToday: number;
  remainingToGoal: number;
  requiredDailyPace: number;
  currentDailyPace: number;
  projectedTotal: number;
  conversionRate: number;
  targetEfetivacoes: number;
  totalEfetivacoes: number;
  efetuacaoProgress: number;
}

const round = (value: number) => Math.round(value);
const roundOneDecimal = (value: number) => Math.round(value * 10) / 10;

export function calculateGoalProgress(
  sdrs: SDR[],
  monthKey: string,
  today: Date = new Date()
): GoalProgressStats {
  const activeSdrs = sdrs.filter(s => s.active);
  const [year, month] = monthKey.split('-').map(Number);
  const totalDays = year && month ? new Date(year, month, 0).getDate() : 30;

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  let elapsedDays = totalDays;
  if (year === currentYear && month === currentMonth) {
    elapsedDays = Math.min(currentDay, totalDays);
  } else if (year > currentYear || (year === currentYear && month > currentMonth)) {
    elapsedDays = 0;
  }

  const totalRealized = activeSdrs.reduce((sum, s) => sum + (s.agendamentosCount || 0), 0);
  const totalTarget = activeSdrs.reduce((sum, s) => sum + (s.metaAgendamentos ?? 20), 0);
  const totalEfetivacoes = activeSdrs.reduce((sum, s) => sum + (s.efetivacoesCount || 0), 0);
  const targetEfetivacoes = round(activeSdrs.reduce(
    (sum, s) => sum + ((s.metaAgendamentos ?? 20) * ((s.metaEfetivacaoRate ?? 50) / 100)),
    0
  ));

  const expectedProgress = totalDays > 0 ? round((elapsedDays / totalDays) * 100) : 0;
  const realizedProgress = totalTarget > 0 ? round((totalRealized / totalTarget) * 100) : 0;
  const progressGap = realizedProgress - expectedProgress;
  const remainingDays = Math.max(totalDays - elapsedDays, 0);
  const expectedRealizedToday = totalTarget > 0 ? round((totalTarget * expectedProgress) / 100) : 0;
  const remainingToGoal = Math.max(totalTarget - totalRealized, 0);
  const requiredDailyPace = remainingDays > 0 ? roundOneDecimal(remainingToGoal / remainingDays) : remainingToGoal;
  const currentDailyPace = elapsedDays > 0 ? roundOneDecimal(totalRealized / elapsedDays) : 0;
  const projectedTotal = round(currentDailyPace * totalDays);
  const conversionRate = totalRealized > 0 ? round((totalEfetivacoes / totalRealized) * 100) : 0;
  const efetuacaoProgress = targetEfetivacoes > 0 ? round((totalEfetivacoes / targetEfetivacoes) * 100) : 0;

  let temperature = 'EM EQUILIBRIO';
  let labelColor = 'text-blue-700 bg-blue-50 border-blue-200';
  let barColor = 'bg-[#111]';

  if (realizedProgress >= 100) {
    temperature = 'META BATIDA';
    labelColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    barColor = 'bg-emerald-600';
  } else if (progressGap >= 10) {
    temperature = 'RITMO EM ALTA';
    labelColor = 'text-green-800 bg-green-50 border-green-200';
    barColor = 'bg-green-600';
  } else if (progressGap <= -20) {
    temperature = 'ALERTA CRITICO';
    labelColor = 'text-red-700 bg-red-50 border-red-200';
    barColor = 'bg-red-600';
  } else if (progressGap < 0) {
    temperature = 'RITMO COM ATRASO';
    labelColor = 'text-amber-800 bg-amber-50 border-amber-200';
    barColor = 'bg-amber-600';
  }

  return {
    realizedProgress,
    expectedProgress,
    progressGap,
    temperature,
    labelColor,
    barColor,
    currentDaysElapsed: elapsedDays,
    totalDaysInMonth: totalDays,
    remainingDays,
    totalRealized,
    totalTarget,
    expectedRealizedToday,
    remainingToGoal,
    requiredDailyPace,
    currentDailyPace,
    projectedTotal,
    conversionRate,
    targetEfetivacoes,
    totalEfetivacoes,
    efetuacaoProgress,
  };
}
