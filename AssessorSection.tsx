import React, { useState } from 'react';
import { Assessor, SDR } from '../types';
import { 
  Users, Plus, Trash2, ToggleLeft, ToggleRight, X, 
  User, Edit2, Check, AlertTriangle, Link, RefreshCcw, Star, 
  Settings, Filter 
} from 'lucide-react';

interface AssessorSectionProps {
  assessores: Assessor[];
  sdrs: SDR[];
  onAddAssessor: (assessor: Omit<Assessor, 'id'>) => void;
  onDeleteAssessor: (id: string) => void;
  onToggleActiveAssessor: (id: string) => void;
  onUpdateAssessor: (id: string, updatedFields: Partial<Assessor>) => void;
}

export default function AssessorSection({
  assessores,
  sdrs,
  onAddAssessor,
  onDeleteAssessor,
  onToggleActiveAssessor,
  onUpdateAssessor,
}: AssessorSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [agendaLink, setAgendaLink] = useState('');
  const [team, setTeam] = useState('Equipe Alpha');
  const [exclusiveSdrIds, setExclusiveSdrIds] = useState<string[]>([]);
  const [participatesInRotation, setParticipatesInRotation] = useState(true);
  const [error, setError] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAgendaLink, setEditAgendaLink] = useState('');
  const [editTeam, setEditTeam] = useState('Equipe Alpha');
  const [editExclusiveSdrIds, setEditExclusiveSdrIds] = useState<string[]>([]);
  const [editParticipatesInRotation, setEditParticipatesInRotation] = useState(true);

  // Custom inline deletion confirmation helper
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter for display
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');

  const activeSDRs = sdrs.filter(s => s.active);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nome do assessor é obrigatório');
      return;
    }

    onAddAssessor({
      name: name.trim(),
      active: true,
      agendaLink: agendaLink.trim(),
      exclusiveSdrId: exclusiveSdrIds[0] || '',
      exclusiveSdrIds: exclusiveSdrIds,
      participatesInRotation: exclusiveSdrIds.length > 0 ? false : participatesInRotation,
      team: team,
    });

    setName('');
    setAgendaLink('');
    setExclusiveSdrIds([]);
    setParticipatesInRotation(true);
    setTeam('Equipe Alpha');
    setError('');
    setIsAdding(false);
  };

  const handleStartEdit = (assessor: Assessor) => {
    setEditingId(assessor.id);
    setEditName(assessor.name);
    setEditAgendaLink(assessor.agendaLink || '');
    setEditTeam(assessor.team || 'Equipe Alpha');
    let existingIds: string[] = [];
    if (Array.isArray(assessor.exclusiveSdrIds)) {
      existingIds = [...assessor.exclusiveSdrIds];
    } else if (assessor.exclusiveSdrId) {
      existingIds = [assessor.exclusiveSdrId];
    }
    setEditExclusiveSdrIds(existingIds);
    setEditParticipatesInRotation(assessor.participatesInRotation !== false);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    if (onUpdateAssessor) {
      onUpdateAssessor(id, {
        name: editName.trim(),
        agendaLink: editAgendaLink.trim(),
        team: editTeam,
        exclusiveSdrId: editExclusiveSdrIds[0] || '',
        exclusiveSdrIds: editExclusiveSdrIds,
        participatesInRotation: editExclusiveSdrIds.length > 0 ? false : editParticipatesInRotation
      });
    }
    setEditingId(null);
  };

  const filteredAssessores = selectedTeamFilter === 'all'
    ? assessores
    : assessores.filter(a => a.team === selectedTeamFilter);

  return (
    <div className="space-y-6">
      
      {/* Header Info Panel */}
      <div className="bg-white rounded-xl border border-neutral-200/90 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center gap-2 font-display">
            <Users className="w-4.5 h-4.5 text-neutral-850" />
            Configuração de Assessores de Negócio
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cadastre assessores parceiros, salve links de agendas operacionais e defina vínculos diretos ou participação rotativa.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isAdding 
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300' 
              : 'bg-black hover:bg-neutral-900 text-white shadow-xs'
          }`}
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isAdding ? 'Cancelar' : 'Cadastrar Assessor'}
        </button>
      </div>

      {/* Addition View Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-4 animate-fade-in">
          <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4.5 h-4.5 text-neutral-500" />
            Cadastrar Novo Assessor Parceiro
          </h3>
          
          {error && (
            <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Nome do Assessor / Categoria
              </label>
              <input
                type="text"
                placeholder="Ex: Rodrigo Mello (Sul Capital)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:ring-1 focus:ring-black focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Link da Agenda de Reuniões
              </label>
              <input
                type="url"
                placeholder="Ex: https://calendly.com/..."
                value={agendaLink}
                onChange={e => setAgendaLink(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-800 focus:ring-1 focus:ring-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Equipe / Célula
              </label>
              <select
                value={team}
                onChange={e => setTeam(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold focus:outline-none font-sans cursor-pointer"
              >
                <option value="Equipe Alpha">Equipe Alpha</option>
                <option value="Equipe Beta">Equipe Beta</option>
                <option value="Equipe Delta">Equipe Delta</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-3 border-t border-neutral-100 items-start">
            
            {/* Multi SDR selection and exclusiveness toggle */}
            <div className="md:col-span-8 space-y-2">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex justify-between items-center">
                <span>Vínculo Exclusivo com SDR(s) ?</span>
                <span className="text-[9px] text-amber-600 font-extrabold font-mono">Permite Múltiplos</span>
              </label>
              <p className="text-[10px] text-neutral-500 leading-normal mb-1.5">
                Selecione um ou mais SDRs exclusivos para este Assessor. Ao definir exclusividade, o Assessor é <strong>automaticamente desabilitado</strong> do rodízio livre do mês para atuar apenas com estes SDRs selecionados.
              </p>
              
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar">
                {activeSDRs.length === 0 ? (
                  <div className="text-[10px] text-neutral-450 italic p-1">Nenhum SDR Ativo Registrado</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeSDRs.map(sdr => {
                      const isChecked = exclusiveSdrIds.includes(sdr.id);
                      return (
                        <label key={sdr.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded border border-transparent hover:border-neutral-200 cursor-pointer text-xs font-medium text-neutral-700 transition-all">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (checked) {
                                setExclusiveSdrIds(prev => [...prev, sdr.id]);
                                setParticipatesInRotation(false);
                              } else {
                                setExclusiveSdrIds(prev => prev.filter(id => id !== sdr.id));
                              }
                            }}
                            className="rounded border-neutral-300 text-black focus:ring-black w-3.5 h-3.5"
                          />
                          <span className="truncate">{sdr.name} <span className="text-[9px] text-neutral-400 font-mono">({sdr.team})</span></span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Custom switcher for participates in rotation */}
            <div className="md:col-span-4 bg-neutral-50 border border-neutral-200 p-4 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Habilitar no Rodízio</span>
                <button
                  type="button"
                  disabled={exclusiveSdrIds.length > 0}
                  onClick={() => setParticipatesInRotation(!participatesInRotation)}
                  className={`p-1 rounded cursor-pointer transition-opacity ${exclusiveSdrIds.length > 0 ? 'opacity-40 cursor-not-allowed' : 'opacity-100'}`}
                >
                  {participatesInRotation && exclusiveSdrIds.length === 0 ? (
                    <ToggleRight className="w-7 h-7 text-black" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-neutral-300" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 leading-normal font-sans">
                {exclusiveSdrIds.length > 0 
                  ? "Indisponível: Assessores com vínculos exclusivos não entram no rodízio do mês." 
                  : "Se ligado, o assessor será integrado na rodada mensal equilibrada."}
              </p>
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-black hover:bg-neutral-900 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Salvar Assessor
            </button>
          </div>
        </form>
      )}

      {/* FILTER BAR */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-neutral-550" />
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
          Total de <strong className="text-black font-bold">{filteredAssessores.length}</strong> assessores parceiros cadastrados
        </div>
      </div>

      {/* MAIN LIST CARD VIEW */}
      {filteredAssessores.length === 0 ? (
        <div className="text-center py-12 bg-white border border-neutral-250 rounded-2xl">
          <Users className="w-10 h-10 text-neutral-350 mx-auto mb-2" />
          <h3 className="text-xs font-bold text-neutral-700 uppercase">Nenhum Assessor Cadastrado no Canal</h3>
          <p className="text-xs text-neutral-550 mt-1">Crie um novo assessor utilizando o botão "Cadastrar Assessor" acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
          {filteredAssessores.map(assessor => {
            const isEditing = editingId === assessor.id;
            const isDeleting = deletingId === assessor.id;

            // Get exclusive SDR names list
            let exclusiveSdrNames: string[] = [];
            let associatedIds: string[] = [];
            if (Array.isArray(assessor.exclusiveSdrIds)) {
              associatedIds = assessor.exclusiveSdrIds;
            } else if (assessor.exclusiveSdrId) {
              associatedIds = [assessor.exclusiveSdrId];
            }

            exclusiveSdrNames = associatedIds
              .map(id => sdrs.find(s => s.id === id)?.name || null)
              .filter((name): name is string => name !== null);

            return (
              <div
                key={assessor.id}
                className={`bg-white border rounded-xl p-5 flex flex-col justify-between relative transition-all ${
                  assessor.active 
                    ? 'border-neutral-200 hover:border-neutral-350 shadow-sm' 
                    : 'border-neutral-250 bg-neutral-50 opacity-60'
                }`}
              >
                <div>
                  {isEditing ? (
                    <div className="space-y-3 text-xs mb-3">
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-0.5">Nome do Editor</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1 focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-0.5">Equipe</label>
                          <select
                            value={editTeam}
                            onChange={e => setEditTeam(e.target.value)}
                            className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-[11px]"
                          >
                            <option value="Equipe Alpha">Equipe Alpha</option>
                            <option value="Equipe Beta">Equipe Beta</option>
                            <option value="Equipe Delta">Equipe Delta</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-0.5">Agenda</label>
                          <input
                            type="text"
                            value={editAgendaLink}
                            onChange={e => setEditAgendaLink(e.target.value)}
                            className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-[10px] font-mono text-xs"
                          />
                        </div>
                      </div>

                      {/* Editing multi-sdr exclusiveness */}
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold text-neutral-400 uppercase">SDRs Vinculados Exclusivos ({editExclusiveSdrIds.length})</label>
                        <div className="bg-neutral-50 border border-neutral-200 rounded p-2 max-h-24 overflow-y-auto space-y-1.5">
                          {activeSDRs.map(sdr => {
                            const isChecked = editExclusiveSdrIds.includes(sdr.id);
                            return (
                              <label key={sdr.id} className="flex items-center gap-1.5 cursor-pointer text-[11px] hover:bg-neutral-100 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    if (checked) {
                                      setEditExclusiveSdrIds(prev => [...prev, sdr.id]);
                                      setEditParticipatesInRotation(false);
                                    } else {
                                      setEditExclusiveSdrIds(prev => prev.filter(id => id !== sdr.id));
                                    }
                                  }}
                                  className="rounded border-neutral-300 text-black w-3.5 h-3.5 focus:ring-black"
                                />
                                <span className="truncate">{sdr.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-neutral-50 p-1.5 rounded border border-neutral-200 text-[10px]">
                        <span className="font-bold text-neutral-500 uppercase">Habilitado no Rodízio</span>
                        <button
                          type="button"
                          disabled={editExclusiveSdrIds.length > 0}
                          onClick={() => setEditParticipatesInRotation(!editParticipatesInRotation)}
                          className="p-0.5"
                        >
                          {editParticipatesInRotation && editExclusiveSdrIds.length === 0 ? (
                            <span className="text-black font-black uppercase tracking-wider text-[9px]">Sim</span>
                          ) : (
                            <span className="text-neutral-400 font-extrabold uppercase tracking-wider text-[9px]">Não</span>
                          )}
                        </button>
                      </div>

                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-0.5 bg-neutral-100 text-[10px] text-neutral-600 font-bold rounded"
                        >
                          Sair
                        </button>
                        <button
                          onClick={() => handleSaveEdit(assessor.id)}
                          className="px-2.5 py-0.5 bg-black text-[10px] text-white font-bold rounded"
                        >
                          Gravar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* View state of Assessor */}
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border ${
                            assorRating(assessor) 
                              ? 'bg-neutral-50 border-neutral-250 text-black' 
                              : 'bg-neutral-100 border-neutral-200 text-neutral-500'
                          }`}>
                            <span className="uppercase font-display font-black leading-none">{assessor.name.substring(0,2)}</span>
                          </div>

                          <div>
                            <h3 className="font-bold text-neutral-900 text-xs leading-snug">
                              {assessor.name}
                            </h3>
                            <div className="flex flex-col gap-0.5 mt-0.5 text-[9px] font-mono font-black text-neutral-450 uppercase">
                              <span>{assessor.team || 'Célula Alpha'} &bull; {assessor.active ? 'Ativo' : 'Inativo'}</span>
                              {assessor.agendaLink && (
                                <a 
                                  href={assessor.agendaLink.startsWith('http') ? assessor.agendaLink : `https://${assessor.agendaLink}`}
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[10px] font-bold text-neutral-600 hover:text-black underline mt-0.5 truncate max-w-[140px] lowercase"
                                >
                                  🔗 link de agenda
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Control bar */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => onToggleActiveAssessor(assessor.id)}
                            className="p-1 rounded hover:bg-neutral-100 text-neutral-450 transition-colors cursor-pointer"
                            title={assessor.active ? 'Desativar este assessor' : 'Ativar assessor'}
                          >
                            {assessor.active ? (
                              <ToggleRight className="w-5 h-5 text-neutral-800" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-neutral-350" />
                            )}
                          </button>

                          <button
                            onClick={() => handleStartEdit(assessor)}
                            className="p-1 rounded text-neutral-450 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {isDeleting ? (
                            <div className="absolute right-2 top-2 bg-white border border-neutral-300 p-2 rounded z-20 flex flex-col items-center gap-1.5 shadow-sm">
                              <span className="text-[9px] text-red-700 font-bold uppercase">Excluir?</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(null)}
                                  className="px-1.5 py-0.5 bg-neutral-100 text-[9px] rounded"
                                >
                                  Não
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteAssessor(assessor.id);
                                    setDeletingId(null);
                                  }}
                                  className="px-1.5 py-0.5 bg-red-650 text-white text-[9px] font-bold rounded"
                                >
                                  Sim
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(assessor.id)}
                              className="p-1 rounded text-neutral-400 hover:bg-neutral-105 hover:text-red-700 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Dynamic information status container representation of Assessor rules */}
                      <div className="mt-4 pt-3.5 border-t border-neutral-100 text-xs space-y-2">
                        {exclusiveSdrNames.length > 0 ? (
                          <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200">
                            <span className="text-[9px] text-amber-700 font-black uppercase tracking-wider block">💎 Vínculo Exclusivo Ativo</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {exclusiveSdrNames.map((sdrName, sidx) => (
                                <span key={sidx} className="bg-white border border-amber-200 text-amber-900 font-bold text-[9px] px-1.5 py-0.5 rounded">
                                  {sdrName}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : assessor.participatesInRotation !== false ? (
                          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                            <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block">🔄 Disponível no Rodízio</span>
                            <span className="text-[10px] text-neutral-450 block mt-0.5">Participa da divisão de carteira livre e otimizada mensal do time.</span>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-400">
                            <span className="text-[9px] font-bold uppercase tracking-wider block">⏹️ Fora do Rodízio</span>
                            <span className="text-[10px] block mt-0.5">Excluído das divisões do mês corrente por solicitação liderança.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

// Visual layout helper tag
function assorRating(assr: Assessor) {
  return assr.agendaLink && assr.active;
}
