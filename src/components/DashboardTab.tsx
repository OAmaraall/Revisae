import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { calculatePriorityScore, ScoredContent } from '../utils/priority';
import { Calendar, AlertCircle, CheckCircle2, TrendingUp, BookOpen, AlertTriangle, Play, HelpCircle } from 'lucide-react';

interface DashboardTabProps {
  onNavigateToTab: (index: number) => void;
  onSelectQuickContent: (contentId: string, action: 'study' | 'review') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onNavigateToTab, onSelectQuickContent }) => {
  const { subjects, contents, reviews, questions, studies } = useData();

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Calculate Scored Contents
  const scoredList = useMemo(() => {
    return contents.map(c => {
      const sub = subjects.find(s => s.id === c.materiaId);
      const revs = reviews.filter(r => r.conteudoId === c.id);
      const qs = questions.filter(q => q.conteudoId === c.id);
      return calculatePriorityScore(c, sub, revs, qs);
    }).sort((a, b) => b.score - a.score);
  }, [contents, subjects, reviews, questions]);

  // 2. Stats Calculations
  const totalContents = contents.length;
  
  const reviewsTodayList = useMemo(() => {
    return reviews.filter(r => r.status === 'Pendente' && r.dataPrevista <= todayStr);
  }, [reviews, todayStr]);

  const delayedContentsCount = useMemo(() => {
    return contents.filter(c => c.dataLimite && c.dataLimite < todayStr && c.status !== 'Dominado').length;
  }, [contents, todayStr]);

  const generalProgressDecimal = useMemo(() => {
    if (totalContents === 0) return 0;
    // Calculate progress weights: Dominado = 100%, Em revisão = 80%, Questões feitas = 60%, Aula vista = 40%, Resumo lido = 20%, Não iniciado = 0%
    const weights: Record<string, number> = {
      "Não iniciado": 0,
      "Resumo lido": 20,
      "Aula vista": 40,
      "Questões feitas": 60,
      "Em revisão": 80,
      "Dominado": 100
    };
    const sum = contents.reduce((acc, curr) => acc + (weights[curr.status] || 0), 0);
    return Math.round(sum / totalContents);
  }, [contents, totalContents]);

  // 3. Matérias com maior atraso (By count of overdue reviews or delayed contents)
  const subjectsWithDelays = useMemo(() => {
    const delayMap: Record<string, { subjectId: string; nome: string; cor: string; count: number }> = {};
    
    // Increment for each delayed content of the subject
    contents.forEach(c => {
      if (c.dataLimite && c.dataLimite < todayStr && c.status !== 'Dominado') {
        const sub = subjects.find(s => s.id === c.materiaId);
        if (sub) {
          if (!delayMap[sub.id]) {
            delayMap[sub.id] = { subjectId: sub.id, nome: sub.nome, cor: sub.cor, count: 0 };
          }
          delayMap[sub.id].count += 1;
        }
      }
    });

    // Increment for each overdue review
    reviewsTodayList.forEach(r => {
      const sub = subjects.find(s => s.id === r.materiaId);
      if (sub) {
        if (!delayMap[sub.id]) {
          delayMap[sub.id] = { subjectId: sub.id, nome: sub.nome, cor: sub.cor, count: 0 };
        }
        delayMap[sub.id].count += 1;
      }
    });

    return Object.values(delayMap).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [contents, reviewsTodayList, subjects, todayStr]);

  // 4. "Prioridades de hoje" (top scored topics that are not fully dominated yet, or prioritized)
  const priorityList = useMemo(() => {
    return scoredList.filter(item => item.content.status !== 'Dominado').slice(0, 5);
  }, [scoredList]);

  return (
    <div className="space-y-6">
      
      {/* Target Welcome Greeting */}
      <div className="bg-gradient-to-r from-teal-800 to-cyan-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-y-3 translate-x-3">
          <BookOpen className="h-64 w-64" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="bg-teal-500/20 text-teal-300 text-xs font-bold font-mono tracking-wider px-3 py-1 rounded-full uppercase">
            Medicina 2026 • Foco Total
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Rumo à Aprovação!</h2>
          <p className="text-slate-200/95 leading-relaxed text-sm">
            Aqui está o diagnóstico do seu plano de revisões para hoje. Complete as revisões agendadas pendentes e ataque os tópicos de maior peso para maximizar seus acertos e blindar seu caderno de erros.
          </p>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl p-4 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Revisões de Hoje</span>
            <div className={`p-1.5 rounded-lg ${reviewsTodayList.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
              <Calendar className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{reviewsTodayList.length}</span>
            <button 
              onClick={() => onNavigateToTab(4)} // Reviews is index 4
              className="block text-[10px] sm:text-xs font-semibold text-teal-600 hover:text-teal-700 mt-1 cursor-pointer text-left"
            >
              Iniciar revisões →
            </button>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl p-4 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Conteúdos Atrasados</span>
            <div className={`p-1.5 rounded-lg ${delayedContentsCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{delayedContentsCount}</span>
            <button 
              onClick={() => onNavigateToTab(2)} // Contents is index 2
              className="block text-[10px] sm:text-xs font-semibold text-teal-600 hover:text-teal-700 mt-1 cursor-pointer text-left"
            >
              Ver atrasados →
            </button>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl p-4 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Total Cadastrado</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{totalContents}</span>
            <button 
              onClick={() => onNavigateToTab(2)}
              className="block text-[10px] sm:text-xs font-semibold text-teal-600 hover:text-teal-700 mt-1 cursor-pointer text-left"
            >
              Novo conteúdo +
            </button>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl p-4 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Progresso Geral</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-slate-800">{generalProgressDecimal}%</span>
              <span className="text-[10px] font-bold text-slate-400">Edital COPESE/ENEM</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${generalProgressDecimal}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Grid of Priorities and Delay Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMN 1 & 2: Prioridades do Dia (Calculated list) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Prioridades de Hoje 🎯</h3>
              <p className="text-xs text-slate-500">Conteúdos ordenados dinamicamente com base em peso, atrasos e taxas de acertos.</p>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-700 font-bold border border-amber-100 rounded-lg px-2.5 py-1 uppercase">
              Diagnóstico Automático
            </span>
          </div>

          <div className="space-y-3.5">
            {priorityList.length === 0 ? (
              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-teal-600 mx-auto" />
                <h4 className="font-bold text-teal-800 text-sm">Nenhuma prioridade urgente pendente!</h4>
                <p className="text-xs text-teal-600">Todos os seus conteúdos já estão com o estudo em andamento ou dominados.</p>
              </div>
            ) : (
              priorityList.map((scored, idx) => {
                const subColor = scored.subject?.cor || "#cbd5e1";
                const isLateDate = scored.isOverdueDate;
                const isOverdueRev = scored.isOverdueReview;

                return (
                  <div 
                    key={scored.content.id} 
                    className="bg-white border border-slate-100 rounded-2xl p-4.5 hover:shadow-xs transition-shadow flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 relative overflow-hidden"
                  >
                    {/* Left Border color identifier */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: subColor }} />

                    {/* Content and Reasons */}
                    <div className="space-y-1.5 pl-2 sm:max-w-[70%]">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span 
                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-md text-white shadow-xs" 
                          style={{ backgroundColor: subColor }}
                        >
                          {scored.subject?.nome || "Geral"}
                        </span>
                        
                        <span className="text-xs font-semibold text-slate-400">|</span>

                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                          {scored.content.bloco}
                        </span>

                        {isLateDate && (
                          <span className="flex items-center space-x-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Prazo Vencido</span>
                          </span>
                        )}

                        {isOverdueRev && (
                          <span className="flex items-center space-x-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                            <AlertCircle className="h-3 w-3" />
                            <span>Atrasado no Anki</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-800 text-base">{scored.content.nome}</h4>
                      
                      {/* Reason badges breakdown */}
                      <div className="flex flex-wrap gap-1">
                        {scored.reasons.slice(0, 3).map((reason, rIdx) => (
                          <span key={rIdx} className="text-[9px] font-semibold bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-sm">
                            {reason}
                          </span>
                        ))}
                        {scored.reasons.length > 3 && (
                          <span className="text-[9px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm">
                            +{scored.reasons.length - 3} fatores
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side stats/scores & Quick buttons */}
                    <div className="flex items-center justify-between sm:justify-end sm:space-x-4 pl-2 sm:pl-0 pt-2.5 sm:pt-0 border-t border-slate-50 sm:border-0">
                      
                      {/* Score Indicator */}
                      <div className="text-left sm:text-right">
                        <div className="text-xs font-bold text-slate-400 tracking-wider font-mono uppercase">Grau de Alerta</div>
                        <div className="text-lg font-extrabold text-teal-600 font-mono">
                          {scored.score} pts
                        </div>
                      </div>

                      {/* Quick play buttons */}
                      <div className="flex items-center space-x-1.5">
                        <button 
                          onClick={() => onSelectQuickContent(scored.content.id, 'study')}
                          title="Registrar Estudo"
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer transition-colors shadow-sm"
                        >
                          <Play className="h-4.5 w-4.5" />
                          <span>Estudar</span>
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 3: Matérias com Maior Atraso (Delay ranks) */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Mais Críticas/Atrasadas ⚠️</h3>
            <p className="text-xs text-slate-500">Matérias com maior contagem de atrasos ou revisões pendentes vencidas.</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
            {subjectsWithDelays.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                <p className="text-xs text-slate-500 font-semibold">Tudo em ordem!</p>
                <p className="text-[11px] text-slate-400">Nenhuma matéria com atrasos ou revisões pendentes no momento.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {subjectsWithDelays.map((item, idx) => {
                  return (
                    <div key={item.subjectId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center space-x-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.cor }} />
                          <span className="text-slate-700">{item.nome}</span>
                        </div>
                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg text-[10px] border border-rose-100 animate-pulse">
                          {item.count} {item.count === 1 ? 'pendência' : 'pendências'}
                        </span>
                      </div>
                      
                      {/* Visual bar proportionate */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all" 
                          style={{ 
                            backgroundColor: item.cor, 
                            width: `${Math.min(100, (item.count / 8) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dica de Produtividade</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Priorize a matéria <strong>Física / Biologia</strong> devido ao seu alto peso acumulado no sisu. Faça um ciclo rápido de questões para mapear erros e salvar gatilhos no caderno de erros.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
