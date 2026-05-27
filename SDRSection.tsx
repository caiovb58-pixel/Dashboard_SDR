import React, { useState } from 'react';
import { SDR } from '../types';
import { calculateGoalProgress } from '../goalMetrics';
import { 
  Plus, Trash2, Shield, User, ToggleLeft, ToggleRight, X, 
  Target, TrendingUp, Edit2, Check, AlertTriangle, HelpCircle, 
  Save, Filter, Award, CheckCircle2 
} from 'lucide-react';

interface SDRSectionProps {
  sdrs: SDR[];
  onAddSDR: (sdr: Omit<SDR, 'id'>) => void;
  onDeleteSDR: (id: string) => void;
  onToggleActiveSDR: (id: string) => void;
  onUpdateSDRMetrics: (id: string, agendamentos: number, efetivacoes: number) => void;
  onUpdateSDR?: (id: string, updatedFields: Partial<SDR>) => void;
  currentMonth: string;
}

export default function SDRSection({
  sdrs,
  onAddSDR,
  onDeleteSDR,
  onToggleActiveSDR,
  onUpdateSDRMetrics,
  onUpdateSDR,
  currentMonth,
}: SDRSectionProps) {
  // Sub-tabs inside the SDR Section to centralize registration and targets
  const [subTab, setSubTab] = useState<'list' | 'goals'>('list');
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [team, setTeam] = useState('Equipe Alpha');
  const [agendamentosCount, setAgendamentosCount] = useState<number>(0);
  const [efetivacoesCount, setEfetivacoesCount] = useState<number>(0);
  const [metaAgendamentos, setMetaAgendamentos] = useState<number>(20);
  const [metaEfetivacaoRate, setMetaEfetivacaoRate] = useState<number>(50);
  const [admissionDate, setAdmissionDate] = useState('');
  const [error, setError] = useState('');

  // Team Filter for the list
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');

  // Editing component states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTeam, setEditTeam] = useState('Equipe Alpha');
  const [editAgendamentos, setEditAgendamentos] = useState(0);
  const [editEfetivacoes, setEditEfetivacoes] = useState(0);
  const [editAdmissionDate, setEditAdmissionDate] = useState('');
  const [editMetaAgend, setEditMetaAgend] = useState<number>(20);
  const [editMetaEfet, setEditMetaEfet] = useState<number>(50);

  // Deletion helper
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informada';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nome é de preenchimento obrigatório');
      return;
    }
    if (efetivacoesCount > agendamentosCount) {
      setError('O número de efetivações não pode ser superior ao de agendamentos');
      return;
    }

    onAddSDR({
      name: name.trim(),
      agendamentosCount: Number(agendamentosCount),
      efetivacoesCount: Number(efetivacoesCount),
      metaAgendamentos: Number(metaAgendamentos),
      metaEfetivacaoRate: Number(metaEfetivacaoRate),
      active: true,
      admissionDate: admissionDate,
      team: team,
    });

    // Reset Form
    setName('');
    setAgendamentosCount(0);
    setEfetivacoesCount(0);
    setMetaAgendamentos(20);
    setMetaEfetivacaoRate(50);
    setAdmissionDate('');
    setError('');
    setIsAdding(false);
  };

  const handleStartEdit = (sdr: SDR) => {
    setEditingId(sdr.id);
    setEditName(sdr.name);
    setEditTeam(sdr.team || 'Equipe Alpha');
    setEditAgendamentos(sdr.agendamentosCount || 0);
    setEditEfetivacoes(sdr.efetivacoesCount || 0);
    setEditAdmissionDate(sdr.admissionDate || '');
    setEditMetaAgend(sdr.metaAgendamentos || 20);
    setEditMetaEfet(sdr.metaEfetivacaoRate || 50);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    if (editEfetivacoes > editAgendamentos) {
      alert('Número de efetivações não pode ser maior do que agendamentos!');
      return;
    }

    if (onUpdateSDR) {
      onUpdateSDR(id, {
        name: editName.trim(),
        team: editTeam,
        agendamentosCount: editAgendamentos,
        efetivacoesCount: editEfetivacoes,
        admissionDate: editAdmissionDate,
        metaAgendamentos: editMetaAgend,
        metaEfetivacaoRate: editMetaEfet,
      });
    } else {
      onUpdateSDRMetrics(id, editAgendamentos, editEfetivacoes);
    }
    setEditingId(null);
  };

  // Team summary calculations (only for active SDRs)
  const activeSDRs = sdrs.filter(s => s.active);
  const teamTotalAgendamentos = activeSDRs.reduce((sum, s) => sum + (s.agendamentosCount || 0), 0);
  const teamTotalMetaAgendamentos = activeSDRs.reduce((sum, s) => sum + (s.metaAgendamentos || 20), 0);
  const teamTotalEfetivacoes = activeSDRs.reduce((sum, s) => sum + (s.efetivacoesCount || 0), 0);
  const teamConversionRate = teamTotalAgendamentos > 0 
    ? Math.round((teamTotalEfetivacoes / teamTotalAgendamentos) * 100) 
    : 0;

  const teamAverageMetaRate = activeSDRs.length > 0
    ? Math.round(activeSDRs.reduce((sum, s) => sum + (s.metaEfetivacaoRate || 50), 0) / activeSDRs.length)
    : 0;

  // Filter list
  const filteredSDRs = selectedTeamFilter === 'all' 
    ? sdrs 
    : sdrs.filter(s => s.team === selectedTeamFilter);

  // Critical items (SDRs active that are below target either on total booking or conversion rate)
  const criticalSDRs = activeSDRs.filter(s => {
    const rate = s.agendamentosCount > 0 ? Math.round((s.efetivacoesCount / s.agendamentosCount) * 100) : 0;
    const sdrProgress = calculateGoalProgress([s], currentMonth);
    const belowBooking = s.agendamentosCount < sdrProgress.expectedRealizedToday;
    const belowRate = rate < (s.metaEfetivacaoRate || 50);
    return belowBooking || belowRate;
  });

  return (
    <div className="space-y-6">
      
      {/* Visual Header card */}
      <div className="bg-white rounded-xl border border-neutral-200/90 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight font-display flex items-center gap-2">
              <Shield className="w-5 h-5 text-neutral-800" />
              Gestão Integrada de SDRs
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Gerencie a base cadastral de SDRs, associe equipes, configure metas individuais e acompanhe os pontos críticos de atenção do mês.
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Embedded sub-tab switchers */}
            <div className="bg-neutral-100 p-1 rounded-lg flex gap-1 text-xs font-semibold">
              <button
                onClick={() => setSubTab('list')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  subTab === 'list' 
                    ? 'bg-white shadow-xs text-black font-bold' 
                    : 'text-neutral-550 hover:text-black'
                }`}
              >
                Fichas Ativas ({sdrs.length})
              </button>
              <button
                onClick={() => setSubTab('goals')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  subTab === 'goals' 
                    ? 'bg-white shadow-xs text-black font-bold' 
                    : 'text-neutral-550 hover:text-black'
                }`}
              >
                Pontos de Atenção & Metas
              </button>
            </div>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className={`px-3.5 py-2.5 rounded-lg text-xs font-bold font-sans flex items-center gap-1.5 transition-all cursor-pointer ml-auto ${
                isAdding 
                  ? 'bg-neutral-100 border border-neutral-300 hover:bg-neutral-200 text-neutral-700' 
                  : 'bg-black hover:bg-neutral-900 text-white shadow-xs'
              }`}
            >
              {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {isAdding ? 'Cancelar' : 'Cadastrar SDR'}
            </button>
          </div>
        </div>
      </div>

      {/* Creation form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-6 bg-white border border-neutral-200/90 rounded-xl shadow-xs space-y-5 animate-fade-in">
          <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-500" />
            Cadastrar Novo SDR no Sistema
          </h3>
          
          {error && (
            <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200/80 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Nome do SDR
              </label>
              <input
                type="text"
                placeholder="Ex: Ana Silva"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Equipe / Canal
              </label>
              <select
                value={team}
                onChange={e => setTeam(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-850 font-semibold focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all cursor-pointer"
              >
                <option value="Equipe Alpha">Equipe Alpha</option>
                <option value="Equipe Beta">Equipe Beta</option>
                <option value="Equipe Delta">Equipe Delta</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Data de Admissão
              </label>
              <input
                type="date"
                value={admissionDate}
                onChange={e => setAdmissionDate(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all font-mono cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Agendamentos
                </label>
                <input
                  type="number"
                  min="0"
                  value={agendamentosCount}
                  onChange={e => setAgendamentosCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Efetivações
                </label>
                <input
                  type="number"
                  min="0"
                  value={efetivacoesCount}
                  onChange={e => setEfetivacoesCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-neutral-100">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Meta de Agendamentos Mensais
              </label>
              <input
                type="number"
                min="1"
                value={metaAgendamentos}
                onChange={e => setMetaAgendamentos(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Meta de Taxa de Conversão Esperada (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={metaEfetivacaoRate}
                onChange={e => setMetaEfetivacaoRate(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-850"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-black hover:bg-neutral-900 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Salvar SDR
            </button>
          </div>
        </form>
      )}

      {/* RENDER VIEW TAB: LIST */}
      {subTab === 'list' && (
        <div className="space-y-5">
          {/* List Toolbar for filtering */}
          <div className="bg-white border border-neutral-200/90 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-neutral-450" />
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Filtrar por Canal:</span>
              <div className="flex gap-1">
                {['all', 'Equipe Alpha', 'Equipe Beta', 'Equipe Delta'].map(teamOpt => (
                  <button
                    key={teamOpt}
                    onClick={() => setSelectedTeamFilter(teamOpt)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      selectedTeamFilter === teamOpt 
                        ? 'bg-neutral-900 text-white' 
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-650'
                    }`}
                  >
                    {teamOpt === 'all' ? 'Ver Todos' : teamOpt}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-[11px] font-semibold text-neutral-500">
              Exibindo <strong className="text-black font-bold">{filteredSDRs.length}</strong> SDRs
            </div>
          </div>

          {/* Grid Layout of SDRs in cards */}
          {filteredSDRs.length === 0 ? (
            <div className="text-center py-16 bg-white border border-neutral-200/90 rounded-xl">
              <User className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-neutral-800">Nenhum SDR Ativo no Filtro Selecionado</h3>
              <p className="text-xs text-neutral-550 mt-1">Troque o filtro ou clique em "Cadastrar SDR".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSDRs.map(sdr => {
                const isEditing = editingId === sdr.id;
                const isDeleting = deletingId === sdr.id;
                
                const conversionRate = sdr.agendamentosCount > 0
                  ? Math.round((sdr.efetivacoesCount / sdr.agendamentosCount) * 100)
                  : 0;

                const hasMetMetas = sdr.agendamentosCount >= (sdr.metaAgendamentos || 20) && conversionRate >= (sdr.metaEfetivacaoRate || 50);

                return (
                  <div
                    key={sdr.id}
                    className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-all relative ${
                      sdr.active 
                        ? 'border-neutral-200 hover:border-neutral-400 shadow-xs' 
                        : 'border-neutral-250 bg-neutral-50 opacity-60'
                    }`}
                  >
                    <div>
                      {/* Form validation while editing */}
                      {isEditing ? (
                        <div className="space-y-3 mb-4 text-xs">
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Nome Completo</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs text-neutral-850 font-semibold focus:outline-none focus:ring-1 focus:ring-black"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Equipe</label>
                              <select
                                value={editTeam}
                                onChange={e => setEditTeam(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-[11px] focus:outline-none"
                              >
                                <option value="Equipe Alpha">Equipe Alpha</option>
                                <option value="Equipe Beta">Equipe Beta</option>
                                <option value="Equipe Delta">Equipe Delta</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Data de Adm.</label>
                              <input
                                type="date"
                                value={editAdmissionDate}
                                onChange={e => setEditAdmissionDate(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-[10px] font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Agendados</label>
                              <input
                                type="number"
                                min="0"
                                value={editAgendamentos}
                                onChange={e => setEditAgendamentos(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Efetivados</label>
                              <input
                                type="number"
                                min="0"
                                value={editEfetivacoes}
                                onChange={e => setEditEfetivacoes(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-neutral-100">
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Meta Agend.</label>
                              <input
                                type="number"
                                min="1"
                                value={editMetaAgend}
                                onChange={e => setEditMetaAgend(Math.max(1, parseInt(e.target.value) || 0))}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-0.5">Meta Taxa%</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editMetaEfet}
                                onChange={e => setEditMetaEfet(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-2 py-0.5 bg-neutral-150 text-[10px] text-neutral-600 font-bold rounded"
                            >
                              Sair
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(sdr.id)}
                              className="px-3 py-0.5 bg-black text-[10px] text-white font-black rounded"
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center font-bold text-xs border ${
                              sdr.active 
                                ? 'bg-neutral-50 border-neutral-200 text-black' 
                                : 'bg-neutral-200 border-neutral-250 text-neutral-400'
                            }`}>
                              <span className="font-display font-bold uppercase">
                                {sdr.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-neutral-900 text-sm leading-snug">
                                  {sdr.name}
                                </h3>
                                {sdr.active && hasMetMetas && (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-1 rounded border border-emerald-200">
                                    TOP
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col gap-0.5 mt-0.5">
                                <span className="font-mono text-[9px] text-neutral-450 uppercase font-black">
                                  {sdr.team || 'Sem Equipe'} &bull; {sdr.active ? 'SDR ativo' : 'desativado'}
                                </span>
                                <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-sans">
                                  📅 Admissão: <strong className="text-neutral-700 font-semibold">{formatDate(sdr.admissionDate)}</strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Topbar controllers */}
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => onToggleActiveSDR(sdr.id)}
                              className="p-1 rounded text-neutral-405 hover:bg-neutral-100 transition-colors cursor-pointer"
                              title={sdr.active ? 'Mudar para Inativo' : 'Ativar novamente'}
                            >
                              {sdr.active ? (
                                <ToggleRight className="w-5 h-5 text-neutral-800" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-neutral-350" />
                              )}
                            </button>

                            <button
                              onClick={() => handleStartEdit(sdr)}
                              className="p-1 rounded text-neutral-450 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Guarded dynamic deletion drawer */}
                            {isDeleting ? (
                              <div className="absolute right-2 top-2 bg-white border border-neutral-300 p-2.5 rounded-lg z-10 flex flex-col items-center gap-1.5 shadow-sm">
                                <span className="text-[9px] font-bold text-red-700 uppercase flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-red-650" />
                                  Excluir?
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setDeletingId(null)}
                                    className="px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-[9px] text-neutral-600 rounded"
                                  >
                                    Não
                                  </button>
                                  <button
                                    onClick={() => {
                                      onDeleteSDR(sdr.id);
                                      setDeletingId(null);
                                    }}
                                    className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold rounded"
                                  >
                                    Sim
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingId(sdr.id)}
                                className="p-1 rounded text-neutral-400 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Operational metrics sliders with increment buttons */}
                    {!isEditing && (
                      <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200/50 mt-2 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-white border border-neutral-200/80 rounded-lg p-1.5">
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Agendamentos</span>
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => onUpdateSDRMetrics(sdr.id, Math.max(sdr.efetivacoesCount || 0, (sdr.agendamentosCount || 0) - 1), sdr.efetivacoesCount || 0)}
                                disabled={(sdr.agendamentosCount || 0) === (sdr.efetivacoesCount || 0)}
                                className="w-5 h-5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold disabled:opacity-40 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-xs text-neutral-900">{sdr.agendamentosCount || 0}</span>
                              <button
                                type="button"
                                onClick={() => onUpdateSDRMetrics(sdr.id, (sdr.agendamentosCount || 0) + 1, sdr.efetivacoesCount || 0)}
                                className="w-5 h-5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="bg-white border border-neutral-200/80 rounded-lg p-1.5">
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Efetivados</span>
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => onUpdateSDRMetrics(sdr.id, sdr.agendamentosCount || 0, Math.max(0, (sdr.efetivacoesCount || 0) - 1))}
                                disabled={(sdr.efetivacoesCount || 0) === 0}
                                className="w-5 h-5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold disabled:opacity-40 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-xs text-neutral-900">{sdr.efetivacoesCount || 0}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextVal = (sdr.efetivacoesCount || 0) + 1;
                                  const newAgend = Math.max(nextVal, sdr.agendamentosCount || 0);
                                  onUpdateSDRMetrics(sdr.id, newAgend, nextVal);
                                }}
                                className="w-5 h-5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Visual Metas progress bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-neutral-500 font-sans">
                            <span>Atingimento / Meta:</span>
                            <span className="font-mono font-bold text-neutral-800">
                              {conversionRate}% <span className="text-neutral-400 font-normal">({sdr.metaEfetivacaoRate || 50}% meta)</span>
                            </span>
                          </div>
                          <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                conversionRate >= (sdr.metaEfetivacaoRate || 50) ? 'bg-black' : 'bg-neutral-400'
                              }`}
                              style={{ width: `${Math.min(100, conversionRate)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* RENDER VIEW TAB: GOALS & ATTENTION POINTS */}
      {subTab === 'goals' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top critical warning panel representing: "Atenção aos pontos do mês" */}
          <div className="bg-amber-50 border border-amber-250 p-5 rounded-xl">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-2 font-display">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
              Pontos de Atenção Crítica no Mês Corrente
            </h3>
            <p className="text-xs text-amber-700 leading-relaxed max-w-4xl">
              Estes SDRs abaixo possuem metas desalinhadas ou estão operando abaixo das taxas mínimas de conversão. 
              Ao rodar o acasalamento do rodízio, o sistema poderá equilibrar os fluxos distribuindo assessores com melhores taxas de fechamento para compensá-los.
            </p>

            {/* Critical list overview */}
            <div className="mt-4 space-y-2">
              {criticalSDRs.length === 0 ? (
                <div className="bg-white border border-amber-100/50 p-3 rounded-lg text-xs text-neutral-500">
                  ✓ Excelente desempenho de equipe! Todos os SDRs ativos superaram ou igualaram as metas corporativas.
                </div>
              ) : (
                criticalSDRs.map(sdr => {
                  const rate = sdr.agendamentosCount > 0 ? Math.round((sdr.efetivacoesCount / sdr.agendamentosCount) * 100) : 0;
                  const sdrProgress = calculateGoalProgress([sdr], currentMonth);
                  const isBelowBooking = sdr.agendamentosCount < sdrProgress.expectedRealizedToday;
                  const isBelowRate = rate < (sdr.metaEfetivacaoRate || 50);

                  return (
                    <div key={sdr.id} className="bg-white border border-amber-200 p-3 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-550 block"></span>
                        <strong className="font-bold">{sdr.name}</strong>
                        <span className="text-[10px] text-neutral-400 font-mono">({sdr.team})</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono font-bold text-[11px]">
                        {isBelowBooking && (
                          <span className="text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                            Vol. Agend.: {sdr.agendamentosCount} / alvo hoje {sdrProgress.expectedRealizedToday}
                          </span>
                        )}
                        {isBelowRate && (
                          <span className="text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200/60">
                            Taxa Conv.: {rate}% / meta {sdr.metaEfetivacaoRate || 50}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Combined Team Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider block">Volume Acumulado do Time (Ativo)</span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2.5xl font-black text-black tracking-tight">{teamTotalAgendamentos}</span>
                  <span className="text-xs text-neutral-500">de {teamTotalMetaAgendamentos} agendamentos planejados</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-mono mb-1 text-neutral-500">
                  <span>Porcentagem atingida:</span>
                  <span className="font-bold text-black">
                    {teamTotalMetaAgendamentos > 0 ? Math.round((teamTotalAgendamentos / teamTotalMetaAgendamentos) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200/50">
                  <div 
                    className="bg-black h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, teamTotalMetaAgendamentos > 0 ? (teamTotalAgendamentos / teamTotalMetaAgendamentos) * 100 : 0)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider block">Eficiência de Efetivação Média</span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2.5xl font-black text-black tracking-tight">{teamConversionRate}%</span>
                  <span className="text-xs text-neutral-500">vs {teamAverageMetaRate}% média meta corporativa</span>
                </div>
              </div>

              <div className="mt-4 font-sans">
                <div className="flex justify-between text-[11px] font-mono mb-1 text-neutral-500">
                  <span>Status Operacional:</span>
                  <span className={`font-bold uppercase tracking-wider text-[10px] ${teamConversionRate >= teamAverageMetaRate ? 'text-neutral-800' : 'text-neutral-550'}`}>
                    {teamConversionRate >= teamAverageMetaRate ? '✓ Acima da Expectativa' : 'Abaixo da Expectativa'}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200/50">
                  <div 
                    className="bg-black h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, teamConversionRate)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick config individual metrics goals in tabulated view */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 font-display mb-2">
              <Target className="w-4 h-4 text-neutral-800" />
              Editar Políticas e Metas Individuais de SDRs
            </h3>

            {activeSDRs.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-500">
                Sem SDRs ativos para ajustar metas.
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="bg-neutral-50 p-3 border-b border-neutral-200 grid grid-cols-12 text-[10px] font-bold text-neutral-500 uppercase tracking-wider gap-2">
                  <div className="col-span-4">SDR</div>
                  <div className="col-span-2 text-center">Meta Agend.</div>
                  <div className="col-span-2 text-center">Meta Conv.%</div>
                  <div className="col-span-4 text-right">Caderno de Ação</div>
                </div>

                <div className="divide-y divide-neutral-150">
                  {activeSDRs.map(sdr => {
                    const isSdrEditing = editingId === sdr.id;
                    return (
                      <div key={sdr.id} className="p-3 grid grid-cols-12 text-xs items-center gap-2">
                        <div className="col-span-4 font-bold text-neutral-800">
                          {sdr.name}
                          <span className="block text-[9px] text-neutral-450 font-normal">{sdr.team}</span>
                        </div>
                        
                        <div className="col-span-2 text-center">
                          {isSdrEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={editMetaAgend}
                              onChange={e => setEditMetaAgend(Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-16 bg-neutral-50 border border-neutral-300 rounded text-center px-1.5 py-0.5 text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="font-mono font-bold text-neutral-700">{sdr.metaAgendamentos || 20}</span>
                          )}
                        </div>

                        <div className="col-span-2 text-center">
                          {isSdrEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editMetaEfet}
                              onChange={e => setEditMetaEfet(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                              className="w-16 bg-neutral-50 border border-neutral-300 rounded text-center px-1.5 py-0.5 text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="font-mono font-bold text-neutral-700">{sdr.metaEfetivacaoRate || 50}%</span>
                          )}
                        </div>

                        <div className="col-span-4 text-right">
                          {isSdrEditing ? (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2 py-0.5 text-[9px] bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-600 font-bold"
                              >
                                Sair
                              </button>
                              <button
                                onClick={() => handleSaveEdit(sdr.id)}
                                className="px-2.5 py-0.5 text-[9px] bg-black hover:bg-neutral-900 rounded text-white font-black"
                              >
                                Gravar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(sdr)}
                              className="px-2.5 py-1 text-[10px] font-bold bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-neutral-700 transition-colors cursor-pointer"
                            >
                              Configurar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-neutral-500 leading-relaxed font-sans">
              <strong>Métrica unificada de afinidade comercial:</strong> Unificar os indicadores de atenção mensais ajuda a entender a ociosidade ou sobrecarga sobre Assessores. O painel é sincronizado com as premissas de rodízio dinâmico mensal.
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
