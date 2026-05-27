import React, { useState } from 'react';
import { SDR, Assessor, TeamLeader } from '../types';
import { 
  Lock, CheckCircle, AlertTriangle, Key, Cpu, RefreshCw, 
  Send, Compass, HelpCircle, ArrowRight, LogOut, ChevronRight, Check,
  Trash2, UserPlus, Plus, Users, Shield
} from 'lucide-react';
import Markdown from 'react-markdown';

interface LeaderPortalProps {
  sdrs: SDR[];
  assessores: Assessor[];
  onUpdateSDRMetrics: (id: string, agendamentos: number, efetivacoes: number) => void;
  onUpdateSDR?: (id: string, updatedFields: Partial<SDR>) => void;
  onAddSDR?: (newSdr: Omit<SDR, 'id'>) => void;
  onDeleteSDR?: (id: string) => void;
  onAddAssessor?: (newAssr: Omit<Assessor, 'id'>) => void;
  onDeleteAssessor?: (id: string) => void;
  monthAndThermometer?: {
    month: string;
    thermometer: any;
  };
  sessionLeader?: TeamLeader;
  leaders?: TeamLeader[];
  isAdmin?: boolean;
}

const DEFAULT_LEADERS: TeamLeader[] = [
  { id: 'leader-1', teamName: 'Equipe Alpha', leaderTitle: 'Líder de Contas Alpha', passcode: 'alpha123', name: 'Gestor Alpha' },
  { id: 'leader-2', teamName: 'Equipe Beta', leaderTitle: 'Gestor Comercial Beta', passcode: 'beta123', name: 'Gestor Beta' },
  { id: 'leader-3', teamName: 'Equipe Delta', leaderTitle: 'Diretor de Expansão Delta', passcode: 'delta123', name: 'Gestor Delta' }
];

