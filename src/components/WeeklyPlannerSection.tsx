import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { WeeklyPlanner, PlannerItem, Subject, Content } from '../types';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  Circle, 
  CheckCircle2, 
  FolderMinus, 
  ChevronRight, 
  ChevronDown, 
  Edit3, 
  LogOut, 
  AlertCircle,
  HelpCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

const DIAS_SEMANA = [
  "Segunda", 
  "Terça", 
  "Quarta", 
  "Quinta", 
  "Sexta", 
  "Sábado", 
  "Domingo"
] as const;

type DiaSemanaType = typeof DIAS_SEMANA[number];

// Helper to get nice background colors for weekdays
const getDayTheme = (dia: DiaSemanaType) => {
  switch (dia) {
    case 'Segunda': return { bg: 'bg-indigo-50/40 border-indigo-100', text: 'text-indigo-700', badge: 'bg-indigo-100/80 text-indigo-700' };
    case 'Terça': return { bg: 'bg-emerald-50/40 border-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-100/80 text-emerald-700' };
    case 'Quarta': return { bg: 'bg-sky-50/40 border-sky-100', text: 'text-sky-700', badge: 'bg-sky-100/80 text-sky-700' };
    case 'Quinta': return { bg: 'bg-amber-50/40 border-amber-100', text: 'text-amber-700', badge: 'bg-amber-100/80 text-amber-700' };
    case 'Sexta': return { bg: 'bg-purple-50/40 border-purple-100', text: 'text-purple-700', badge: 'bg-purple-100/80 text-purple-700' };
    case 'Sábado': return { bg: 'bg-rose-50/40 border-rose-100', text: 'text-rose-700', badge: 'bg-rose-100/80 text-rose-700' };
    case 'Domingo': return { bg: 'bg-teal-50/40 border-teal-100', text: 'text-teal-700', badge: 'bg-teal-100/80 text-teal-700' };
    default: return { bg: 'bg-slate-50 border-slate-100', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' };
  }
};

export const WeeklyPlannerSection: React.FC = () => {
  const { 
    weeklyPlanners, 
    subjects, 
    contents, 
    saveWeeklyPlanner, 
    deleteWeeklyPlanner, 
    saveStudySession 
  } = useData();

  // Active / Selected planner ID (defaults to the first one, or null)
  const [selectedPlannerId, setSelectedPlannerId] = useState<string>(() => {
    return weeklyPlanners[0]?.id || '';
  });

  // State to track edited calendar titles
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  // Find the currently active WeeklyPlanner document
  const activePlanner = useMemo(() => {
    let planner = weeklyPlanners.find(wp => wp.id === selectedPlannerId);
    if (!planner && weeklyPlanners.length > 0) {
      planner = weeklyPlanners[0];
    }
    return planner;
  }, [weeklyPlanners, selectedPlannerId]);

  // Keep selected ID synchronized if empty
  React.useEffect(() => {
    if (activePlanner && !selectedPlannerId) {
      setSelectedPlannerId(activePlanner.id);
    }
  }, [activePlanner, selectedPlannerId]);

  // Adding pane state tracked per day
  // Maps diaSemana -> { selectMateriaId: string, selectConteudoId: string } or null
  const [addingState, setAddingState] = useState<Record<string, { subjectId: string; contentId: string } | null>>({});

  // Confirmation Delete dialog state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleteTitle, setDeleteTitle] = useState('');

  // Info notification toast string to feedback logged studies
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Create an automatic or initial weekly schedule
  const handleCreateNewPlanner = async () => {
    const defaultTitle = `Minha Grade de Estudos (${weeklyPlanners.length + 1})`;
    const id = `week_${Math.random().toString(36).substring(2, 11)}`;
    
    try {
      await saveWeeklyPlanner({
        id,
        titulo: defaultTitle,
        itens: []
      });
      setSelectedPlannerId(id);
      setEditedTitle(defaultTitle);
      showToast("Criou uma nova página de organização semanal! \u2728");
    } catch (err) {
      alert("Erro ao criar a semanada.");
    }
  };

  // Excluir a semana ativa
  const handleDeleteTrigger = () => {
    if (!activePlanner) return;
    setDeleteId(activePlanner.id);
    setDeleteTitle(activePlanner.titulo);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteWeeklyPlanner(deleteId);
      setConfirmDeleteOpen(false);
      // Fallback selector to next available planner or empty
      const remainingPlanners = weeklyPlanners.filter(wp => wp.id !== deleteId);
      if (remainingPlanners.length > 0) {
        setSelectedPlannerId(remainingPlanners[0].id);
      } else {
        setSelectedPlannerId('');
      }
      showToast("Grade apagada com sucesso!");
    } catch (err) {
      alert("Ocorreu um erro ao excluir.");
    }
  };

  // Update visual title
  const handleSaveTitle = async () => {
    if (!activePlanner || !editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await saveWeeklyPlanner({
        ...activePlanner,
        titulo: editedTitle.trim()
      });
      setIsEditingTitle(false);
    } catch (e) {
      alert("Erro ao salvar título.");
    }
  };

  // Start adding a meta to a specific weekday column
  const handleOpenAddInline = (dia: DiaSemanaType) => {
    // Pick the first available subject that has contents, or just the first subject
    const subjectWithContents = subjects.find(s => contents.some(c => c.materiaId === s.id));
    const initialSubjectId = subjectWithContents?.id || subjects[0]?.id || '';
    
    // Pick the first content of that subject
    const relevantContents = contents.filter(c => c.materiaId === initialSubjectId);
    const initialContentId = relevantContents[0]?.id || '';

    setAddingState(prev => ({
      ...prev,
      [dia]: {
        subjectId: initialSubjectId,
        contentId: initialContentId
      }
    }));
  };

  // Change input variables during inline selection
  const handleAddingFieldChange = (dia: DiaSemanaType, field: 'subjectId' | 'contentId', value: string) => {
    const current = addingState[dia];
    if (!current) return;

    if (field === 'subjectId') {
      // Find contents of the new selected subject
      const relevantContents = contents.filter(c => c.materiaId === value);
      const firstContentId = relevantContents[0]?.id || '';
      
      setAddingState(prev => ({
        ...prev,
        [dia]: {
          subjectId: value,
          contentId: firstContentId
        }
      }));
    } else {
      setAddingState(prev => ({
        ...prev,
        [dia]: {
          ...current,
          contentId: value
        }
      }));
    }
  };

  // Add the planned content into the WeeklyPlanner items
  const handleAddPlannerItem = async (dia: DiaSemanaType) => {
    const current = addingState[dia];
    if (!activePlanner || !current || !current.subjectId || !current.contentId) {
      // Close adding pane
      setAddingState(prev => ({ ...prev, [dia]: null }));
      return;
    }

    const newItem: PlannerItem = {
      id: `item_${Math.random().toString(36).substring(2, 10)}`,
      diaSemana: dia,
      materiaId: current.subjectId,
      conteudoId: current.contentId,
      concluido: false
    };

    const updatedItens = [...(activePlanner.itens || []), newItem];

    try {
      await saveWeeklyPlanner({
        ...activePlanner,
        itens: updatedItens
      });
      // Clear inline adding state for this day
      setAddingState(prev => ({ ...prev, [dia]: null }));
    } catch (err) {
      alert("Erro ao salvar item na agenda.");
    }
  };

  // Remove a planned content from the day column
  const handleRemovePlannerItem = async (itemId: string) => {
    if (!activePlanner) return;
    const updatedItens = (activePlanner.itens || []).filter(it => it.id !== itemId);
    try {
      await saveWeeklyPlanner({
        ...activePlanner,
        itens: updatedItens
      });
    } catch (err) {
      alert("Erro ao remover item.");
    }
  };

  // Toggle study checklist completed status
  const handleToggleItemCheckbox = async (item: PlannerItem) => {
    if (!activePlanner) return;
    
    const isChecking = !item.concluido;
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedItens = (activePlanner.itens || []).map(it => {
      if (it.id === item.id) {
        return {
          ...it,
          concluido: isChecking,
          estudadoEm: isChecking ? todayStr : undefined
        };
      }
      return it;
    });

    try {
      // Save changes in the schedule planner database
      await saveWeeklyPlanner({
        ...activePlanner,
        itens: updatedItens
      });

      // Integrate with the study logs immediately if completing!
      if (isChecking) {
        const foundSubject = subjects.find(s => s.id === item.materiaId);
        const foundContent = contents.find(c => c.id === item.conteudoId);
        
        await saveStudySession({
          data: todayStr,
          materiaId: item.materiaId,
          conteudoId: item.conteudoId,
          metodo: "Aula/resumo",
          minutosEstudados: 30, // standard pre-set session time
          questoesFeitas: 0,
          acertos: 0,
          dificuldadePercebida: "Médio",
          observacao: "Log de estudo gerado pelo Planejador de Calendário Semanal 📅"
        }, true); // creates auto-spaced repetitions default templates: +1d, +7d, +15d...

        showToast(
          `Concluído! Registrou sessão de estudo de "${foundContent?.nome || 'Conteúdo'}" (${foundSubject?.nome || 'Matéria'}) no histórico de estudos e gerou suas revisões futuras! 🚀`
        );
      } else {
        showToast("Progresso desmarcado. O log registrado no histórico continua salvo.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao computar checklist de estudos.");
    }
  };

  // Compute items mapped on weekdays
  const plannerByDay = useMemo(() => {
    const mapping: Record<DiaSemanaType, PlannerItem[]> = {
      Segunda: [],
      Terça: [],
      Quarta: [],
      Quinta: [],
      Sexta: [],
      Sábado: [],
      Domingo: []
    };

    if (activePlanner && Array.isArray(activePlanner.itens)) {
      activePlanner.itens.forEach(item => {
        if (mapping[item.diaSemana]) {
          mapping[item.diaSemana].push(item);
        }
      });
    }

    return mapping;
  }, [activePlanner]);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm md:max-w-md bg-slate-900 border border-indigo-500/30 text-white rounded-2xl p-4 shadow-xl flex items-start space-x-3 text-xs animate-bounce">
          <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
          <p className="font-medium text-slate-100 leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-indigo-50/50">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Calendário Semanal de Estudos 🗓️</h3>
            <p className="text-xs text-slate-500 font-medium">
              Alavanque sua produtividade organizando o que estudar a cada dia da semana. Selecione conteúdos já criados e controle no calendário.
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {weeklyPlanners.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-250 p-1.5 rounded-xl">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase pl-1.5">Grade:</span>
              <select
                value={selectedPlannerId}
                onChange={(e) => {
                  setSelectedPlannerId(e.target.value);
                  const found = weeklyPlanners.find(w => w.id === e.target.value);
                  if (found) setEditedTitle(found.titulo);
                  setIsEditingTitle(false);
                }}
                className="bg-white text-xs font-bold text-slate-700 px-2 py-1 rounded-lg border border-slate-200/65 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer min-w-[150px]"
              >
                {weeklyPlanners.map(wp => (
                  <option key={wp.id} value={wp.id}>{wp.titulo}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleCreateNewPlanner}
            className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Grade</span>
          </button>
        </div>
      </div>

      {/* No Planners State */}
      {weeklyPlanners.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center p-8">
          <Calendar className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700">Comece a planejar sua rotina agora!</h4>
          <p className="text-xs text-slate-450 mt-1 max-w-md mx-auto leading-relaxed">
            Monte um cronograma integrado no estilo Notion ligando matérias, conteúdos cadastrados e checklist de logs para não ficar perdido sobre o que focar cada dia.
          </p>
          <button
            onClick={handleCreateNewPlanner}
            className="mt-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Criar Minha Agenda de Estudos
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Active Planner Title Settings bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center space-x-2 w-full max-w-md">
              {isEditingTitle ? (
                <div className="flex items-center space-x-1 w-full">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Nome do planejamento"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-2 rounded-lg cursor-pointer hover:bg-emerald-700"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTitle(false);
                      if (activePlanner) setEditedTitle(activePlanner.titulo);
                    }}
                    className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-2 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-extrabold text-slate-850">
                    📂 {activePlanner?.titulo}
                  </span>
                  <button
                    onClick={() => {
                      if (activePlanner) {
                        setEditedTitle(activePlanner.titulo);
                        setIsEditingTitle(true);
                      }
                    }}
                    className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                    title="Editar título da grade"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-[11px] font-bold text-slate-400 italic">
                {(activePlanner?.itens || []).length} itens planejados
              </span>
              <button
                onClick={handleDeleteTrigger}
                className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs flex items-center space-x-1"
                title="Excluir esta grade"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Excluir Grade</span>
              </button>
            </div>
          </div>

          {/* Validation Notice for Subjects */}
          {subjects.length === 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start space-x-2.5 text-xs text-amber-850">
              <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Nenhuma matéria ou conteúdo cadastrado: </span>
                Para adicionar metas ao cronograma, você precisa primeiro registrar suas disciplinas e tópicos de estudo na aba <span className="font-bold">&ldquo;Matérias / Conteúdos&rdquo;</span>.
              </div>
            </div>
          )}

          {/* The Week Calendar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5 items-start">
            {DIAS_SEMANA.map((dia) => {
              const dayTheme = getDayTheme(dia);
              const items = plannerByDay[dia];
              const isAdding = addingState[dia] !== null && addingState[dia] !== undefined;

              return (
                <div 
                  key={dia} 
                  className={`border rounded-2xl p-3.5 flex flex-col min-h-[220px] transition-all ${dayTheme.bg} hover:shadow-xs`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                    <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                      {dia}
                    </span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${dayTheme.badge}`}>
                      {items.length} {items.length === 1 ? 'meta' : 'metas'}
                    </span>
                  </div>

                  {/* Planned items in this weekday */}
                  <div className="space-y-2.5 flex-1 mb-3">
                    {items.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-5 text-center text-[10.5px] text-slate-400 italic font-mono border border-dashed border-slate-200/70 rounded-xl bg-white/20">
                        Livre
                      </div>
                    ) : (
                      items.map((it) => {
                        const subjectDetail = subjects.find(s => s.id === it.materiaId);
                        const contentDetail = contents.find(c => c.id === it.conteudoId);

                        return (
                          <div 
                            key={it.id} 
                            className={`group relative bg-white border border-slate-150 rounded-xl p-2.5 shadow-2xs hover:border-slate-305 transition-all flex items-start space-x-2 ${
                              it.concluido ? 'opacity-55' : ''
                            }`}
                          >
                            {/* Toggle Checkbox Button */}
                            <button
                              onClick={() => handleToggleItemCheckbox(it)}
                              className="shrink-0 mt-0.5 focus:outline-none cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors"
                              title={it.concluido ? "Desmarcar estudo" : "Marcar como estudado e gerar log"}
                            >
                              {it.concluido ? (
                                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 fill-emerald-50" />
                              ) : (
                                <Circle className="h-4.5 w-4.5 text-slate-300 hover:text-indigo-505" />
                              )}
                            </button>

                            {/* Card Details */}
                            <div className="flex-1 min-w-0 pr-5">
                              {/* Subject Badge */}
                              {subjectDetail && (
                                <span 
                                  className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded-md text-white shadow-2xs leading-none mb-1.5 truncate max-w-full"
                                  style={{ backgroundColor: subjectDetail.cor }}
                                >
                                  {subjectDetail.nome}
                                </span>
                              )}

                              {/* Content Title */}
                              <p className={`text-[11.5px] font-semibold text-slate-700/90 leading-normal break-words ${
                                it.concluido ? 'line-through text-slate-400 font-normal' : ''
                              }`}>
                                {contentDetail ? contentDetail.nome : '\u26a0\ufe0f Tópico Removido'}
                              </p>

                              {it.concluido && it.estudadoEm && (
                                <span className="inline-flex items-center text-[9px] font-bold text-emerald-600 mt-1">
                                  ✓ Estudado em {it.estudadoEm.split('-').reverse().slice(0, 2).join('/')}
                                </span>
                              )}
                            </div>

                            {/* Delete single planner item button */}
                            <button
                              onClick={() => handleRemovePlannerItem(it.id)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-500 rounded p-0.5"
                              title="Remover deste dia"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}

                    {/* Inline Form to Add a planned item */}
                    {isAdding && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2.5 animate-fade-in shadow-xs">
                        {/* Select Subject */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Disciplina</label>
                          <select
                            value={addingState[dia]?.subjectId || ''}
                            onChange={(e) => handleAddingFieldChange(dia, 'subjectId', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="">-- Selecionar --</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id}>{s.nome}</option>
                            ))}
                          </select>
                        </div>

                        {/* Select Content of Subject */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Conteúdo do Sistema</label>
                          <select
                            value={addingState[dia]?.contentId || ''}
                            onChange={(e) => handleAddingFieldChange(dia, 'contentId', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[11px] font-medium text-slate-600 focus:outline-none cursor-pointer"
                            disabled={!addingState[dia]?.subjectId}
                          >
                            <option value="">-- Selecionar --</option>
                            {contents
                              .filter(c => c.materiaId === addingState[dia]?.subjectId)
                              .map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                              ))
                            }
                            {contents.filter(c => c.materiaId === addingState[dia]?.subjectId).length === 0 && (
                              <option disabled>Nenhum conteúdo nesta matéria</option>
                            )}
                          </select>
                        </div>

                        {/* Actions buttons */}
                        <div className="flex justify-end space-x-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setAddingState(prev => ({ ...prev, [dia]: null }))}
                            className="bg-slate-200/80 hover:bg-slate-250 text-slate-700 text-[10px] font-bold px-2 py-1 rounded"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddPlannerItem(dia)}
                            disabled={!addingState[dia]?.contentId}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded text-white cursor-pointer ${
                              addingState[dia]?.contentId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300'
                            }`}
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add action trigger */}
                  {!isAdding && subjects.length > 0 && (
                    <button
                      onClick={() => handleOpenAddInline(dia)}
                      className="w-full border border-dashed border-slate-250 hover:border-indigo-300 text-slate-400 hover:text-indigo-600 text-[10.5px] font-extrabold py-2 px-1 rounded-xl flex items-center justify-center space-x-1 hover:bg-white transition-all cursor-pointer mt-auto"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Adicionar</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Legend/Hint Footer block */}
          <div className="bg-slate-50/50 rounded-2xl p-3.5 border border-slate-100 flex items-start space-x-2 shadow-inner">
            <HelpCircle className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-500 leading-relaxed font-sans">
              <span className="font-bold text-indigo-600 uppercase tracking-wider text-[9.5px] block mb-0.5">Dica de Produtividade & Checklist Integrado</span>
              Quando você clica na bolinha de checkbox de uma meta pendente, o sistema gera de forma transparente um log de estudos de <span className="font-bold text-slate-600">30 minutos</span> no seu histórico, altera o status do conteúdo no painel principal e agenda automaticamente todas as futuras datas do intervalo de repetições espaçadas! ⚡
            </div>
          </div>

        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Excluir Calendário"
        message={`Deseja mesmo remover a grade "${deleteTitle}"? Todos os agendamentos desta semana serão apagados do planejador.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        confirmText="Excluir"
        cancelText="Voltar"
        danger={true}
      />

    </div>
  );
};
