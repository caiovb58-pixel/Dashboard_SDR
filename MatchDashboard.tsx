import React, { useState } from 'react';
import { SDR, Assessor, MatchResult } from '../types';
import { calculateGoalProgress } from '../goalMetrics';
import { 
  Sparkles, UserCheck, Shield, ChevronRight, Play, HelpCircle, 
  Download, Calendar, AlertCircle, ArrowUpRight, Award, Flame, Gauge, 
  Settings, ArrowRight 
} from 'lucide-react';

interface MatchDashboardProps {
  sdrs: SDR[];
  assessores: Assessor[];
  matches: MatchResult[];
  onGenerateMatches: () => void;
  startDate: string;
  endDate: string;
  currentMonth: string;
  onUpdateStartDate: (date: string) => void;
  onUpdateEndDate: (date: string) => void;
  onUpdateMatchDates?: (sdrId: string, assessorId: string, startDate: string, endDate: string) => void;
}

export default function MatchDashboard({
  sdrs,
  assessores,
  matches,
  onGenerateMatches,
  startDate,
  endDate,
  currentMonth,
  onUpdateStartDate,
  onUpdateEndDate,
  onUpdateMatchDates,
}: MatchDashboardProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null); // 'sdrId-assessorId'
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  const handleSaveDates = (sdrId: string, assessorId: string) => {
    if (onUpdateMatchDates) {
      onUpdateMatchDates(sdrId, assessorId, tempStartDate, tempEndDate);
    }
    setEditingKey(null);
  };

  const activeSDRsCount = sdrs.filter(s => s.active).length;
  const activeAssessoresCount = assessores.filter(a => a.active).length;

  const formatDateVal = (dateStr: string) => {
    if (!dateStr) return 'Não definida';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Export report containing relations with active periods
  const handleDownloadMatchesReport = () => {
    if (matches.length === 0) return;

    let report = `========================================================\n`;
    report += `💼 RELATÓRIO OFICIAL DE DISTRIBUIÇÃO SDR-ASSESSOR\n`;
    report += `🗓️ PERÍODO DO RODÍZIO: de ${formatDateVal(startDate)} a ${formatDateVal(endDate)}\n`;
    report += `========================================================\n`;
    report += `📅 Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
    report += `SDRs Participantes Ativos: ${activeSDRsCount}\n`;
    report += `Conexões de Assessoria: ${matches.length}\n`;
    report += `--------------------------------------------------------\n\n`;
    
    report += `🔗 RELAÇÕES DETERMINADAS:\n\n`;
    matches.forEach((m, idx) => {
      const sdrObj = sdrs.find(s => s.id === m.sdrId);
      const sdrRate = sdrObj 
        ? (sdrObj.agendamentosCount > 0 ? Math.round((sdrObj.efetivacoesCount / sdrObj.agendamentosCount) * 100) : 0)
        : m.sdrConversionRate;
      
      const relationshipType = m.isExclusive ? "💎 VÍNCULO EXCLUSIVO (ESTÁTICO)" : "🔄 NO RODÍZIO DO MÊS";
      report += ` [${idx + 1}] SDR: ${m.sdrName.padEnd(20)} ➔ Assessor: ${m.assessorName}\n`;
      report += `      Tipo de Conexão: ${relationshipType}\n`;
      report += `      Período Base: de ${formatDateVal(m.startDate || startDate)} até ${formatDateVal(m.endDate || endDate)}\n`;
      report += `      (Efetivação Corrente de SDR: ${sdrRate}%)\n\n`;
    });

    report += `--------------------------------------------------------\n`;
    report += `Diretrizes do Mês:\n`;
    report += `- Recomenda-se manter o acompanhamento semanal dos novos parceiros.\n`;
    report += `- Esta relação define o fluxo de agendamento autorizado para o período acima.\n`;
    report += `========================================================\n`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rodizio_sdr_assessor_${startDate}_a_${endDate}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic monthly tips and warnings engine for SDR Directioning
  const getDynamicMonthlyTips = (): { type: 'danger' | 'warning' | 'star' | 'normal'; text: string; details: string }[] => {
    const list: { type: 'danger' | 'warning' | 'star' | 'normal'; text: string; details: string }[] = [];

    const activeSDRs = sdrs.filter(s => s.active);
    
    activeSDRs.forEach(sdr => {
      const rate = sdr.agendamentosCount > 0 ? Math.round((sdr.efetivacoesCount / sdr.agendamentosCount) * 100) : 0;
      
      // If conversion is below goal
      if (sdr.agendamentosCount >= 5 && rate < (sdr.metaEfetivacaoRate || 50)) {
        list.push({
          type: 'warning',
          text: `Atenção na conversividade: ${sdr.name}`,
          details: `Aproveitamento de leads de ${rate}% (meta: ${sdr.metaEfetivacaoRate || 50}%). Reorganize scripts telefônicos e alinhe abordagens.`
        });
      }

      // High performer indicator
      if (sdr.agendamentosCount >= 5 && rate >= 70) {
        list.push({
          type: 'star',
          text: `Performance Premium: ${sdr.name}`,
          details: `Incrível taxa de ${rate}% de efetividade ativa no mês! Excelente benchmark para treinamento de squad.`
        });
      }

      // Below the expected target for today in the selected month
      const sdrProgress = calculateGoalProgress([sdr], currentMonth);
      if (sdr.agendamentosCount < sdrProgress.expectedRealizedToday && sdrProgress.progressGap < -10) {
        list.push({
          type: 'danger',
          text: `Alerta de Volume de Leads: ${sdr.name}`,
          details: `Apenas ${sdr.agendamentosCount} agendamentos frente ao alvo de ${sdrProgress.expectedRealizedToday} para hoje. Priorize cadencia e repescagem.`
        });
      }
    });

    if (list.length === 0) {
      list.push({
        type: 'normal',
        text: 'Desempenho Geral do Time Padrão',
        details: 'Todos os SDRs cadastrados ativos mantêm consistência saudável e regular nas taxas de repasse comercial.'
      });
    }

    return list.slice(0, 4);
  };

  const adviceItems = getDynamicMonthlyTips();

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Date settings and action panel (Offwhite & Crisp Minimal Theme) */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 relative space-y-6 shadow-sm">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          <div className="space-y-1 text-left">
            <h2 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2 font-display">
              <Sparkles className="w-5 h-5 text-neutral-800" />
              Distribuição e Alocação Estratégica dos Leads
            </h2>
            <p className="text-xs text-neutral-500 max-w-xl">
              Equilibre automaticamente os <strong className="text-black font-semibold">{activeAssessoresCount} Assessores ativos</strong> entre os <strong className="text-black font-semibold">{activeSDRsCount} SDRs disponíveis</strong> usando o algoritmo de rodízio balanceado por proximidade operacional.
            </p>
          </div>

          <button
            onClick={onGenerateMatches}
            disabled={activeSDRsCount === 0 || activeAssessoresCount === 0}
            className="w-full lg:w-auto px-5 py-3 bg-black hover:bg-neutral-900 border border-black text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current text-white" />
            Distribuir Novo Rodízio de Parcerias
          </button>
        </div>

        {/* Date parameters */}
        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-600" />
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Período Fiscal do Rodízio</span>
          </div>

          <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
            <div>
              <label className="block text-[9px] font-bold text-neutral-450 uppercase mb-1">
                Data de Início (Gera +30 dias)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => onUpdateStartDate(e.target.value)}
                className="w-full bg-white border border-neutral-250 rounded-lg text-xs text-neutral-800 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-neutral-450 uppercase mb-1">
                Data de Término Comercial
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => onUpdateEndDate(e.target.value)}
                className="w-full bg-white border border-neutral-250 rounded-lg text-xs text-neutral-800 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic monthly recommendations */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-2xs">
        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 font-display">
          <Gauge className="w-4.5 h-4.5 text-neutral-800" />
          Análise de Risco & Desvios Operacionais
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {adviceItems.map((advice, i) => (
            <div 
              key={i} 
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                advice.type === 'danger' 
                  ? 'bg-red-50/50 border-red-200' 
                  : advice.type === 'warning' 
                    ? 'bg-amber-50/55 border-amber-205'
                    : advice.type === 'star'
                      ? 'bg-neutral-50 border-neutral-300'
                      : 'bg-neutral-50/20 border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {advice.type === 'danger' && <AlertCircle className="w-4.5 h-4.5 text-red-650" />}
                {advice.type === 'warning' && <AlertCircle className="w-4.5 h-4.5 text-amber-600" />}
                {advice.type === 'star' && <Flame className="w-4.5 h-4.5 text-neutral-900 animate-pulse" />}
                {advice.type === 'normal' && <ArrowUpRight className="w-4.5 h-4.5 text-neutral-450" />}
                
                <h4 className="text-[11px] font-bold text-neutral-850 truncate leading-none">
                  {advice.text}
                </h4>
              </div>
              <p className="text-[11px] text-neutral-500 leading-normal">
                {advice.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pairing Connections Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-neutral-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center gap-2 font-display">
              <UserCheck className="w-4.5 h-4.5 text-neutral-800" />
              Pareamentos Ativos Definidos para o Período
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Conexões operacionais autorizadas de comissionamento de carteira.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {matches.length > 0 && (
              <button
                onClick={handleDownloadMatchesReport}
                className="px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-250 text-neutral-800 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Descarregar relatório como TXT"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar TXT
              </button>
            )}
            
            <span className="bg-neutral-100 text-neutral-900 border border-neutral-250 px-3 py-2 rounded-xl text-[11px] font-bold font-mono">
              CONNECTIONS: {matches.length}
            </span>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-16 bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-250">
            <UserCheck className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Sem mapeamentos vigentes</h3>
            <p className="text-xs text-neutral-455 mt-1 max-w-sm mx-auto leading-relaxed">
              Clique em <strong className="text-black font-extrabold">"Distribuir Novo Rodízio de Parcerias"</strong> para gerar o pareamento dos Assessores.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, idx) => {
              const sdrObj = sdrs.find(s => s.id === match.sdrId);
              const assrObj = assessores.find(a => a.id === match.assessorId);
              
              const conversionRate = sdrObj 
                ? (sdrObj.agendamentosCount > 0 ? Math.round((sdrObj.efetivacoesCount / sdrObj.agendamentosCount) * 100) : 0)
                : match.sdrConversionRate;
              
              const isGoalExceeded = sdrObj && sdrObj.agendamentosCount >= sdrObj.metaAgendamentos && conversionRate >= sdrObj.metaEfetivacaoRate;
              const isExclusiveMatch = match.isExclusive || (assrObj && !!assrObj.exclusiveSdrId);

              return (
                <div 
                  key={`${match.sdrId}-${match.assessorId}-${idx}`}
                  className={`border rounded-xl transition-all overflow-hidden ${
                    isExclusiveMatch 
                      ? 'border-neutral-350 bg-neutral-50/50' 
                      : 'border-neutral-200 bg-white hover:border-neutral-400'
                  }`}
                >
                  <div className="p-5 flex flex-col gap-4">
                    
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-100 text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-wider">
                      <span>Relação #{idx + 1}</span>
                      {isExclusiveMatch ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-350 text-[9px] font-bold text-amber-800 uppercase">
                          💎 Exclusividade direta (Fora de rodízio)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[9px] font-bold text-neutral-700 uppercase">
                          🔄 Alocado por Rodízio
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-3">
                      
                      {/* SDR Side */}
                      <div className="md:col-span-5 p-4 bg-white rounded-lg border border-neutral-200 flex items-center justify-between relative shadow-2xs">
                        {isGoalExceeded && (
                          <span className="absolute right-2 top-2 bg-neutral-100 text-neutral-900 border border-neutral-300 text-[8px] font-black uppercase px-1 rounded">
                            Meta OK ⭐
                          </span>
                        )}
                        <div>
                          <div className="text-[8px] text-neutral-400 uppercase tracking-widest font-black flex items-center gap-1 mb-1">
                            <Shield className="w-3 h-3 text-neutral-400" />
                            SDR Alocado
                          </div>
                          <div className="font-bold text-neutral-900 text-xs">
                            {match.sdrName}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono mt-1">
                            Agendamentos: {sdrObj?.agendamentosCount ?? 0} &bull; Team: {sdrObj?.team || 'Geral'}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[8px] block text-neutral-400 font-bold uppercase tracking-wider">Mesa Conv.</span>
                          <span className="text-neutral-900 font-mono font-bold text-xs bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                            {conversionRate}%
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-1 flex justify-center text-neutral-350">
                        <ChevronRight className="w-4 h-4 transform rotate-90 md:rotate-0" />
                      </div>

                      {/* Assessor Side */}
                      <div className={`md:col-span-5 p-4 rounded-lg border shadow-2xs ${
                        isExclusiveMatch ? 'bg-neutral-100/40 border-neutral-300' : 'bg-neutral-50 border-neutral-200'
                      }`}>
                        <div className="text-[8px] uppercase tracking-widest font-black flex items-center justify-between mb-1 text-neutral-400">
                          <span>Assessor Alocado</span>
                          {assrObj?.agendaLink && (
                            <a 
                              href={assrObj.agendaLink.startsWith('http') ? assrObj.agendaLink : `https://${assrObj.agendaLink}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[9px] font-black hover:underline text-neutral-800 uppercase flex items-center gap-0.5"
                            >
                              Link Agenda 🔗
                            </a>
                          )}
                        </div>
                        <div className="font-bold text-neutral-900 text-xs">
                          {match.assessorName}
                        </div>
                        <div className="text-[9px] text-neutral-400 mt-1 flex justify-between items-center gap-2 font-mono">
                          <span>Sincronização ativada</span>
                          {assrObj?.agendaLink && (
                            <span className="text-[9px] text-neutral-500 max-w-[150px] truncate select-all" title={assrObj.agendaLink}>
                              {assrObj.agendaLink}
                            </span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Target End date modified auto calculates exactly +30 days */}
                    <div className="mt-1 pt-2 border-t border-neutral-100 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 bg-neutral-50 px-3 py-2 rounded-lg text-xs text-neutral-600">
                      <div className="flex flex-wrap items-center gap-1.5 font-sans">
                        <span>📅</span>
                        <span>Vigência da Alocação:</span>
                        <span className="font-bold text-neutral-850">
                          {formatDateVal(match.startDate || startDate)}
                        </span>
                        <span>a</span>
                        <span className="font-black text-black bg-neutral-200 px-1.5 py-0.5 rounded border border-neutral-300">
                          {formatDateVal(match.endDate || endDate)}
                        </span>
                      </div>

                      {onUpdateMatchDates && (
                        <div className="w-full xl:w-auto flex justify-end">
                          {editingKey === `${match.sdrId}-${match.assessorId}` ? (
                            <div className="flex flex-wrap items-center gap-2 bg-white border border-neutral-250 p-2 rounded-lg shadow-xs z-10 animate-fade-in">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-neutral-400 font-bold uppercase">De:</span>
                                <input
                                  type="date"
                                  value={tempStartDate}
                                  onChange={e => {
                                    const nextV = e.target.value;
                                    setTempStartDate(nextV);
                                    if (nextV) {
                                      const d = new Date(nextV + 'T12:00:00');
                                      d.setDate(d.getDate() + 30);
                                      setTempEndDate(d.toISOString().substring(0, 10));
                                    }
                                  }}
                                  className="bg-neutral-50 border border-neutral-350 rounded px-1.5 py-1 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black font-mono w-28 cursor-pointer"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-neutral-450 font-bold uppercase">Até (Auto 30d):</span>
                                <input
                                  type="date"
                                  value={tempEndDate}
                                  onChange={e => setTempEndDate(e.target.value)}
                                  className="bg-neutral-100 border border-neutral-250 rounded px-1.5 py-1 text-xs text-neutral-500 font-mono w-28 cursor-not-allowed"
                                  disabled
                                />
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleSaveDates(match.sdrId, match.assessorId)}
                                  className="px-2 py-1 bg-black text-white text-[10px] font-bold rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                                >
                                  Gravar
                                </button>
                                <button
                                  onClick={() => setEditingKey(null)}
                                  className="px-2 py-1 bg-neutral-150 text-neutral-600 text-[10px] font-bold rounded hover:bg-neutral-250 transition-colors cursor-pointer"
                                >
                                  X
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingKey(`${match.sdrId}-${match.assessorId}`);
                                setTempStartDate(match.startDate || startDate);
                                setTempEndDate(match.endDate || endDate);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 transition-all cursor-pointer flex items-center gap-1"
                            >
                              Editar Datas 🗓️
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