export default function LeaderPortal({
  sdrs,
  assessores,
  onUpdateSDRMetrics,
  onUpdateSDR,
  onAddSDR,
  onDeleteSDR,
  onAddAssessor,
  onDeleteAssessor,
  monthAndThermometer,
  sessionLeader,
  leaders = DEFAULT_LEADERS,
  isAdmin = false
}: LeaderPortalProps) {
  // Auth state - Adopt sessionLeader if pre-authenticated at App layout root, or first leader of list if Admin
  const [currentLeader, setCurrentLeader] = useState<TeamLeader | null>(() => sessionLeader || (isAdmin ? leaders[0] : null));
  const [selectedLeaderOpt, setSelectedLeaderOpt] = useState<string>(() => leaders[0]?.teamName || 'Equipe Alpha');
  const [inputPasscode, setInputPasscode] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  
  // Custom tabs inside leaders list
  const [activeLeaderListTab, setActiveLeaderListTab] = useState<'sdrs' | 'assessors'>('sdrs');

  // Inline resource creation forms
  const [showAddSdrForm, setShowAddSdrForm] = useState(false);
  const [newSdrName, setNewSdrName] = useState('');
  const [newSdrAdmission, setNewSdrAdmission] = useState('');

  const [showAddAssessorForm, setShowAddAssessorForm] = useState(false);
  const [newAssrName, setNewAssrName] = useState('');
  const [newAssrAgenda, setNewAssrAgenda] = useState('');

  // Auto sync session alignment if changed at parent
  React.useEffect(() => {
    if (sessionLeader) {
      setCurrentLeader(sessionLeader);
    }
  }, [sessionLeader]);

  // AI workspace states
  const [customAIPrompt, setCustomAIPrompt] = useState<string>('');
  const [aiReport, setAiReport] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Edit states for current team SDR
  const [localEditSdrId, setLocalEditSdrId] = useState<string | null>(null);
  const [localAgendamentos, setLocalAgendamentos] = useState<number>(0);
  const [localEfetivacoes, setLocalEfetivacoes] = useState<number>(0);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config = leaders.find(l => l.teamName === selectedLeaderOpt);
    if (!config) return;

    if (inputPasscode === config.passcode) {
      setCurrentLeader(config);
      setLoginError('');
      setInputPasscode('');
      setAiReport('');
    } else {
      setLoginError('Senha de acesso incorreta para este canal.');
    }
  };

  // Quick Demo logins
  const handleQuickDemoLogin = (leader: TeamLeader) => {
    setSelectedLeaderOpt(leader.teamName);
    setInputPasscode(leader.passcode);
  };

  if (!currentLeader) {
    return (
      <div className="max-w-md mx-auto bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 bg-neutral-100 rounded-xl flex items-center justify-center text-black font-bold border border-neutral-200 mx-auto">
            <Lock className="w-5 h-5 text-neutral-800" />
          </div>
          <h2 className="text-base font-bold text-neutral-900 font-display">
            Acesso Restrito a Líderes de Equipe
          </h2>
          <p className="text-xs text-neutral-500">
            Selecione sua equipe e insira o passcode correspondente para acessar métricas reservadas e ferramentas de IA.
          </p>
        </div>

        {loginError && (
          <div className="text-xs font-semibold text-red-700 bg-red-5- border border-red-200 p-2.5 rounded-lg text-center">
            {loginError}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-550 uppercase tracking-wider mb-1">
              Escolha sua Célula/Canal
            </label>
            <select
              value={selectedLeaderOpt}
              onChange={e => setSelectedLeaderOpt(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-850 focus:outline-none"
            >
              {leaders.map(l => (
                <option key={l.id || l.teamName} value={l.teamName}>{l.teamName} ({l.leaderTitle})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-550 uppercase tracking-wider mb-1">
              Senha de Acesso (Passcode)
            </label>
            <input
              type="password"
              placeholder="Digite a senha de 8 caracteres"
              value={inputPasscode}
              onChange={e => setInputPasscode(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-black hover:bg-neutral-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Entrar no Workspace
          </button>
        </form>
      </div>
    );
  }

  // Active Leader panel variables (only show items allocated to current team!)
  const teamSDRs = sdrs.filter(s => s.team === currentLeader.teamName);
  const teamAssessores = assessores.filter(a => a.team === currentLeader.teamName);

  const teamTotalAgendamentos = teamSDRs.reduce((sum, s) => sum + (s.agendamentosCount || 0), 0);
  const teamTotalMeta = teamSDRs.reduce((sum, s) => sum + (s.metaAgendamentos || 20), 0);
  const teamTotalEfetivacoes = teamSDRs.reduce((sum, s) => sum + (s.efetivacoesCount || 0), 0);
  const teamConversionRate = teamTotalAgendamentos > 0 
    ? Math.round((teamTotalEfetivacoes / teamTotalAgendamentos) * 100) 
    : 0;

  // AI consult trigger
  const handleTriggerAIConsult = async () => {
    setAiLoading(true);
    setAiReport('');
    
    try {
      const response = await fetch('/api/gemini/guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaderName: currentLeader.leaderTitle,
          teamName: currentLeader.teamName,
          // Prepare payload to process only team data
          sdrStats: teamSDRs.map(s => ({
            name: s.name,
            agendamentosCount: s.agendamentosCount,
            efetivacoesCount: s.efetivacoesCount,
            metaAgendamentos: s.metaAgendamentos,
            metaEfetivacaoRate: s.metaEfetivacaoRate,
            active: s.active,
            team: s.team
          })),
          assessorStats: teamAssessores.map(a => ({
            name: a.name,
            agendaLink: a.agendaLink,
            participatesInRotation: a.participatesInRotation,
            team: a.team
          })),
          customPrompt: customAIPrompt,
          month: monthAndThermometer?.month,
          thermometer: monthAndThermometer?.thermometer,
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAiReport(data.text);
      } else {
        setAiReport(`### ❌ Erro ao Gerar Relatório de IA\n\nNossos servidores relataram uma falha: *${data.error || 'Erro desconhecido'}*`);
      }
    } catch (err: any) {
      setAiReport(`### ⚠️ Erro de Rede\n\nNão foi possível fazer contato com a inteligência artificial na nuvem. Verifique o servidor local. Detalhes: *${err.message}*`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleStartScoreEdit = (sdr: SDR) => {
    setLocalEditSdrId(sdr.id);
    setLocalAgendamentos(sdr.agendamentosCount);
    setLocalEfetivacoes(sdr.efetivacoesCount);
  };

  const handleSaveScoreEdit = (id: string) => {
    if (localEfetivacoes > localAgendamentos) {
      alert("O número de efetivações não pode superar os agendamentos!");
      return;
    }
    if (onUpdateSDR) {
      onUpdateSDR(id, {
        agendamentosCount: localAgendamentos,
        efetivacoesCount: localEfetivacoes
      });
    } else {
      onUpdateSDRMetrics(id, localAgendamentos, localEfetivacoes);
    }
    setLocalEditSdrId(null);
  };

  const handleAddSdrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSdrName.trim()) return;
    if (onAddSDR) {
      onAddSDR({
        name: newSdrName.trim(),
        team: currentLeader.teamName,
        admissionDate: newSdrAdmission || new Date().toISOString().substring(0, 10),
        active: true,
        agendamentosCount: 0,
        efetivacoesCount: 0,
        metaAgendamentos: 20,
        metaEfetivacaoRate: 50,
        monthlyRecords: {}
      });
      setNewSdrName('');
      setNewSdrAdmission('');
      setShowAddSdrForm(false);
    } else {
      alert("Operação indisponível. Contate o Administrador.");
    }
  };

  const handleAddAssessorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssrName.trim()) return;
    if (onAddAssessor) {
      onAddAssessor({
        name: newAssrName.trim(),
        team: currentLeader.teamName,
        agendaLink: newAssrAgenda.trim(),
        active: true,
        exclusiveSdrIds: [],
        participatesInRotation: true
      });
      setNewAssrName('');
      setNewAssrAgenda('');
      setShowAddAssessorForm(false);
    } else {
      alert("Operação indisponível. Contate o Administrador.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {isAdmin && (
        <div className="bg-neutral-950 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-display">
          <div className="flex items-center gap-2.5">
            <span className="p-1 px-2 bg-amber-400 text-black text-[8px] font-black uppercase tracking-widest rounded leading-none">
              ADMIN MODE
            </span>
            <div>
              <strong className="text-xs uppercase tracking-wider block font-sans">Controle de Back-Office Administrativo</strong>
              <span className="text-[10px] text-neutral-350">Você tem acesso livre para auditar dados, adicionar SDRs/Assessores e rodar relatórios em qualquer canal.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-neutral-300 shrink-0 font-sans">Selecionar Canal:</span>
            <select
              value={currentLeader.teamName}
              onChange={e => {
                const matched = leaders.find(l => l.teamName === e.target.value);
                if (matched) setCurrentLeader(matched);
              }}
              className="bg-neutral-850 text-white border border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer"
            >
              {leaders.map(l => (
                <option key={l.id || l.teamName} value={l.teamName}>
                  {l.teamName} ({l.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Upper header */}
      <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-black animate-pulse"></span>
            <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest">Sessão Ativa {isAdmin ? 'Administrada' : 'Autenticada'}</span>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 font-display mt-0.5">
            {currentLeader.leaderTitle}
          </h2>
          <p className="text-xs text-neutral-500">
            Você está operando as premissas e os analíticos da <strong className="text-black font-bold">{currentLeader.teamName}</strong>.
          </p>
        </div>

        {!sessionLeader && !isAdmin && (
          <button
            onClick={() => setCurrentLeader(null)}
            className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair do Portal
          </button>
        )}
      </div>

      {/* Metrics Row of current team */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Agendamentos Gerais</span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <strong className="text-2xl font-black text-black tracking-tight">{teamTotalAgendamentos}</strong>
            <span className="text-xs text-neutral-400">/ meta {teamTotalMeta}</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Contratos Efetivados</span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <strong className="text-2xl font-black text-black tracking-tight">{teamTotalEfetivacoes}</strong>
            <span className="text-xs text-neutral-550">reuniões pagas</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Conversão Médica Célula</span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <strong className="text-2xl font-black text-black tracking-tight">{teamConversionRate}%</strong>
            <span className="text-xs text-neutral-450">Conversão de mesa</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Tamanho da Operação</span>
          <div className="mt-1 flex gap-1.5 text-xs font-bold">
            <span className="bg-neutral-100 text-black px-2 py-0.5 rounded border border-neutral-150 font-mono">
              {teamSDRs.length} SDRs
            </span>
            <span className="bg-neutral-100 text-black px-2 py-0.5 rounded border border-neutral-150 font-mono">
              {teamAssessores.length} Assessores
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Team Members List (7 columns) */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm lg:col-span-7 space-y-4 font-sans">
          <div className="border-b border-neutral-150 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 font-display">
              Membros da Célula ({currentLeader.teamName})
            </h3>
            <p className="text-xs text-neutral-550 mt-0.5">
              Gerencie os cadastros, links de agenda e métricas locais do seu canal.
            </p>
          </div>

          {/* Sub-Tabs for SDRs and Assessores */}
          <div className="flex border-b border-neutral-200 gap-4">
            <button
              onClick={() => setActiveLeaderListTab('sdrs')}
              className={`pb-2 text-xs font-bold leading-none border-b-2 transition-colors cursor-pointer ${
                activeLeaderListTab === 'sdrs'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Time de SDRs ({teamSDRs.length})
            </button>
            <button
              onClick={() => setActiveLeaderListTab('assessors')}
              className={`pb-2 text-xs font-bold leading-none border-b-2 transition-colors cursor-pointer ${
                activeLeaderListTab === 'assessors'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Assessores Alocados ({teamAssessores.length})
            </button>
          </div>

          {activeLeaderListTab === 'sdrs' && (
            <div className="space-y-4">
              
              {/* Add SDR Form toggle */}
              <div className="flex justify-between items-center bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-150">
                <span className="text-xs font-bold text-neutral-600">Inserir novo SDR no canal?</span>
                <button
                  type="button"
                  onClick={() => setShowAddSdrForm(!showAddSdrForm)}
                  className="px-2.5 py-1 bg-black hover:bg-neutral-900 text-white rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-white" />
                  {showAddSdrForm ? 'Fechar' : 'Cadastrar SDR'}
                </button>
              </div>

              {showAddSdrForm && (
                <form onSubmit={handleAddSdrSubmit} className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3 animate-fade-in">
                  <span className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest pb-1 border-b border-neutral-150">Novo SDR para {currentLeader.teamName}</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-neutral-450">Nome do SDR</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Pedro Lima"
                        value={newSdrName}
                        onChange={e => setNewSdrName(e.target.value)}
                        className="w-full p-1.5 bg-white border border-neutral-300 rounded text-xs focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-neutral-450">Data de Entrada</label>
                      <input 
                        type="date"
                        value={newSdrAdmission}
                        onChange={e => setNewSdrAdmission(e.target.value)}
                        className="w-full p-1.5 bg-white border border-neutral-300 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-black hover:opacity-90 text-white font-bold text-[10px] uppercase tracking-wider rounded transition-colors cursor-pointer"
                  >
                    Confirmar Cadastro de SDR
                  </button>
                </form>
              )}

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {teamSDRs.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 text-xs">
                    Nenhum SDR registrado na célula {currentLeader.teamName}. Cadastre seu primeiro membro acima.
                  </div>
                ) : (
                  teamSDRs.map(sdr => {
                    const sdrRate = sdr.agendamentosCount > 0 
                      ? Math.round((sdr.efetivacoesCount / sdr.agendamentosCount) * 100) 
                      : 0;

                    const isBelowGoals = sdr.agendamentosCount < (sdr.metaAgendamentos || 20) || sdrRate < (sdr.metaEfetivacaoRate || 50);

                    const isEditing = localEditSdrId === sdr.id;

                    return (
                      <div key={sdr.id} className="p-3.5 border border-neutral-200 hover:border-neutral-300 rounded-xl transition-all flex flex-col justify-between bg-white shadow-3xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-neutral-900 text-xs">{sdr.name}</h4>
                              {isBelowGoals ? (
                                <span className="text-[9px] font-black bg-amber-50 text-amber-900 px-1 border border-amber-200 rounded flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-605" />
                                  Ponto Crítico
                                </span>
                              ) : (
                                <span className="text-[9px] font-black bg-emerald-50 text-emerald-800 px-1 border border-emerald-200 rounded flex items-center gap-1">
                                  <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                                  Meta Batida
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-500 font-medium">
                              Admissão em {sdr.admissionDate ? sdr.admissionDate : 'Sem registro'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setLocalEditSdrId(null)}
                                  className="px-2 py-1 text-[10px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded text-neutral-600 font-bold"
                                >
                                  X
                                </button>
                                <button
                                  onClick={() => handleSaveScoreEdit(sdr.id)}
                                  className="px-2.5 py-1 text-[10px] bg-black text-white rounded font-bold"
                                >
                                  Salvar
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleStartScoreEdit(sdr)}
                                  className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-[9px] uppercase tracking-wide rounded border border-neutral-200 cursor-pointer"
                                >
                                  Ajustar Placar
                                </button>
                                {onDeleteSDR && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Deseja mesmo desativar/remover o SDR ${sdr.name} do rodízio?`)) {
                                        onDeleteSDR(sdr.id);
                                      }
                                    }}
                                    className="p-1 px-1.5 text-neutral-410 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                    title="Excluir SDR"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="mt-3 grid grid-cols-2 gap-3 bg-neutral-50 p-2.5 rounded border border-neutral-200">
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-400 mb-0.5">Agendamentos</label>
                              <input
                                type="number"
                                min="0"
                                value={localAgendamentos}
                                onChange={e => setLocalAgendamentos(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full text-xs p-1 bg-white border border-neutral-300 rounded focus:ring-1 focus:ring-black"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-400 mb-0.5">Efetivados</label>
                              <input
                                type="number"
                                min="0"
                                value={localEfetivacoes}
                                onChange={e => setLocalEfetivacoes(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full text-xs p-1 bg-white border border-neutral-300 rounded focus:ring-1 focus:ring-black"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-neutral-800 font-sans text-[11px] bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                            <div>
                              <span className="block text-[9px] text-neutral-400 uppercase tracking-wide">Agendamentos</span>
                              <strong className="font-mono text-neutral-900 font-black">{sdr.agendamentosCount} <span className="text-neutral-400 font-normal">({sdr.metaAgendamentos})</span></strong>
                            </div>
                            <div>
                              <span className="block text-[9px] text-neutral-400 uppercase tracking-wide">Efetivações</span>
                              <strong className="font-mono text-neutral-900 font-black">{sdr.efetivacoesCount}</strong>
                            </div>
                            <div>
                              <span className="block text-[9px] text-neutral-400 uppercase tracking-wide">Desempenho</span>
                              <strong className="font-mono text-neutral-900 font-black">{sdrRate}% <span className="text-neutral-400 font-normal">({sdr.metaEfetivacaoRate}%)</span></strong>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeLeaderListTab === 'assessors' && (
            <div className="space-y-4">
              
              {/* Add Assessor Toggle */}
              <div className="flex justify-between items-center bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-150">
                <span className="text-xs font-bold text-neutral-600">Novo assessor a bordo na Célula?</span>
                <button
                  type="button"
                  onClick={() => setShowAddAssessorForm(!showAddAssessorForm)}
                  className="px-2.5 py-1 bg-black hover:bg-neutral-900 text-white rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-white" />
                  {showAddAssessorForm ? 'Fechar' : 'Cadastrar Assessor'}
                </button>
              </div>

              {showAddAssessorForm && (
                <form onSubmit={handleAddAssessorSubmit} className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3 animate-fade-in font-display">
                  <span className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest pb-1 border-b border-neutral-150">Novo Assessor para {currentLeader.teamName}</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-neutral-450 font-sans">Nome do Assessor</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Dra. Juliana Souza"
                        value={newAssrName}
                        onChange={e => setNewAssrName(e.target.value)}
                        className="w-full p-1.5 bg-white border border-neutral-300 rounded text-xs focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-neutral-450 font-sans">Link da Agenda</label>
                      <input 
                        type="text"
                        placeholder="Ex: https://calendly.com/juliana"
                        value={newAssrAgenda}
                        onChange={e => setNewAssrAgenda(e.target.value)}
                        className="w-full p-1.5 bg-white border border-neutral-300 rounded text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-black hover:opacity-90 text-white font-bold text-[10px] uppercase tracking-wider rounded transition-colors cursor-pointer"
                  >
                    Confirmar Cadastro de Assessor
                  </button>
                </form>
              )}

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {teamAssessores.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 text-xs">
                    Nenhum assessor vinculado à equipe {currentLeader.teamName}. Cadastre acima.
                  </div>
                ) : (
                  teamAssessores.map(assr => (
                    <div key={assr.id} className="p-3 bg-white border border-neutral-200 hover:border-neutral-300 transition-all rounded-xl flex items-center justify-between gap-4 shadow-3xs">
                      <div className="min-w-0 flex-1">
                        <strong className="block text-xs text-neutral-900 truncate">{assr.name}</strong>
                        {assr.agendaLink ? (
                          <a 
                            href={assr.agendaLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-blue-600 hover:underline truncate block"
                          >
                            {assr.agendaLink}
                          </a>
                        ) : (
                          <span className="text-[10px] text-neutral-400">Sem link de agenda configurado</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded leading-none ${
                          assr.participatesInRotation ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 font-sans' : 'bg-neutral-100 text-neutral-450'
                        }`}>
                          {assr.participatesInRotation ? 'Rodízio' : 'Inativo'}
                        </span>
                        {onDeleteAssessor && (
                          <button
                            onClick={() => {
                              if (confirm(`Deseja mesmo desativar/remover o Assessor ${assr.name} do rodízio?`)) {
                                onDeleteAssessor(assr.id);
                              }
                            }}
                            className="p-1 px-1.5 text-neutral-410 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Remover Assessor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}
        </div>

        {/* AI copilot consultancy interface (5 columns) */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm lg:col-span-5 space-y-4">
          <div className="border-b border-neutral-150 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 font-display flex items-center gap-1.5">
                <Cpu className="w-4.5 h-4.5 text-neutral-800" />
                Copiloto de Líderes (IA)
              </h3>
              <p className="text-xs text-neutral-550">
                Gere roteiros, scripts de contorno e análise tática sob medida para seu time.
              </p>
            </div>
          </div>

          {/* Assistant prompt customization option */}
          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
              Instrução Específica para este diagnóstico (Opcional):
            </label>
            <textarea
              placeholder="Ex: focar em roteiro telefônico mais agressivo de 2 minutos ou contornar objeção de falta de tempo..."
              value={customAIPrompt}
              onChange={e => setCustomAIPrompt(e.target.value)}
              className="w-full h-16 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs placeholder-neutral-400 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <button
            onClick={handleTriggerAIConsult}
            disabled={aiLoading}
            className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Computando Métricas do Time...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Gerar Consultoria com IA
              </>
            )}
          </button>

          {/* Markdown analysis output screen */}
          {aiReport && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs leading-relaxed max-h-80 overflow-y-auto custom-scrollbar animate-fade-in text-neutral-800 space-y-2">
              <Markdown>{aiReport}</Markdown>
            </div>
          )}

          {!aiReport && !aiLoading && (
            <div className="border border-dashed border-neutral-200 text-center py-10 rounded-xl text-neutral-450 text-xs">
              <Compass className="w-7 h-7 mx-auto text-neutral-350 mb-1" />
              Clique acima para compilar uma análise executiva dos gargalos reais da {currentLeader.teamName}.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
