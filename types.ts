export interface SDRMonthlyRecord {
  agendamentosCount: number;
  efetivacoesCount: number;
  metaAgendamentos: number;
  metaEfetivacaoRate: number;
}

export interface SDR {
  id: string;
  name: string;
  agendamentosCount: number; // Número de agendamentos (default/legacy)
  efetivacoesCount: number; // Número de efetivações (default/legacy)
  metaAgendamentos: number; // Meta de agendamentos para o SDR (default/legacy)
  metaEfetivacaoRate: number; // Meta de taxa de efetivação para o SDR (ex: 60 para 60%) (default/legacy)
  active: boolean;
  admissionDate?: string; // Data de admissão do SDR
  team?: string; // Equipe à qual o SDR pertence
  monthlyRecords?: { [monthKey: string]: SDRMonthlyRecord }; // Histórico de metas e entregas mensais
}

export interface Assessor {
  id: string;
  name: string;
  active: boolean;
  agendaLink?: string; // Link da agenda (ex: Calendly)
  exclusiveSdrId?: string; // Legacy parameter (optional)
  exclusiveSdrIds?: string[]; // IDs dos SDRs se for assessor exclusivo (permite mais de 1)
  participatesInRotation?: boolean; // Se participa do rodízio ativo no mês corrent
  team?: string; // Equipe à qual o assessor pertence
}

export interface TeamLeader {
  id: string;
  teamName: string;
  leaderTitle: string;
  passcode: string;
  name: string;
}

export interface MatchResult {
  sdrId: string;
  sdrName: string;
  sdrConversionRate: number;
  assessorId: string;
  assessorName: string;
  startDate?: string;
  endDate?: string;
  isExclusive?: boolean;
}
