import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Review, ReviewPerformance } from '../types';
import { Calendar, CheckSquare, Award, Clock, ArrowRight, BookOpen, UserCheck, Plus, X, AlertTriangle } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ReviewsTabProps {
  quickPreselectedContentId?: string;
  onClearQuickPreselected?: () => void;
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({ 
  quickPreselectedContentId, 
  onClearQuickPreselected 
}) => {
  const { reviews, subjects, contents, completeReview, scheduleCustomReview, deleteReview } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'today' | 'pending' | 'done'>('today');
  
  // Custom dialogs
  const [performanceModalId, setPerformanceModalId] = useState<string | null>(null);
  const [showAddReview, setShowAddReview] = useState(false);

  // ConfirmModal State
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleteDesc, setDeleteDesc] = useState('');

  // Custom scheduling form fields 
  const [materiaId, setMateriaId] = useState('');
  const [conteudoId, setConteudoId] = useState('');
  const [customDays, setCustomDays] = useState(3);
  const [customLabel, setCustomLabel] = useState('Revisão Manual');

  // Filter state for ReviewsTab list
  const [filterMateriaId, setFilterMateriaId] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Sync quick study triggers for reviews
  useEffect(() => {
    if (quickPreselectedContentId) {
      const foundC = contents.find(c => c.id === quickPreselectedContentId);
      if (foundC) {
        setMateriaId(foundC.materiaId);
        setConteudoId(foundC.id);
        setShowAddReview(true);
      }
      onClearQuickPreselected?.();
    }
  }, [quickPreselectedContentId, contents, onClearQuickPreselected]);

  // Set cascading defaults in manual scheduler
  useEffect(() => {
    if (subjects.length > 0 && !materiaId) {
      setMateriaId(subjects[0].id);
    }
  }, [subjects, materiaId]);

  const availableContents = useMemo(() => {
    return contents.filter(c => c.materiaId === materiaId);
  }, [contents, materiaId]);

  useEffect(() => {
    if (availableContents.length > 0) {
      setConteudoId(availableContents[0].id);
    } else {
      setConteudoId('');
    }
  }, [materiaId, availableContents]);

  const handleCustomReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conteudoId || !materiaId || customDays <= 0) return;

    try {
      await scheduleCustomReview(conteudoId, materiaId, Number(customDays), customLabel.trim() || "Anki Manual");
      setShowAddReview(false);
      alert("Revisão manual programada com sucesso!");
    } catch (e) {
      alert("Erro ao programar revisão.");
    }
  };

  // 1. "Pendente e de Hoje" (dues where dataPrevista <= today)
  const reviewsToday = useMemo(() => {
    let list = reviews.filter(r => r.status === 'Pendente' && r.dataPrevista <= todayStr);
    if (filterMateriaId) {
      list = list.filter(r => r.materiaId === filterMateriaId);
    }
    return list;
  }, [reviews, todayStr, filterMateriaId]);

  // 2. "Todas as Pendentes"
  const allPendingReviews = useMemo(() => {
    let list = reviews.filter(r => r.status === 'Pendente');
    if (filterMateriaId) {
      list = list.filter(r => r.materiaId === filterMateriaId);
    }
    return list;
  }, [reviews, filterMateriaId]);

  // 3. "Concluídas/Feitas"
  const completedReviews = useMemo(() => {
    let list = reviews.filter(r => r.status === 'Feita');
    if (filterMateriaId) {
      list = list.filter(r => r.materiaId === filterMateriaId);
    }
    return list;
  }, [reviews, filterMateriaId]);

  const activeReviewList = useMemo(() => {
    if (activeSubTab === 'today') return reviewsToday;
    if (activeSubTab === 'pending') return allPendingReviews;
    return completedReviews;
  }, [activeSubTab, reviewsToday, allPendingReviews, completedReviews]);

  // Handle trigger complete review
  const handleMarkComplete = (id: string) => {
    setPerformanceModalId(id);
  };

  const submitPerformance = async (performance: ReviewPerformance) => {
    if (!performanceModalId) return;
    try {
      await completeReview(performanceModalId, performance);
      setPerformanceModalId(null);
    } catch (err) {
      alert("Erro ao completar revisão.");
    }
  };

  const handleDeleteTrigger = (id: string, label: string) => {
    setDeleteId(id);
    setDeleteDesc(label);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteReview(deleteId);
    } catch (err) {
      alert("Erro ao excluir agendamento.");
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Revisões Inteligentes (Estilo Anki) 🔄</h2>
          <p className="text-xs text-slate-500">Acompanhe cards e sessões de estudo espaçados. O algoritmo calibra os tempos com base nas suas notas de performance.</p>
        </div>

        {contents.length === 0 ? null : (
          <button 
            onClick={() => setShowAddReview(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Agendar Manual</span>
          </button>
        )}
      </div>

      {/* Sub tabs filtering */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1 flex-wrap gap-2">
        <div className="flex space-x-1">
          
          <button 
            onClick={() => setActiveSubTab('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'today' 
                ? 'bg-teal-600 text-white shadow-xs shadow-teal-100' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            De Hoje / Atrasadas ({reviewsToday.length})
          </button>

          <button 
            onClick={() => setActiveSubTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'pending' 
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-100' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Todas as Pendentes ({allPendingReviews.length})
          </button>

          <button 
            onClick={() => setActiveSubTab('done')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'done' 
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-100' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Já Concluídas ({completedReviews.length})
          </button>

        </div>
        
        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
          Hoje é: {todayStr}
        </span>
      </div>

      {/* Subject Filter Section */}
      <div className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Filtrar por Matéria:</span>
          <select
            value={filterMateriaId}
            onChange={(e) => setFilterMateriaId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer min-w-[180px]"
          >
            <option value="">Todas as Matérias</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
          {filterMateriaId && (
            <button 
              type="button"
              onClick={() => setFilterMateriaId('')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer bg-teal-50 px-2 py-1 rounded-lg"
            >
              Limpar Filtro
            </button>
          )}
        </div>
        
        {filterMateriaId && (
          <div className="text-[11px] font-bold text-slate-400">
            Mostrando apenas cards de <span className="text-slate-600 font-extrabold">&ldquo;{subjects.find(s => s.id === filterMateriaId)?.nome}&rdquo;</span>
          </div>
        )}
      </div>

      {/* Active Repetitions List */}
      <div className="space-y-3.5">
        
        {activeReviewList.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-2xl">
            <CheckSquare className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">Nenhuma revisão neste filtro!</p>
            <p className="text-xs text-slate-400">Parabéns. Sua mente e seus cards de repetição em Medicina estão em dia.</p>
          </div>
        ) : (
          activeReviewList.map(rv => {
            const subObj = subjects.find(s => s.id === rv.materiaId);
            const contentObj = contents.find(c => c.id === rv.conteudoId);
            const isLate = rv.status === 'Pendente' && rv.dataPrevista < todayStr;

            return (
              <div 
                key={rv.id} 
                className={`bg-white border rounded-2xl p-4.5 hover:shadow-xs transition-shadow flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 relative overflow-hidden ${
                  isLate ? 'border-rose-200 bg-rose-50/10' : 'border-slate-100'
                }`}
              >
                {/* Lateral color strip */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: subObj?.cor || "#cbd5e1" }} />

                {/* Left Rep Info */}
                <div className="space-y-1.5 pl-2.5 sm:max-w-[70%]">
                  <div className="flex flex-wrap items-center gap-2">
                    
                    <span 
                      className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md text-white" 
                      style={{ backgroundColor: subObj?.cor || "#cbd5e1" }}
                    >
                      {subObj?.nome || "Geral"}
                    </span>
                    
                    <span className="text-slate-300">|</span>

                    <span className="text-[10.5px] font-bold text-slate-400">
                      Card: {rv.tipoRevisao}
                    </span>

                    {isLate && (
                      <span className="flex items-center space-x-1 font-extrabold text-[9px] text-rose-600 bg-rose-100/50 border border-rose-200 rounded-sm px-1.5 py-0.5 animate-pulse uppercase">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Revisão Atrapalhada / Vencida</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                    {contentObj?.nome || "Conteúdo Desconhecido"}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2.5 text-[10.5px] font-medium text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Previsto para: <strong>{rv.dataPrevista}</strong></span>
                    </span>

                    {rv.dataFeita && (
                      <span className="flex items-center space-x-1 text-emerald-600 font-semibold">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Feito em: <strong>{rv.dataFeita}</strong></span>
                      </span>
                    )}

                    {rv.desempenho && (
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-sm ${
                        rv.desempenho === "Bom" ? "bg-emerald-100 text-emerald-800" :
                        rv.desempenho === "Médio" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        Foco {rv.desempenho}
                      </span>
                    )}
                  </div>

                </div>

                {/* Right Action Trigger */}
                <div className="flex items-center justify-between sm:justify-end sm:space-x-3 pl-2.5 sm:pl-0 pt-2.5 sm:pt-0 border-t border-slate-50 sm:border-0">
                  <button 
                    onClick={() => handleDeleteTrigger(rv.id, rv.tipoRevisao)}
                    className="text-[10.5px] font-semibold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    Excluir Card
                  </button>

                  {rv.status === 'Pendente' ? (
                    <button 
                      onClick={() => handleMarkComplete(rv.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1 transition-all cursor-pointer shadow-xs shadow-emerald-50"
                    >
                      <CheckSquare className="h-4 w-4" />
                      <span>Marcar Realizada</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl flex items-center space-x-1">
                      <Award className="h-4 w-4" />
                      <span>Revisado</span>
                    </span>
                  )}
                </div>

              </div>
            );
          })
        )}

      </div>

      {/* Select Performance Quality Modal */}
      {performanceModalId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="h-12 w-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto text-teal-600">
                <Award className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Avaliação da Revisão</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Como foi sua recordação ativa e acerto de questões neste recall do conteúdo?
                </p>
              </div>

              {/* Performance selectors */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                
                {/* Ruim */}
                <button 
                  onClick={() => submitPerformance("Ruim")}
                  type="button"
                  className="flex flex-col items-center p-3 bg-rose-50/40 hover:bg-rose-50 border border-rose-100 rounded-xl cursor-pointer hover:scale-102 transition-all group"
                >
                  <span className="text-lg">❌</span>
                  <span className="text-xs font-bold text-rose-800 mt-1">Ruim</span>
                  <span className="text-[8px] text-rose-500 font-medium leading-none mt-1">+2d (reforço)</span>
                </button>

                {/* Medio */}
                <button 
                  onClick={() => submitPerformance("Médio")}
                  type="button"
                  className="flex flex-col items-center p-3 bg-amber-50/40 hover:bg-amber-50 border border-amber-100 rounded-xl cursor-pointer hover:scale-102 transition-all group"
                >
                  <span className="text-lg">💡</span>
                  <span className="text-xs font-bold text-amber-800 mt-1">Médio</span>
                  <span className="text-[8px] text-amber-500 font-medium leading-none mt-1">+7d (médio)</span>
                </button>

                {/* Bom */}
                <button 
                  onClick={() => submitPerformance("Bom")}
                  type="button"
                  className="flex flex-col items-center p-3 bg-emerald-50/40 hover:bg-emerald-50 border border-emerald-100 rounded-xl cursor-pointer hover:scale-102 transition-all group"
                >
                  <span className="text-lg">✅</span>
                  <span className="text-xs font-bold text-emerald-800 mt-1">Bom</span>
                  <span className="text-[8px] text-emerald-500 font-medium leading-none mt-1">Sombra regular</span>
                </button>

              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setPerformanceModalId(null)}
                  className="text-xs text-slate-400 font-medium hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Cancelar / Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual review scheduler Modal */}
      {showAddReview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6">
              
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Agendar Revisão Manual</h3>
                <button onClick={() => setShowAddReview(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCustomReviewSubmit} className="space-y-4">
                
                {/* Subject selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Matéria</label>
                  <select 
                    value={materiaId}
                    onChange={(e) => setMateriaId(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Content selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Escolha o Conteúdo</label>
                  {availableContents.length === 0 ? (
                    <div className="text-xs text-rose-500 font-bold p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                      Nenhum conteúdo vinculado a esta matéria.
                    </div>
                  ) : (
                    <select 
                      value={conteudoId}
                      onChange={(e) => setConteudoId(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      {availableContents.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* DaysAhead */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Dias para Fazer</label>
                    <input 
                      type="number" 
                      min={1}
                      max={365}
                      value={customDays}
                      onChange={(e) => setCustomDays(Number(e.target.value))}
                      required
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Code Name label */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Identificador (Ex: D1, D7)</label>
                    <input 
                      type="text" 
                      placeholder="Anki Manual"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      maxLength={15}
                      required
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setShowAddReview(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={availableContents.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-5 rounded-xl cursor-pointer disabled:bg-slate-300"
                  >
                    Programar Card
                  </button>
                </div>

              </form>

            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Excluir Agendamento de Revisão"
        message={`Deseja apagar permanentemente este agendamento de revisão ("${deleteDesc}")?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        confirmText="Excluir"
        cancelText="Cancelar"
        danger={true}
      />

    </div>
  );
};
