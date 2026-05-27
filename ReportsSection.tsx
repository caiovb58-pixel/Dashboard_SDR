import React, { useState } from 'react';
import { SDR, Assessor, MatchResult } from '../types';
import { 
  FileText, Copy, TrendingUp, Users, CheckCircle2, 
  RefreshCw, Compass, BarChart3, ChevronRight, CheckCircle, AlertCircle 
} from 'lucide-react';

interface ReportsSectionProps {
  sdrs: SDR[];
  assessores: Assessor[];
  matches: MatchResult[];
  startDate: string;
  endDate: string;
  onResetToDefaults: () => void;
}

export default function ReportsSection({
  sdrs,
  assessores,
  matches,
  startDate,
  endDate,
  onResetToDefaults,
}: ReportsSectionProps) {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'visual' | 'whatsapp'>('visual');

  const activeSDRs = sdrs.filter(s => s.active);
  const activeAssessores = assessores.filter(a => a.active);

  // Calculate global stats
  const totalAgendamentos = activeSDRs.reduce((sum, s) => sum + s.agendamentosCount, 0);
  const totalEfetivacoes = activeSDRs.reduce((sum, s) => sum + s.efetivacoesCount, 0);
  
  // Metas consolidating
  const totalMetaAgendamentos = activeSDRs.reduce((sum, s) => sum + (s.metaAgendamentos || 20), 0);
  const totalMetaEfetivacoes = Math.round(activeSDRs.reduce((sum, s) => sum + (s.metaAgendamentos || 20) * ((s.metaEfetivacaoRate || 50) / 100), 0));

  const overallEffectiveness = totalAgendamentos > 0
    ? Math.round((totalEfetivacoes / totalAgendamentos) * 100)
    : 0;

  const targetAgendamentosProgress = totalMetaAgendamentos > 0 
    ? Math.min(100, Math.round((totalAgendamentos / totalMetaAgendamentos) * 100))
    : 0;

  const targetEfetivacoesProgress = totalMetaEfetivacoes > 0 
    ? Math.min(100, Math.round((totalEfetivacoes / totalMetaEfetivacoes) * 100))
    : 0;

  // Group stats by team/channel
  const teamsMap: Record<string, {
    teamName: string;
    sdrCount: number;
    agendamentos: number;
    efetivacoes: number;
    metaAgendamentos: number;
  }> = {};

  activeSDRs.forEach(s => {
    const t = s.team || 'Não Categorizado';
    if (!teamsMap[t]) {
      teamsMap[t] = {
        teamName: t,
        sdrCount: 0,
        agendamentos: 0,
        efetivacoes: 0,
        metaAgendamentos: 0
      };
    }
    teamsMap[t].sdrCount += 1;
    teamsMap[t].agendamentos += s.agendamentosCount || 0;
    teamsMap[t].efetivacoes += s.efetivacoesCount || 0;
    teamsMap[t].metaAgendamentos += s.metaAgendamentos || 20;
  });

  const teamList = Object.values(teamsMap);

  const formatDateVal = (dateStr: string) => {
    if (!dateStr) return 'Não definida';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const generateReportText = () => {
    let report = `📋 RELATÓRIO DE DISTRIBUIÇÃO SDR-ASSESSOR\n`;
    report += `🗓️ VIGÊNCIA DE RODÍZIO: de ${formatDateVal(startDate)} a ${formatDateVal(endDate)}\n`;
    report += `📅 Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
    report += `-----------------------------------------------\n\n`;
    
    report += `📊 MÉTRICAS GERAIS MENSAL:\n`;
    report += `- SDRs Ativos no Rodízio: ${activeSDRs.length}\n`;
    report += `- Assessores Ativos: ${activeAssessores.length}\n`;
    report += `- Total de Agendamentos: ${totalAgendamentos} / Meta: ${totalMetaAgendamentos} (${targetAgendamentosProgress}% da Meta)\n`;
    report += `- Total de Efetivações: ${totalEfetivacoes} / Meta Est. Reuniões Pagas: ${totalMetaEfetivacoes} (${targetEfetivacoesProgress}% da Meta)\n`;
    report += `- Taxa de Conversão Geral: ${overallEffectiveness}%\n`;
    report += `-----------------------------------------------\n\n`;

    report += `🏢 DESEMPENHO POR EQUIPES COMERCIAIS:\n`;
    teamList.forEach(t => {
      const conv = t.agendamentos > 0 ? Math.round((t.efetivacoes / t.agendamentos) * 100) : 0;
      report += `- [${t.teamName}]: ${t.sdrCount} SDRs | ${t.agendamentos} Agends (Meta: ${t.metaAgendamentos}) | ${t.efetivacoes} Rentabilizados | Conversão: ${conv}%\n`;
    });
    report += `-----------------------------------------------\n\n`;

    report += `🔗 RELAÇÕES DETERMINADAS (COMPLETO):\n`;
    if (matches.length > 0) {
      matches.forEach((m, i) => {
        const typeStr = m.isExclusive ? "[💎 EXCLUSIVO]" : "[🔄 RODÍZIO]";
        const matchStart = m.startDate || startDate;
        const matchEnd = m.endDate || endDate;
        report += ` ${i + 1}. ${typeStr} [SDR] ${m.sdrName} (${m.sdrConversionRate}% ef.) ➔ [Assessor] ${m.assessorName} | Vigência: de ${formatDateVal(matchStart)} a ${formatDateVal(matchEnd)}\n`;
      });
    } else {
      report += `Nenhum pareamento gerado até o momento. Clique em "Gerar Relações SDR-Assessor" no painel principal.\n`;
    }
    
    return report;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Symmetrical Master Banner */}
      <div className="bg-white border-2 border-neutral-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="p-1 px-2.5 bg-black text-[#FAF9F5] text-[9px] font-black uppercase tracking-widest rounded leading-none">
              Relatório Geral
            </span>
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight text-neutral-950 font-display">
            Métricas de Desempenho Mensal
          </h2>
          <p className="text-xs text-neutral-600 max-w-2xl">
            Vigência atual do rodízio configurada de <strong className="text-black font-semibold">{formatDateVal(startDate)}</strong> a <strong className="text-black font-semibold">{formatDateVal(endDate)}</strong>.
          </p>
        </div>
        
        {/* Sub-Tab navigation selectors with clean offwhite style */}
        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-300 gap-1 self-start md:self-auto shrink-0 font-display mt-2 md:mt-0">
          <button
            onClick={() => setActiveSubTab('visual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'visual'
                ? 'bg-white text-black shadow-3xs font-black'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Painel Analítico
          </button>
          <button
            onClick={() => setActiveSubTab('whatsapp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'whatsapp'
                ? 'bg-white text-black shadow-3xs font-black'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Exportar (WhatsApp)
          </button>
        </div>
      </div>

      {/* High-level consolidated statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border-2 border-neutral-900 p-5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Conversão Geral SDR</span>
            <TrendingUp className="w-4 h-4 text-neutral-850" />
          </div>
          <div className="text-3xl font-black text-black mt-1.5 tracking-tight font-display">{overallEffectiveness}%</div>
          <p className="text-[10px] text-neutral-500 mt-1 leading-normal">Média ponderada ponderando todos os SDRs escalados para o rodízio.</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-neutral-900 p-5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Volume de Agendamentos</span>
            <Users className="w-4 h-4 text-neutral-850" />
          </div>
          <div className="text-3xl font-black text-black mt-1.5 tracking-tight font-display">
            {totalAgendamentos} <span className="text-xs text-neutral-400 font-normal">/ {totalMetaAgendamentos} meta</span>
          </div>
          
          <div className="w-full bg-neutral-100 h-2 rounded-full mt-2.5 overflow-hidden border border-neutral-200">
            <div 
              className="bg-black h-full rounded-full transition-all duration-500"
              style={{ width: `${targetAgendamentosProgress}%` }}
            ></div>
          </div>
          <p className="text-[9px] text-neutral-500 mt-1 flex justify-between font-mono font-bold">
            <span>Andamento do Mês</span>
            <span>{targetAgendamentosProgress}% da Meta</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-neutral-900 p-5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Contratos Prontos (Rentáveis)</span>
            <CheckCircle2 className="w-4 h-4 text-neutral-850" />
          </div>
          <div className="text-3xl font-black text-black mt-1.5 tracking-tight font-display">
            {totalEfetivacoes} <span className="text-xs text-neutral-400 font-normal">/ {totalMetaEfetivacoes} est.</span>
          </div>

          <div className="w-full bg-neutral-100 h-2 rounded-full mt-2.5 overflow-hidden border border-neutral-200">
            <div 
              className="bg-neutral-800 h-full rounded-full transition-all duration-500"
              style={{ width: `${targetEfetivacoesProgress}%` }}
            ></div>
          </div>
          <p className="text-[9px] text-neutral-500 mt-1 flex justify-between font-mono font-bold">
            <span>Conversão Faturada</span>
            <span>{targetEfetivacoesProgress}% da Meta</span>
          </p>
        </div>
      </div>

      {activeSubTab === 'visual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Detailed Performance Table grouped by Team leader / Channel */}
          <div className="lg:col-span-8 bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-3xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-150 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                  Produtividade Consolidada por Célula / Equipe
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Performance agregada de todos os corretores e SDRs do canal.
                </p>
              </div>
              <span className="text-[9px] font-bold font-mono text-neutral-450 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded leading-none">
                {teamList.length} canais ativos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 text-[10px] text-neutral-450 uppercase tracking-wider font-bold">
                    <th className="py-2.5 font-black">Célula</th>
                    <th className="py-2.5 text-center font-black">Tamanho do Time</th>
                    <th className="py-2.5 text-center font-black">Agendamentos Totais</th>
                    <th className="py-2.5 text-center font-black">Efetivações Totais</th>
                    <th className="py-2.5 text-center font-black">Meta Agend.</th>
                    <th className="py-2.5 text-right font-black">Conversão Canal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150 text-xs text-neutral-800">
                  {teamList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-450 italic">
                        Não há equipes com SDRs ativos este mês.
                      </td>
                    </tr>
                  ) : (
                    teamList.map(t => {
                      const conversion = t.agendamentos > 0 
                        ? Math.round((t.efetivacoes / t.agendamentos) * 100) 
                        : 0;
                      
                      const isWinning = conversion >= 55;
                      const hasWarning = conversion < 40 && t.agendamentos > 0;

                      return (
                        <tr key={t.teamName} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3.5 font-extrabold text-neutral-950 flex items-center gap-1.5">
                            {t.teamName}
                            {isWinning && (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1 py-0.5 text-[8px] font-black rounded uppercase leading-none">
                                Alto Giro
                              </span>
                            )}
                            {hasWarning && (
                              <span className="bg-red-50 text-red-700 border border-red-200 px-1 py-0.5 text-[8px] font-black rounded uppercase leading-none">
                                Alerta Tático
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-center font-medium font-mono text-neutral-600">{t.sdrCount} corretores</td>
                          <td className="py-3.5 text-center font-bold font-mono text-neutral-900">{t.agendamentos}</td>
                          <td className="py-3.5 text-center font-bold font-mono text-neutral-900">{t.efetivacoes}</td>
                          <td className="py-3.5 text-center font-medium font-mono text-neutral-500">{t.metaAgendamentos}</td>
                          <td className="py-3.5 text-right">
                            <span className={`font-mono font-black text-sm px-2 py-0.5 rounded ${
                              isWinning 
                                ? 'text-emerald-850 bg-emerald-50 border border-emerald-250/50' 
                                : hasWarning 
                                  ? 'text-red-700 bg-red-50 border border-red-200/50' 
                                  : 'text-neutral-900 bg-neutral-100 border border-neutral-200'
                            }`}>
                              {conversion}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick audit tools for allocation */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-3xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5 font-display">
                <Compass className="w-4 h-4 text-neutral-850" />
                Auditar Balanceamento
              </h3>
              <p className="text-xs text-neutral-500 leading-normal font-sans">
                As parcerias geradas estão estruturadas dinamicamente de acordo com as seguintes premissas neste mês comercial:
              </p>
              
              <div className="space-y-3 pt-1">
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-neutral-900 leading-none">
                    <span>SDRs em Rodízio</span>
                    <span className="font-mono text-neutral-600">{activeSDRs.length} SDRs</span>
                  </div>
                  <p className="text-[10px] text-neutral-450 font-sans leading-normal">Estão habilitados a alimentar múltiplos assessores por vez.</p>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-neutral-900 leading-none">
                    <span>Pareamentos Atuais</span>
                    <span className="font-mono text-neutral-600">{matches.length} parcerias</span>
                  </div>
                  <p className="text-[10px] text-neutral-450 font-sans leading-normal">Contratos vigentes gerados que expiram em exatamente 30 dias fiscais.</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onResetToDefaults}
                  className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-neutral-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Limpar Todos os Dados
                </button>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Copy WhatsApp Text Tab interface block */
        <div className="bg-white rounded-2xl border-2 border-neutral-900 p-6 shadow-3xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-2 font-display">
                <FileText className="w-4.5 h-4.5 text-neutral-800" />
                Auditoria Comercial Formatada (WhatsApp)
              </h3>
              <p className="text-xs text-neutral-500 font-sans">
                Copie o conteúdo estruturado abaixo para encaminhá-lo diretamente no WhatsApp ou Slack do time.
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className="px-3.5 py-1.5 text-xs font-black bg-black text-[#FAF9F5] hover:text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs hover:bg-neutral-850"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-white animate-pulse" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado para Área!' : 'Copiar Texto'}
            </button>
          </div>
          
          <div className="bg-neutral-50 p-4 border border-neutral-200/90 rounded-xl overflow-y-auto max-h-[420px] font-mono text-[11px] text-neutral-900 whitespace-pre leading-relaxed custom-scrollbar border-dashed">
            {generateReportText()}
          </div>
        </div>
      )}

    </div>
  );
}
