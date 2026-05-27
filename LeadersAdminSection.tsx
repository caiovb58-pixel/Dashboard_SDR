import React, { useState } from 'react';
import { TeamLeader } from '../types';
import { Key, UserPlus, Trash2, Edit2, Check, X, Shield, Lock, Users } from 'lucide-react';

interface LeadersAdminSectionProps {
  leaders: TeamLeader[];
  onAddLeader: (leader: Omit<TeamLeader, 'id'>) => void;
  onUpdateLeader: (id: string, updatedFields: Partial<TeamLeader>) => void;
  onDeleteLeader: (id: string) => void;
}

export default function LeadersAdminSection({
  leaders,
  onAddLeader,
  onUpdateLeader,
  onDeleteLeader,
}: LeadersAdminSectionProps) {
  // Input form states
  const [formData, setFormData] = useState({
    name: '',
    teamName: '',
    leaderTitle: '',
    passcode: ''
  });

  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    teamName: '',
    leaderTitle: '',
    passcode: ''
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.teamName.trim() || !formData.leaderTitle.trim() || !formData.passcode.trim()) {
      setFormError('Todos os campos são obrigatórios para o cadastro.');
      return;
    }

    // Check duplicate team names
    const duplicateTeam = leaders.some(l => l.teamName.toLowerCase() === formData.teamName.trim().toLowerCase());
    if (duplicateTeam) {
      setFormError('Já existe um líder cadastrado para esta equipe. Cada equipe comercial deve possuir um líder responsável.');
      return;
    }

    onAddLeader({
      name: formData.name.trim(),
      teamName: formData.teamName.trim(),
      leaderTitle: formData.leaderTitle.trim(),
      passcode: formData.passcode.trim()
    });

    // Clear form
    setFormData({
      name: '',
      teamName: '',
      leaderTitle: '',
      passcode: ''
    });
  };

  const handleStartEdit = (leader: TeamLeader) => {
    setEditingId(leader.id);
    setEditFormData({
      name: leader.name,
      teamName: leader.teamName,
      leaderTitle: leader.leaderTitle,
      passcode: leader.passcode
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!editFormData.name.trim() || !editFormData.teamName.trim() || !editFormData.leaderTitle.trim() || !editFormData.passcode.trim()) {
      alert('Preencha todos os campos do gestor.');
      return;
    }

    // Check duplicate team (excluding current leader is fine)
    const duplicateTeam = leaders.some(l => l.id !== id && l.teamName.toLowerCase() === editFormData.teamName.trim().toLowerCase());
    if (duplicateTeam) {
      alert('Outro líder já responde por esta equipe.');
      return;
    }

    onUpdateLeader(id, {
      name: editFormData.name.trim(),
      teamName: editFormData.teamName.trim(),
      leaderTitle: editFormData.leaderTitle.trim(),
      passcode: editFormData.passcode.trim()
    });

    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Symmetrical Header Banner */}
      <div className="bg-white border-2 border-neutral-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-black text-[#FAF9F5] text-[9px] font-black uppercase tracking-widest rounded">
              Acesso Master
            </span>
            <h2 className="text-lg font-black uppercase tracking-tight text-neutral-950 font-display">
              Cadastro de Líderes Comerciais
            </h2>
          </div>
          <p className="text-xs text-neutral-600 max-w-2xl font-sans">
            Adicione gestores de times, defina credenciais individuais e vincule-os a novas células de prospecção. Os líderes cadastrados poderão gerenciar suas respectivas metas locais e consultar as orientações táticas de IA correspondentes.
          </p>
        </div>
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-center md:text-right">
          <span className="block text-[8px] font-black uppercase tracking-widest text-neutral-450 leading-none">
            Total Registrado
          </span>
          <span className="text-2xl font-black font-display text-neutral-950 align-baseline leading-none">
            {leaders.length}
          </span>
          <span className="text-xs text-neutral-500 font-bold ml-1 uppercase">Líderes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Form left block */}
        <div className="lg:col-span-5 bg-white border-2 border-neutral-900 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-105">
            <UserPlus className="w-4 h-4 text-neutral-900" />
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">
              Registrar Novo Líder
            </h3>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs font-bold text-red-700 rounded-lg text-center animate-fade-in">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                Nome do Gestor (Ex: Caio Santos)
              </label>
              <input
                type="text"
                placeholder="Insira o nome completo"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-medium focus:outline-none focus:border-neutral-900 transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                Nome da Equipe Comercial
              </label>
              <input
                type="text"
                placeholder="Ex: Equipe Hunter, Equipe Gamma, Equipe Alpha..."
                value={formData.teamName}
                onChange={e => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-850 focus:outline-none focus:border-neutral-900 transition-colors"
                required
              />
              <span className="block text-[8px] text-neutral-450 italic mt-0.5">
                Note: o líder acessará o sistema sob as métricas vinculadas a esse nome de equipe.
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                Cargo / Título Oficial
              </label>
              <input
                type="text"
                placeholder="Ex: Supervisor Comercial B2B, Team Leader Alpha..."
                value={formData.leaderTitle}
                onChange={e => setFormData(prev => ({ ...prev, leaderTitle: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-medium focus:outline-none focus:border-neutral-900 transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                Chave de Acesso (Passcode de Login)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Defina a senha/chave de acesso para este líder"
                  value={formData.passcode}
                  onChange={e => setFormData(prev => ({ ...prev, passcode: e.target.value }))}
                  className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
                  required
                />
                <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 text-[#FAF9F5] hover:text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              Salvar e Cadastrar Gestor
            </button>
          </form>
        </div>

        {/* Leaders Grid/List Block right */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border-2 border-neutral-900 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-105">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-neutral-900" />
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                  Gestores Cadastrados no Ecossistema
                </h3>
              </div>
              <span className="text-[9px] font-bold text-neutral-450 uppercase">
                Conselho RD Ativos
              </span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              {leaders.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-450">
                  Nenhum líder cadastrado no momento. Cadastre gestores no painel de controle esquerdo.
                </div>
              ) : (
                leaders.map(l => {
                  const isEditing = editingId === l.id;
                  return (
                    <div 
                      key={l.id} 
                      className={`p-4 border transition-all rounded-xl flex flex-col justify-between gap-4 ${
                        isEditing 
                          ? 'bg-neutral-50 border-neutral-900 ring-1 ring-neutral-950/5' 
                          : 'bg-[#FCFBF8] hover:bg-white border-neutral-250 hover:border-neutral-400 hover:shadow-xs'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-3 w-full">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-neutral-400">Nome do Gestor</label>
                              <input 
                                type="text"
                                value={editFormData.name}
                                onChange={e => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full p-2 bg-white border border-neutral-300 rounded text-xs font-medium"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-neutral-400">Canal / Equipe</label>
                              <input 
                                type="text"
                                value={editFormData.teamName}
                                onChange={e => setEditFormData(prev => ({ ...prev, teamName: e.target.value }))}
                                className="w-full p-2 bg-white border border-neutral-300 rounded text-xs font-bold text-neutral-800"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-neutral-400">Cargo</label>
                              <input 
                                type="text"
                                value={editFormData.leaderTitle}
                                onChange={e => setEditFormData(prev => ({ ...prev, leaderTitle: e.target.value }))}
                                className="w-full p-2 bg-white border border-neutral-300 rounded text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-neutral-400">Senha (Passcode)</label>
                              <input 
                                type="text"
                                value={editFormData.passcode}
                                onChange={e => setEditFormData(prev => ({ ...prev, passcode: e.target.value }))}
                                className="w-full p-2 bg-white border border-neutral-300 rounded text-xs font-mono font-bold"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-600 bg-neutral-200 hover:bg-neutral-300 rounded flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" /> Cancelar
                            </button>
                            <button
                              onClick={() => handleSaveEdit(l.id)}
                              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white bg-black hover:opacity-95 rounded flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3 text-white" /> Salvar Alterações
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2 w-full">
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-neutral-900 text-xs">
                                {l.name}
                              </span>
                              <span className="text-[9px] bg-black text-[#FAF9F5] font-black px-1.5 py-0.5 rounded leading-none">
                                {l.teamName}
                              </span>
                            </div>
                            
                            <p className="text-[10px] font-medium text-neutral-500">
                              {l.leaderTitle}
                            </p>

                            <div className="flex items-center gap-3 pt-1.5">
                              <div className="flex items-center gap-1 text-[10px] text-neutral-600 font-mono">
                                <Key className="w-3 h-3 text-neutral-400" />
                                <span>Chave:</span>
                                <span className="font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 px-1 rounded">
                                  {l.passcode}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStartEdit(l)}
                              className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                              title="Editar Gestor comercial"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja revogar o acesso comercial de ${l.name} (${l.teamName})?`)) {
                                  onDeleteLeader(l.id);
                                }
                              }}
                              className="p-1.5 text-neutral-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Remover Acesso do Gestor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
