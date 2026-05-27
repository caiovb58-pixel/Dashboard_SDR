import { SDR, Assessor, MatchResult } from './types';

/**
 * Distribui os assessores ativos de forma equilibrada (round-robin)
 * entre os SDRs ativos, ordenando os SDRs pela taxa de efetivação.
 * Também anexa os assessores exclusivos de SDRs ativos de forma direta.
 */
export function generateMatches(
  sdrs: SDR[],
  assessores: Assessor[]
): MatchResult[] {
  const activeSDRs = sdrs.filter(s => s.active);
  
  // Helper to extract exclusive SDR IDs for an assessor safely
  const getExclusiveSdrIds = (a: Assessor): string[] => {
    const ids: string[] = [];
    if (a.exclusiveSdrId) ids.push(a.exclusiveSdrId);
    if (a.exclusiveSdrIds && Array.isArray(a.exclusiveSdrIds)) {
      a.exclusiveSdrIds.forEach(id => {
        if (id && !ids.includes(id)) {
          ids.push(id);
        }
      });
    }
    return ids;
  };

  // Determine active exclusive assessores and get set of all exclusive SDR IDs
  const activeExclusiveAssessores = assessores.filter(a => {
    if (!a.active) return false;
    return getExclusiveSdrIds(a).length > 0;
  });

  const activeExclusiveSdrIds = new Set<string>();
  activeExclusiveAssessores.forEach(a => {
    getExclusiveSdrIds(a).forEach(id => {
      activeExclusiveSdrIds.add(id);
    });
  });

  // Assessores ativos que NÃO são exclusivos e participam do rodízio do mês atual
  const activeRotationAssessores = assessores.filter(
    a => a.active && getExclusiveSdrIds(a).length === 0 && (a.participatesInRotation !== false)
  );

  // SDRs ativos que NÃO possuem nenhuma relação exclusiva ativa (participam do rodízio)
  const activeRotationSDRs = activeSDRs.filter(s => !activeExclusiveSdrIds.has(s.id));

  const results: MatchResult[] = [];

  // 1. Distribuição Round-Robin para Assessores Livres (Rotação)
  if (activeRotationSDRs.length > 0 && activeRotationAssessores.length > 0) {
    // Ordena os SDRs da rotação pela melhor taxa de efetivação (descendente)
    const sortedSDRs = [...activeRotationSDRs].sort((a, b) => {
      const rateA = a.agendamentosCount > 0 ? (a.efetivacoesCount / a.agendamentosCount) : 0;
      const rateB = b.agendamentosCount > 0 ? (b.efetivacoesCount / b.agendamentosCount) : 0;
      return rateB - rateA;
    });

    activeRotationAssessores.forEach((assessor, index) => {
      const sdr = sortedSDRs[index % sortedSDRs.length];
      const rate = sdr.agendamentosCount > 0 
        ? Math.round((sdr.efetivacoesCount / sdr.agendamentosCount) * 100) 
        : 0;

      results.push({
        sdrId: sdr.id,
        sdrName: sdr.name,
        sdrConversionRate: rate,
        assessorId: assessor.id,
        assessorName: assessor.name,
        isExclusive: false
      });
    });
  }

  // 2. Anexa assessores exclusivos de SDRs ativos de forma estática
  activeExclusiveAssessores.forEach(assessor => {
    const sdrIds = getExclusiveSdrIds(assessor);
    sdrIds.forEach(sdrId => {
      const sdr = sdrs.find(s => s.id === sdrId);
      if (sdr && sdr.active) {
        const rate = sdr.agendamentosCount > 0
          ? Math.round((sdr.efetivacoesCount / sdr.agendamentosCount) * 100)
          : 0;
        
        results.push({
          sdrId: sdr.id,
          sdrName: sdr.name,
          sdrConversionRate: rate,
          assessorId: assessor.id,
          assessorName: assessor.name,
          isExclusive: true
        });
      }
    });
  });

  return results;
}
