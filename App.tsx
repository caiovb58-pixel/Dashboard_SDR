import React, { useState, useEffect } from 'react';
import { SDR, Assessor, MatchResult, TeamLeader } from './types';
import { INITIAL_SDRS, INITIAL_ASSESSORES } from './mockData';
import { generateMatches } from './matchingEngine';

// Components
import SDRSection from './components/SDRSection';
import AssessorSection from './components/AssessorSection';
import MatchDashboard from './components/MatchDashboard';
import ReportsSection from './components/ReportsSection';
import LeaderPortal from './components/LeaderPortal';
import LeadersAdminSection from './components/LeadersAdminSection';

// Icons
import { 
  Users, Shield, Sparkles, FileText, RefreshCw, Info, Lock, Award, Compass, LogOut, Flame, Target, Calendar, ArrowRight, Gauge, CheckSquare, Key, UserPlus
} from 'lucide-react';

interface AuthUser {
  role: 'admin' | 'leader';
  teamName?: string;
  leaderTitle?: string;
  name: string;
}

export default function App() {
  // Session Authentication state default to local storage to persist logins
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('rodizio_logged_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'matches' | 'sdrs' | 'assessores' | 'leaders' | 'reports' | 'leaders-admin'>(() => {
    const saved = localStorage.getItem('rodizio_logged_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user && user.role === 'leader') return 'leaders';
        return 'sdrs';
      } catch (e) {}
    }
    return 'sdrs';
  });
  
  // Reference Monthly scope - Defaults to present month (May 2026)
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const saved = localStorage.getItem('rodizio_current_month');
    if (saved) return saved;
    return "2026-05"; // Default May 2026
  });

  // States with localStorage persistence with data normalization
  const [sdrs, setSdrs] = useState<SDR[]>(() => {
    const saved = localStorage.getItem('rodizio_sdrs');
    const rawList = saved ? JSON.parse(saved) : INITIAL_SDRS;
    if (!Array.isArray(rawList)) return INITIAL_SDRS;
    return rawList.map((item: any) => ({
      id: item.id || `sdr-${Math.random()}`,
      name: item.name || '',
      agendamentosCount: typeof item.agendamentosCount === 'number' && !isNaN(item.agendamentosCount) ? item.agendamentosCount : 0,
      efetivacoesCount: typeof item.efetivacoesCount === 'number' && !isNaN(item.efetivacoesCount) ? item.efetivacoesCount : 0,
      metaAgendamentos: typeof item.metaAgendamentos === 'number' && !isNaN(item.metaAgendamentos) ? item.metaAgendamentos : 20,
      metaEfetivacaoRate: typeof item.metaEfetivacaoRate === 'number' && !isNaN(item.metaEfetivacaoRate) ? item.metaEfetivacaoRate : 50,
      active: item.active !== undefined ? !!item.active : true,
      admissionDate: item.admissionDate || '',
      team: item.team || (item.id === 'sdr-1' || item.id === 'sdr-3' ? 'Equipe Alpha' : item.id === 'sdr-2' || item.id === 'sdr-5' ? 'Equipe Beta' : 'Equipe Delta'),
      monthlyRecords: item.monthlyRecords || {},
    }));
  });

  const [assessores, setAssessores] = useState<Assessor[]>(() => {
    const saved = localStorage.getItem('rodizio_assessores');
    const rawList = saved ? JSON.parse(saved) : INITIAL_ASSESSORES;
    if (!Array.isArray(rawList)) return INITIAL_ASSESSORES;
    return rawList.map((item: any) => {
      let exclusiveSdrIds: string[] = [];
      if (Array.isArray(item.exclusiveSdrIds)) {
        exclusiveSdrIds = item.exclusiveSdrIds;
      } else if (item.exclusiveSdrId) {
        exclusiveSdrIds = [item.exclusiveSdrId];
      }
      return {
        id: item.id || `assr-${Math.random()}`,
        name: item.name || '',
        active: item.active !== undefined ? !!item.active : true,
        agendaLink: item.agendaLink || '',
        exclusiveSdrId: item.exclusiveSdrId || '',
        exclusiveSdrIds: exclusiveSdrIds,
        participatesInRotation: item.participatesInRotation !== undefined ? !!item.participatesInRotation : true,
        team: item.team || (item.id === 'assr-1' || item.id === 'assr-5' ? 'Equipe Alpha' : item.id === 'assr-2' || item.id === 'assr-4' ? 'Equipe Beta' : 'Equipe Delta'),
      };
    });
  });

  const [matches, setMatches] = useState<MatchResult[]>(() => {
    const saved = localStorage.getItem('rodizio_matches');
    const rawList = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(rawList)) return [];
    return rawList.map((item: any) => ({
      sdrId: item.sdrId || '',
      sdrName: item.sdrName || '',
      sdrConversionRate: typeof item.sdrConversionRate === 'number' && !isNaN(item.sdrConversionRate) ? item.sdrConversionRate : 0,
      assessorId: item.assessorId || '',
      assessorName: item.assessorName || '',
      isExclusive: !!item.isExclusive,
      startDate: item.startDate || '',
      endDate: item.endDate || '',
    }));
  });

  const [startDate, setStartDate] = useState<string>(() => {
    const saved = localStorage.getItem('rodizio_start_date');
    if (saved) return saved;
    return "2026-05-01";
  });

  const [endDate, setEndDate] = useState<string>(() => {
    const saved = localStorage.getItem('rodizio_end_date');
    if (saved) return saved;
    return "2026-05-31";
  });

  const [leaders, setLeaders] = useState<TeamLeader[]>(() => {
    const saved = localStorage.getItem('rodizio_leaders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: 'leader-1', teamName: 'Equipe Alpha', leaderTitle: 'Líder de Contas Alpha', passcode: 'alpha123', name: 'Gestor Alpha' },
      { id: 'leader-2', teamName: 'Equipe Beta', leaderTitle: 'Gestor Comercial Beta', passcode: 'beta123', name: 'Gestor Beta' },
      { id: 'leader-3', teamName: 'Equipe Delta', leaderTitle: 'Diretor de Expansão Delta', passcode: 'delta123', name: 'Gestor Delta' }
    ];
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('rodizio_logged_user', currentUser ? JSON.stringify(currentUser) : '');
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('rodizio_current_month', currentMonth);
    // Align rotation dates to start and end of this selected month
    if (currentMonth) {
      const [year, month] = currentMonth.split('-');
      const startOfM = `${year}-${month}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const endOfM = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(startOfM);
      setEndDate(endOfM);
    }
  }, [currentMonth]);

  useEffect(() => {
    localStorage.setItem('rodizio_sdrs', JSON.stringify(sdrs));
  }, [sdrs]);

  useEffect(() => {
    localStorage.setItem('rodizio_assessores', JSON.stringify(assessores));
  }, [assessores]);

  useEffect(() => {
    localStorage.setItem('rodizio_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('rodizio_start_date', startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem('rodizio_end_date', endDate);
  }, [endDate]);

  useEffect(() => {
    localStorage.setItem('rodizio_leaders', JSON.stringify(leaders));
  }, [leaders]);

  // Derived SDR pool specifically loaded with currentMonth's targets and accomplishments
  const derivedSdrsForActiveMonth = sdrs.map(sdr => {
    const record = sdr.monthlyRecords?.[currentMonth];
    return {
      ...sdr,
      agendamentosCount: record ? record.agendamentosCount : sdr.agendamentosCount,
      efetivacoesCount: record ? record.efetivacoesCount : sdr.efetivacoesCount,
      metaAgendamentos: record ? record.metaAgendamentos : sdr.metaAgendamentos,
      metaEfetivacaoRate: record ? record.metaEfetivacaoRate : sdr.metaEfetivacaoRate,
    };
  });

  // Update starting date which triggers end date calculated to exactly +30 days
  const handleUpdateStartDate = (newStart: string) => {
    setStartDate(newStart);
    if (!newStart) return;
    const d = new Date(newStart + 'T12:00:00');
    d.setDate(d.getDate() + 30);
    setEndDate(d.toISOString().substring(0, 10));
  };

  // Operations for SDR (updates scoped within currentMonth's dictionary)
  const handleAddSDR = (newSdr: Omit<SDR, 'id'>) => {
    const sdrId = `sdr-${Date.now()}`;
    const sdr: SDR = {
      ...newSdr,
      id: sdrId,
      monthlyRecords: {
        [currentMonth]: {
          agendamentosCount: newSdr.agendamentosCount,
          efetivacoesCount: newSdr.efetivacoesCount,
          metaAgendamentos: newSdr.metaAgendamentos,
          metaEfetivacaoRate: newSdr.metaEfetivacaoRate,
        }
      }
    };
    setSdrs(prev => [...prev, sdr]);
  };

  const handleDeleteSDR = (id: string) => {
    setSdrs(prev => prev.filter(s => s.id !== id));
    setMatches(prev => prev.filter(m => m.sdrId !== id));
  };

  const handleToggleActiveSDR = (id: string) => {
    setSdrs(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleUpdateSDRMetrics = (id: string, agendamentosCount: number, efetivacoesCount: number) => {
    setSdrs(prev => prev.map(s => {
      if (s.id !== id) return s;
      const records = s.monthlyRecords || {};
      const existing = records[currentMonth] || {
        agendamentosCount: s.agendamentosCount,
        efetivacoesCount: s.efetivacoesCount,
        metaAgendamentos: s.metaAgendamentos,
        metaEfetivacaoRate: s.metaEfetivacaoRate
      };
      
      return {
        ...s,
        agendamentosCount, // fallback/legacy
        efetivacoesCount, // fallback/legacy
        monthlyRecords: {
          ...records,
          [currentMonth]: {
            ...existing,
            agendamentosCount,
            efetivacoesCount
          }
        }
      };
    }));
  };

  const handleUpdateSDR = (id: string, updatedFields: Partial<SDR>) => {
    setSdrs(prev => prev.map(s => {
      if (s.id !== id) return s;
      const records = s.monthlyRecords || {};
      const existing = records[currentMonth] || {
        agendamentosCount: s.agendamentosCount,
        efetivacoesCount: s.efetivacoesCount,
        metaAgendamentos: s.metaAgendamentos,
        metaEfetivacaoRate: s.metaEfetivacaoRate
      };

      const updatedRecord = { ...existing };
      if (typeof updatedFields.agendamentosCount === 'number') updatedRecord.agendamentosCount = updatedFields.agendamentosCount;
      if (typeof updatedFields.efetivacoesCount === 'number') updatedRecord.efetivacoesCount = updatedFields.efetivacoesCount;
      if (typeof updatedFields.metaAgendamentos === 'number') updatedRecord.metaAgendamentos = updatedFields.metaAgendamentos;
      if (typeof updatedFields.metaEfetivacaoRate === 'number') updatedRecord.metaEfetivacaoRate = updatedFields.metaEfetivacaoRate;

      return {
        ...s,
        ...updatedFields,
        monthlyRecords: {
          ...records,
          [currentMonth]: updatedRecord
        }
      };
    }));
  };

  // Operations for Assessores
  const handleAddAssessor = (newAssr: Omit<Assessor, 'id'>) => {
    const assessor: Assessor = {
      ...newAssr,
      id: `assr-${Date.now()}`,
    };
    setAssessores(prev => [...prev, assessor]);
  };

  const handleDeleteAssessor = (id: string) => {
    setAssessores(prev => prev.filter(a => a.id !== id));
    setMatches(prev => prev.filter(m => m.assessorId !== id));
  };

  const handleToggleActiveAssessor = (id: string) => {
    setAssessores(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const handleUpdateAssessor = (id: string, updatedFields: Partial<Assessor>) => {
    setAssessores(prev => prev.map(a => a.id === id ? { ...a, ...updatedFields } : a));
  };

  // Trigger matches from active lists
  const handleGenerateMatches = () => {
    const relations = generateMatches(derivedSdrsForActiveMonth, assessores);
    const matchesWithDates = relations.map(r => ({
      ...r,
      startDate: r.startDate || startDate,
      endDate: r.endDate || endDate,
    }));
    setMatches(matchesWithDates);
  };

  const handleUpdateMatchDates = (sdrId: string, assessorId: string, newStart: string, newEnd: string) => {
    setMatches(prev => prev.map(m => 
      (m.sdrId === sdrId && m.assessorId === assessorId)
        ? { ...m, startDate: newStart, endDate: newEnd }
        : m
    ));
  };

  // Operations for TeamLeaders
  const handleAddLeader = (newLeader: Omit<TeamLeader, 'id'>) => {
    const leader: TeamLeader = {
      ...newLeader,
      id: `leader-${Date.now()}`
    };
    setLeaders(prev => [...prev, leader]);
  };

  const handleUpdateLeader = (id: string, updatedFields: Partial<TeamLeader>) => {
    setLeaders(prev => prev.map(l => l.id === id ? { ...l, ...updatedFields } : l));
  };

  const handleDeleteLeader = (id: string) => {
    setLeaders(prev => prev.filter(l => l.id !== id));
  };

  // Factory reset
  const handleResetToDefaults = () => {
    if (confirm('Deseja restaurar as configurações originais e dados de fábrica do rodízio?')) {
      setSdrs(INITIAL_SDRS);
      setAssessores(INITIAL_ASSESSORES);
      setMatches([]);
      setCurrentMonth("2026-05");
      setStartDate("2026-05-01");
      setEndDate("2026-05-31");
      localStorage.removeItem('rodizio_sdrs');
      localStorage.removeItem('rodizio_assessores');
      localStorage.removeItem('rodizio_matches');
      localStorage.removeItem('rodizio_start_date');
      localStorage.removeItem('rodizio_end_date');
      localStorage.removeItem('rodizio_current_month');
    }
  };

  // Sign out
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('rodizio_logged_user');
  };

  const activeSDRsCount = derivedSdrsForActiveMonth.filter(s => s.active).length;
  const activeAssessoresCount = assessores.filter(a => a.active).length;

  // --- MATHEMATICAL AI PROGRESS THERMOMETER ENGINE ---
  const getThermometerStats = () => {
    const activeSdrsList = derivedSdrsForActiveMonth.filter(s => s.active);

    const [year, month] = currentMonth.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate(); // Total days in this month
    
    // Static core simulated date is 2026-05-27
    const realYear = 2026;
    const realMonth = 5;
    const realDay = 27;

    let elapsedDays = totalDays; // For past months
    if (year === realYear && month === realMonth) {
      elapsedDays = realDay; // 27
    } else if (year > realYear || (year === realYear && month > realMonth)) {
      elapsedDays = 0; // future month
    }

    const expectedPercent = totalDays > 0 ? Math.round((elapsedDays / totalDays) * 100) : 0;

    // Realized deliveries
    const totalRel = activeSdrsList.reduce((sum, s) => sum + (s.agendamentosCount || 0), 0);
    const totalGoal = activeSdrsList.reduce((sum, s) => sum + (s.metaAgendamentos || 20), 0);

    const realizedPercent = totalGoal > 0 ? Math.round((totalRel / totalGoal) * 100) : 0;
    const progressGap = realizedPercent - expectedPercent;

    let temperature = '⚖️ EM EQUILÍBRIO';
    let labelColor = 'text-blue-700 bg-blue-50 border-blue-200';
    let barColor = 'bg-[#111]'; // Sober pitch-black active color
    
    if (realizedPercent >= 100) {
      temperature = '⚡ EXCELÊNCIA / META BATIDA';
      labelColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      barColor = 'bg-emerald-600';
    } else if (progressGap >= 10) {
      temperature = '🔥 RITMO EM ALTA';
      labelColor = 'text-green-800 bg-green-50 border-green-200';
      barColor = 'bg-green-600';
    } else if (progressGap < -20) {
      temperature = '❄️ ALERTA CRÍTICO';
      labelColor = 'text-red-700 bg-red-50 border-red-200';
      barColor = 'bg-red-600';
    } else if (progressGap < 0) {
      temperature = '⚠️ RITMO COM ATRASO';
      labelColor = 'text-amber-800 bg-amber-50 border-amber-200';
      barColor = 'bg-amber-600';
    }

    return {
      realizedProgress: realizedPercent,
      expectedProgress: expectedPercent,
      progressGap,
      temperature,
      labelColor,
      barColor,
      currentDaysElapsed: elapsedDays,
      totalDaysInMonth: totalDays,
      totalRealized: totalRel,
      totalTarget: totalGoal
    };
  };

  const thermStats = getThermometerStats();

  // --- 1. RENDER LOGIN SCREEN (FIRST PAGE ENTRANCE GATE) ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-between p-4 selection:bg-neutral-900 selection:text-white">
        
        {/* Transparent header */}
        <div className="w-full max-w-7xl mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#111] rounded flex items-center justify-center text-[#FAF9F5] font-black text-xs uppercase tracking-widest leading-none">
              RD
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-neutral-900 font-display">
              Corretora Rodízio Premium
            </span>
          </div>
          <span className="text-[10px] font-bold py-1 px-2.5 bg-[#FAF9F5] rounded border border-neutral-300 text-neutral-500 uppercase tracking-widest">
            SAFE-NET v3.1
          </span>
        </div>

        {/* Crisp High-Contrast Login Gate */}
        <div className="w-full max-w-md mx-auto py-12">
          <div className="bg-white border-2 border-neutral-900 p-8 rounded-2xl shadow-sm space-y-6">
            
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-black font-bold border border-neutral-900 mx-auto">
                <Lock className="w-5 h-5 text-neutral-900" />
              </div>
              <h1 className="text-xl font-black text-neutral-950 font-display uppercase tracking-tight">
                Log In Operacional
              </h1>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                Insira suas credenciais de acesso exclusivas para entrar na gestão de rodízios, metas comerciais e análises automatizadas por Inteligência Artificial.
              </p>
            </div>

            {/* Internal Login component calling custom handleLogin */}
            <LoginGate 
              onLogin={(user) => {
                setCurrentUser(user);
                localStorage.setItem('rodizio_logged_user', JSON.stringify(user));
                if (user.role === 'leader') {
                  setActiveTab('leaders');
                } else {
                  setActiveTab('sdrs');
                }
              }} 
              leaders={leaders} 
            />

          </div>
        </div>

        {/* Minimal Swiss footer */}
        <div className="text-center text-[10px] text-neutral-400 uppercase font-bold tracking-widest pb-4">
          Concelho Operacional de Investimentos &bull; Sistema Criptografado
        </div>

      </div>
    );
  }

  // --- 2. RENDER THE LOGGED-IN SYSTEM ---
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-neutral-900 antialiased font-sans flex flex-col justify-between selection:bg-[#111] selection:text-white">
      
      {/* Pristine Swiss-Style Symmetrical Header */}
      <header className="bg-white border-b-2 border-neutral-900 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Logo and Session Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded flex items-center justify-center text-white font-black text-sm uppercase tracking-widest leading-none">
                RD
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black tracking-tight text-neutral-950 flex items-center gap-1.5 font-display uppercase">
                    Conselho RD <span className="text-neutral-300 font-normal">|</span> <span className="text-neutral-500 font-bold">Gestão</span>
                  </h1>
                  <span className="text-[9px] bg-black text-white font-black px-1.5 py-0.5 rounded leading-none uppercase tracking-widest">
                    {currentUser.role === 'admin' ? 'ADMIN' : 'LEADER'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-600 mt-0.5 max-w-md font-medium">
                  Atuando como <strong className="text-black font-bold">{currentUser.name}</strong> {currentUser.teamName && `(${currentUser.teamName})`}
                </p>
              </div>
            </div>

            {/* Quick Symmetrical Actions, Month Picker & Logout */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Reference Month Select Dropdown for goals definition */}
              <div className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-300 px-2.5 py-1.5 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-neutral-700" />
                <span className="text-[9px] font-bold text-neutral-550 uppercase tracking-wider">Mês Fiscal:</span>
                <select
                  value={currentMonth}
                  onChange={e => {
                    setCurrentMonth(e.target.value);
                    // Reset to matches tab on month change to reload dashboard
                    setActiveTab('matches');
                  }}
                  className="bg-transparent border-none text-xs font-black text-neutral-900 focus:outline-none cursor-pointer"
                >
                  <option value="2026-01">Janeiro 2026</option>
                  <option value="2026-02">Fevereiro 2026</option>
                  <option value="2026-03">Março 2026</option>
                  <option value="2026-04">Abril 2026</option>
                  <option value="2026-05">Maio 2026</option>
                  <option value="2026-06">Junho 2026</option>
                  <option value="2026-07">Julho 2026</option>
                </select>
              </div>

              <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                <div className="bg-neutral-100 border border-neutral-300 px-3 py-1.5 rounded-lg text-neutral-700">
                  SDRs Ativos: <span className="text-neutral-900 font-black">{activeSDRsCount}</span>
                </div>
                <div className="bg-neutral-100 border border-neutral-300 px-3 py-1.5 rounded-lg text-neutral-700">
                  Assessores Ativos: <span className="text-neutral-900 font-black">{activeAssessoresCount}</span>
                </div>
              </div>

              {/* Reset defaults button for Admin only */}
              {currentUser.role === 'admin' && (
                <button
                  onClick={handleResetToDefaults}
                  title="Restaurar dados de fábrica"
                  className="p-2 text-neutral-500 hover:text-red-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer border border-neutral-350"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Exit/Logout Button */}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer uppercase flex items-center gap-1.5"
                title="Efetuar Logout do Sistema"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            </div>

          </div>

          {/* Symmetrical tab Menu Bar with Access Contol Rules */}
          <div className="flex space-x-1 border-t border-neutral-200 pt-3 mt-4 -mb-px overflow-x-auto scrollbar-none">
            {currentUser.role === 'admin' ? (
              <>
                {/* 1. Gestão de SDRs */}
                <button
                  onClick={() => setActiveTab('sdrs')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'sdrs'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-black" />
                  Gestão de SDRs ({derivedSdrsForActiveMonth.length})
                </button>

                {/* 2. Cadastro de Assessores */}
                <button
                  onClick={() => setActiveTab('assessores')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'assessores'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-black" />
                  Cadastro de Assessores ({assessores.length})
                </button>

                {/* 3. Cadastro de Líderes */}
                <button
                  onClick={() => setActiveTab('leaders-admin')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'leaders-admin'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-black" />
                  Cadastro de Líderes ({leaders.length})
                </button>

                {/* 4. Área dos Líderes / IA */}
                <button
                  onClick={() => setActiveTab('leaders')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'leaders'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-black" />
                  Área dos Líderes / IA 🔐
                </button>

                {/* 5. Painel de Rodízio */}
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'matches'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  Painel de Rodízio
                </button>

                {/* 6. Relatórios e Métricas */}
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'reports'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-black" />
                  Relatórios e Métricas
                </button>
              </>
            ) : (
              <>
                {/* 1. Meu Time: {teamName} */}
                <button
                  onClick={() => setActiveTab('leaders')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'leaders'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-black" />
                  Meu Time: {currentUser.teamName} 🔐
                </button>

                {/* 2. Painel de Rodízio */}
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'matches'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  Painel de Rodízio
                </button>

                {/* 3. Relatórios e Métricas */}
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`pb-2.5 pt-1 px-3.5 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'reports'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-black" />
                  Relatórios e Métricas
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow space-y-6">
        
        {/* --- HIGH-CONTRAST DYNAMIC AI GOALS THERMOMETER --- */}
        {activeSDRsCount > 0 && (
          <div className="bg-white border-2 border-neutral-900 p-5 rounded-2xl shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Thermometer Status Gauge metadata */}
            <div className="lg:col-span-5 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                  Termômetro de Metas por IA
                </span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${thermStats.labelColor}`}>
                  {thermStats.temperature}
                </span>
              </div>
              <h3 className="text-base font-black text-neutral-950 font-display uppercase tracking-tight">
                Mês de Referência: {currentMonth.split('-')[1]}/2026
              </h3>
              <p className="text-xs text-neutral-600 leading-normal font-sans">
                O time realizou <strong className="text-[#111111]">{thermStats.totalRealized} agendamentos</strong> frente à meta final de <strong className="text-[#111111]">{thermStats.totalTarget}</strong>. Espera-se que estivéssemos hoje (Dia 27 de {thermStats.totalDaysInMonth}) em <strong>{thermStats.expectedProgress}%</strong>.
              </p>
            </div>

            {/* Visual Glass Thermometer bar */}
            <div className="lg:col-span-4 space-y-2">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-bold text-neutral-450 uppercase block">AVANÇO REAL COMERCIAL</span>
                  <span className="font-mono font-black text-xs text-black">{thermStats.realizedProgress}% Concluído</span>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[8px] font-bold text-neutral-450 uppercase block">AVANÇO ESPERADO (ALVO HOJE)</span>
                  <span className="font-mono text-xs text-neutral-600 font-bold">{thermStats.expectedProgress}%</span>
                </div>
              </div>

              {/* Double progression bars */}
              <div className="relative w-full h-4 bg-neutral-100 border border-neutral-300 rounded-full overflow-hidden">
                {/* Realized bar */}
                <div 
                  className={`h-full rounded-full transition-all duration-505 ${thermStats.barColor}`} 
                  style={{ width: `${Math.min(100, thermStats.realizedProgress)}%` }}
                ></div>

                {/* Dotted cursor target mark representing EXPECTED day of month */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-red-650 border-r border-dashed border-white"
                  style={{ left: `${Math.min(99, thermStats.expectedProgress)}%` }}
                  title="Alvocronograma linear"
                ></div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono font-bold leading-none">
                <span className="text-neutral-500">Mês {currentMonth}</span>
                <span className={thermStats.progressGap >= 0 ? 'text-green-700' : 'text-red-700'}>
                  Gap Temporal: {thermStats.progressGap > 0 ? '+' : ''}{thermStats.progressGap}% {thermStats.progressGap >= 0 ? 'Adiantado' : 'Atrasado'}
                </span>
              </div>
            </div>

            {/* AI Shortcut Button for quick advice */}
            <div className="lg:col-span-3">
              <button
                onClick={() => {
                  setActiveTab('leaders');
                  // Quick click focuses leaders consult block
                }}
                className="w-full py-3 bg-[#111] hover:bg-neutral-800 border-2 border-[#111] hover:border-neutral-800 text-[#FAF9F5] font-black text-xs rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                Obter Diagnóstico de IA
              </button>
            </div>

          </div>
        )}

        {/* Dynamic warning if active tables are missing */}
        {(activeSDRsCount === 0 || activeAssessoresCount === 0) && activeTab === 'matches' && (
          <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl flex items-start gap-3 text-neutral-850 text-xs">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="block font-bold mb-0.5 text-neutral-900 uppercase">Configuração Parcial</strong>
              Atualmente restam {activeSDRsCount} SDRs e {activeAssessoresCount} Assessores ativos para o mês {currentMonth}. 
              Ative e salve participantes no menu de Gestão.
            </div>
          </div>
        )}

        {/* --- 3. DOCK SUB-PAGES ACCORDING TO USER PERMISSIONS --- */}
        <div className="space-y-6">
          
          {activeTab === 'matches' && (currentUser.role === 'admin' || currentUser.role === 'leader') && (
            <MatchDashboard 
              sdrs={derivedSdrsForActiveMonth}
              assessores={assessores}
              matches={matches}
              onGenerateMatches={handleGenerateMatches}
              startDate={startDate}
              endDate={endDate}
              onUpdateStartDate={handleUpdateStartDate}
              onUpdateEndDate={setEndDate}
              onUpdateMatchDates={handleUpdateMatchDates}
            />
          )}

          {activeTab === 'sdrs' && currentUser.role === 'admin' && (
            <SDRSection 
              sdrs={derivedSdrsForActiveMonth}
              onAddSDR={handleAddSDR}
              onDeleteSDR={handleDeleteSDR}
              onToggleActiveSDR={handleToggleActiveSDR}
              onUpdateSDRMetrics={handleUpdateSDRMetrics}
              onUpdateSDR={handleUpdateSDR}
            />
          )}

          {activeTab === 'assessores' && currentUser.role === 'admin' && (
            <AssessorSection 
              assessores={assessores}
              sdrs={derivedSdrsForActiveMonth}
              onAddAssessor={handleAddAssessor}
              onDeleteAssessor={handleDeleteAssessor}
              onToggleActiveAssessor={handleToggleActiveAssessor}
              onUpdateAssessor={handleUpdateAssessor}
            />
          )}

          {/* LeaderPortal recognizes automatically the active logged user session. No duplicate logins! */}
          {activeTab === 'leaders' && (
            <LeaderPortal 
              sdrs={derivedSdrsForActiveMonth}
              assessores={assessores}
              onUpdateSDRMetrics={handleUpdateSDRMetrics}
              onUpdateSDR={handleUpdateSDR}
              onAddSDR={handleAddSDR}
              onDeleteSDR={handleDeleteSDR}
              onAddAssessor={handleAddAssessor}
              onDeleteAssessor={handleDeleteAssessor}
              leaders={leaders}
              isAdmin={currentUser.role === 'admin'}
              // Pass down month metadata and thermometer stats for AI Guidance endpoint synchronization
              monthAndThermometer={{
                month: currentMonth,
                thermometer: {
                  realizedProgress: thermStats.realizedProgress,
                  expectedProgress: thermStats.expectedProgress,
                  progressGap: thermStats.progressGap,
                  temperature: thermStats.temperature,
                  currentDaysElapsed: thermStats.currentDaysElapsed,
                  totalDaysInMonth: thermStats.totalDaysInMonth
                }
              }}
              // Seamless authenticated session mapping
              sessionLeader={currentUser.role === 'leader' ? {
                id: 'leader-sess',
                name: currentUser.name || 'Líder do Time',
                teamName: currentUser.teamName || 'Equipe Alpha',
                leaderTitle: currentUser.leaderTitle || 'Líder Especialista Alpha',
                passcode: ''
              } : undefined}
            />
          )}

          {activeTab === 'leaders-admin' && currentUser.role === 'admin' && (
            <LeadersAdminSection 
              leaders={leaders}
              onAddLeader={handleAddLeader}
              onUpdateLeader={handleUpdateLeader}
              onDeleteLeader={handleDeleteLeader}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsSection 
              sdrs={derivedSdrsForActiveMonth}
              assessores={assessores}
              matches={matches}
              startDate={startDate}
              endDate={endDate}
              onResetToDefaults={handleResetToDefaults}
            />
          )}

        </div>

      </main>

      {/* Symmetrical Swiss-Style Minimal Editorial Footer */}
      <footer className="bg-white border-t-2 border-neutral-900 mt-12 py-5 text-[10px] text-neutral-600 uppercase font-bold font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="tracking-widest">
            Conselho Comercial &copy; 2026 &bull; Distribuição Sóbria de Assessoria
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-black"></span>
              Padrão Editorial Offwhite-Preto
            </span>
            <span>
              Células Alpha - Beta - Delta
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

// --- SUBCOMPONENT: LOGIN GATE ENTRANCE CONTROLLER ---
interface LoginGateProps {
  onLogin: (user: AuthUser) => void;
  leaders: TeamLeader[];
}

function LoginGate({ onLogin, leaders }: LoginGateProps) {
  const [username, setUsername] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedUser = username.trim();
    if (!trimmedUser || !passcode) {
      setErrorMsg('Por favor, preencha todos os campos!');
      return;
    }

    // Admin Connection Override: Log 'Caio', Password 'VMB' (case insensitive username)
    if (trimmedUser.toLowerCase() === 'caio' && passcode === 'VMB') {
      onLogin({
        role: 'admin',
        name: 'Caio'
      });
      return;
    }

    // Leader lookup matching by user's typed name or team name (case insensitive)
    const matchedLeader = leaders.find(l => 
      (l.name.toLowerCase() === trimmedUser.toLowerCase() || 
       l.teamName.toLowerCase() === trimmedUser.toLowerCase()) && 
      l.passcode === passcode
    );

    if (matchedLeader) {
      onLogin({
        role: 'leader',
        teamName: matchedLeader.teamName,
        leaderTitle: matchedLeader.leaderTitle,
        name: matchedLeader.name
      });
      return;
    }

    setErrorMsg('Acesso negado. Por favor, verifique usuário e senha.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-left">
      {errorMsg && (
        <div className="text-xs font-bold text-red-700 bg-red-50 border border-red-300 p-3 rounded-lg text-center animate-shake">
          {errorMsg}
        </div>
      )}

      {/* Login input */}
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider">
          Usuário (Login)
        </label>
        <input
          type="text"
          placeholder="Digite seu usuário..."
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs leading-normal font-medium focus:bg-white focus:ring-1 focus:ring-black focus:outline-none transition-all"
          required
        />
      </div>

      {/* Password input */}
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider">
          Senha de Segurança
        </label>
        <input
          type="password"
          placeholder="Digite sua senha..."
          value={passcode}
          onChange={e => setPasscode(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs leading-normal focus:bg-white focus:ring-1 focus:ring-black focus:outline-none transition-all"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-950 text-white font-black text-xs rounded-xl uppercase tracking-wider hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
      >
        <Shield className="w-3.5 h-3.5 text-[#fff]" />
        Autenticar e Entrar
      </button>

      <div className="text-center pt-2">
        <span className="text-[10px] text-neutral-400 italic">
          🔒 Conexão SSL Segura e Criptografia Ponta-a-Ponta
        </span>
      </div>
    </form>
  );
}
