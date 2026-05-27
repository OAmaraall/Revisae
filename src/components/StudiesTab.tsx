import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { StudyMethod, DifficultyLevel } from '../types';
import { Plus, X, BookOpen, Clock, Activity, CheckSquare, Award } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { WeeklyPlannerSection } from './WeeklyPlannerSection';

interface StudiesTabProps {
  quickPreselectedContentId?: string;
  onClearQuickPreselected?: () => void;
}

export const StudiesTab: React.FC<StudiesTabProps> = ({ 
  quickPreselectedContentId, 
  onClearQuickPreselected 
}) => {
  const { studies, subjects, contents, saveStudySession, deleteStudySession } = useData();

  const [isOpenForm, setIsOpenForm] = useState(false);

  // ConfirmModal State
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleteDesc, setDeleteDesc] = useState('');

  // Form Fields
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [materiaId, setMateriaId] = useState('');
  const [conteudoId, setConteudoId] = useState('');
  const [metodo, setMetodo] = useState<StudyMethod>("Aula/resumo");
  const [minutosEstudados, setMinutosEstudados] = useState(60);
  const [questoesFeitas, setQuestoesFeitas] = useState(10);
  const [acertos, setAcertos] = useState(8);
  const [incluiQuestoes, setIncluiQuestoes] = useState(false);
  const [dificuldadePercebida, setDificuldadePercebida] = useState<DifficultyLevel>("Médio");
  const [observacao, setObservacao] = useState('');
  const [createAutoReviews, setCreateAutoReviews] = useState(true);

  // Set initial materia and contents selectors
  useEffect(() => {
    if (subjects.length > 0 && !materiaId) {
      setMateriaId(subjects[0].id);
    }
  }, [subjects, materiaId]);

  // Track quick study selection triggers from dashboard
  useEffect(() => {
    if (quickPreselectedContentId) {
      const foundC = contents.find(c => c.id === quickPreselectedContentId);
      if (foundC) {
        setMateriaId(foundC.materiaId);
        setConteudoId(foundC.id);
        setIsOpenForm(true);
      }
      onClearQuickPreselected?.();
    }
  }, [quickPreselectedContentId, contents, onClearQuickPreselected]);

  // Keep contents selector relative to selected Materia ID
  const availableContents = uIdFilter(materiaId);

  function uIdFilter(mId: string) {
    return contents.filter(c => c.materiaId === mId);
  }

  // Pre-select first available content if selected materia changes
  useEffect(() => {
    if (availableContents.length > 0) {
      // Don't overwrite if we pre-selected from dashboard
      const isAlreadyValid = availableContents.some(ac => ac.id === conteudoId);
      if (!isAlreadyValid) {
        setConteudoId(availableContents[0].id);
      }
    } else {
      setConteudoId('');
    }
  }, [materiaId, availableContents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiaId || !conteudoId || minutosEstudados <= 0) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    if (incluiQuestoes) {
      if (questoesFeitas <= 0) {
        alert("O número de questões deve ser maior que zero se houver questões resolvidas.");
        return;
      }
      if (acertos > questoesFeitas) {
        alert("O número de acertos não pode ultrapassar o total de questões.");
        return;
      }
    }

    try {
      await saveStudySession({
        data,
        materiaId,
        conteudoId,
        metodo,
        minutosEstudados: Number(minutosEstudados),
        questoesFeitas: incluiQuestoes ? Number(questoesFeitas) : 0,
        acertos: incluiQuestoes ? Number(acertos) : 0,
        dificuldadePercebida,
        observacao: observacao.trim()
      }, createAutoReviews);

      setIsOpenForm(false);
      
      if (createAutoReviews) {
        alert("Sessão de estudos salva! Também criamos revisões automatizadas de D1 a D240 para este conteúdo.");
      } else {
        alert("Sessão de estudos salva!");
      }

      // Reset
      setObservacao('');
    } catch (err) {
      alert("Erro ao registrar estudo.");
    }
  };

  const handleDeleteTrigger = (id: string, date: string) => {
    setDeleteId(id);
    setDeleteDesc(date);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteStudySession(deleteId);
    } catch (err) {
      alert("Erro ao excluir sessão.");
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Weekly Planner Organizer Section */}
      <WeeklyPlannerSection />
      
      {/* Title & Trigger Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Sessões de Estudos Realizadas 📝</h2>
          <p className="text-xs text-slate-500">Mapeie seu tempo de dedicação líquida diária e organize novas agendas de fixação automática.</p>
        </div>

        {contents.length === 0 ? (
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-xl">
            Adicione conteúdos antes de logar estudos!
          </span>
         ) : (
          <button 
            onClick={() => setIsOpenForm(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Estudo</span>
          </button>
         )}
      </div>

      {/* Studies Timeline List */}
      {studies.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
          <Activity className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">Nenhum estudo registrado ainda.</p>
          <p className="text-xs text-slate-400">Pressione "Registrar Estudo" para cronometrar sua dedicação.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {studies.map((st) => {
            const subObj = subjects.find(s => s.id === st.materiaId);
            const contentObj = contents.find(c => c.id === st.conteudoId);
            const accuracy = st.questoesFeitas > 0 ? Math.round((st.acertos / st.questoesFeitas) * 100) : null;

            return (
              <div 
                key={st.id} 
                className="bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl p-5 hover:shadow-xs transition-all relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0"
              >
                {/* Accent Tag */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: subObj?.cor || "#cbd5e1" }} />

                {/* Left study information content */}
                <div className="space-y-1.5 pl-2.5 md:max-w-[65%]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span 
                      className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-md text-white" 
                      style={{ backgroundColor: subObj?.cor || "#6b7280" }}
                    >
                      {subObj?.nome || "Geral"}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Método: <strong className="text-slate-600">{st.metodo}</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{st.data}</span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base">{contentObj?.nome || "Tópico Desconhecido"}</h3>
                  
                  {st.observacao && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 leading-relaxed font-sans">
                      &ldquo;{st.observacao}&rdquo;
                    </p>
                  )}
                </div>

                {/* Right stats indicators */}
                <div className="flex items-center justify-between md:justify-end md:space-x-5 pl-2.5 md:pl-0 pt-3 md:pt-0 border-t border-slate-50 md:border-0">
                  
                  {/* Minutos estudados */}
                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-center">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase leading-none">Minutos</div>
                      <div className="text-xs font-extrabold text-slate-700 leading-none mt-0.5">{st.minutosEstudados}m</div>
                    </div>
                  </div>

                  {/* Questoes acertos percentage */}
                  {st.questoesFeitas > 0 && (
                    <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-center">
                      <CheckSquare className="h-4 w-4 text-indigo-600" />
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase leading-none">Desempenho</div>
                        <div className="text-xs font-extrabold text-slate-700 leading-none mt-0.5">{st.acertos} / {st.questoesFeitas} ({accuracy}%)</div>
                      </div>
                    </div>
                  )}

                  {/* Difficulty marker */}
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      st.dificuldadePercebida === 'Difícil' ? 'bg-rose-50 text-rose-600' :
                      st.dificuldadePercebida === 'Médio' ? 'bg-amber-50 text-amber-600' : 
                      'bg-slate-100 text-slate-600'
                    }`}>
                      Dificuldade: {st.dificuldadePercebida}
                    </span>
                    
                    <button 
                      onClick={() => handleDeleteTrigger(st.id, st.data)}
                      className="block text-[10px] font-semibold text-rose-500 hover:text-rose-600 mt-2 cursor-pointer ml-auto"
                    >
                      Remover log
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor/Creator Modal */}
      {isOpenForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Registrar Sessão de Estudo</h3>
                <button 
                  onClick={() => setIsOpenForm(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form container */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Data */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Data do Estudo</label>
                    <input 
                      type="date" 
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Método */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Método Utilizado</label>
                    <select 
                      value={metodo}
                      onChange={(e) => {
                        const val = e.target.value as StudyMethod;
                        setMetodo(val);
                        if (val === "Questão antes da aula" || val === "Questões depois da aula" || val === "Caderno de erros") {
                          setIncluiQuestoes(true);
                        } else {
                          setIncluiQuestoes(false);
                        }
                      }}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Aula/resumo">Aula/resumo (Teoria)</option>
                      <option value="Questão antes da aula">Questão antes da aula (Ativo)</option>
                      <option value="Questões depois da aula">Questões depois da aula (Prática)</option>
                      <option value="Revisão curta">Revisão curta</option>
                      <option value="Revisão profunda">Revisão profunda</option>
                      <option value="Caderno de erros">Revisão do Caderno de Erros</option>
                    </select>
                  </div>
                </div>

                {/* Subject and Content (Cascading select) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Selecione a Matéria</label>
                    <select 
                      value={materiaId}
                      onChange={(e) => {
                        setMateriaId(e.target.value);
                      }}
                      required
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Conteúdo Específico</label>
                    {availableContents.length === 0 ? (
                      <div className="text-xs text-rose-500 font-bold p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                        Nenhum conteúdo salvo nesta matéria!
                      </div>
                    ) : (
                      <select 
                        value={conteudoId}
                        onChange={(e) => setConteudoId(e.target.value)}
                        required
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                      >
                        {availableContents.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Minutos estudados & Questões / acertos */}
                <div className="bg-slate-50 border border-slate-100/40 p-4 rounded-2xl space-y-4">
                  
                  {/* Minutos */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Tempo de Estudo</label>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="number" 
                        min={1}
                        max={600}
                        value={minutosEstudados}
                        onChange={(e) => setMinutosEstudados(Number(e.target.value))}
                        required
                        className="w-28 border border-slate-200 rounded-xl p-2 text-sm bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none font-mono"
                      />
                      <span className="text-xs font-bold text-slate-500">minutos líquidos</span>
                    </div>
                  </div>

                  {/* Checkbox for including questions */}
                  <div className="flex items-center space-x-2 border-t border-slate-200/50 pt-3">
                    <input 
                      type="checkbox" 
                      id="incluiQuestoes"
                      checked={incluiQuestoes}
                      onChange={(e) => setIncluiQuestoes(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-teal-500 cursor-pointer"
                    />
                    <label htmlFor="incluiQuestoes" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                      Resolvi questões nesta sessão de estudos
                    </label>
                  </div>

                  {/* Conditionally rendering questions and hits inputs */}
                  {incluiQuestoes && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/50 animate-fade-in">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Questões Feitas</label>
                        <input 
                          type="number" 
                          min={1}
                          value={questoesFeitas}
                          onChange={(e) => setQuestoesFeitas(Number(e.target.value))}
                          required={incluiQuestoes}
                          className="w-full border border-slate-200 rounded-xl p-2 text-sm bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Acertos Obtidos</label>
                        <input 
                          type="number" 
                          min={0}
                          value={acertos}
                          onChange={(e) => setAcertos(Number(e.target.value))}
                          required={incluiQuestoes}
                          className="w-full border border-slate-200 rounded-xl p-2 text-sm bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dificuldade percebida */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Dificuldade Percebida</label>
                    <div className="flex space-x-2">
                      {["Fácil", "Médio", "Difícil"].map((level) => (
                        <button 
                          key={level}
                          type="button"
                          onClick={() => setDificuldadePercebida(level as DifficultyLevel)}
                          className={`flex-1 text-center py-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                            dificuldadePercebida === level 
                              ? level === 'Fácil' ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : level === 'Médio' ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300 scale-102 font-black'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checkbox scheduler Option */}
                  <div className="flex items-center space-x-2 border border-slate-100 rounded-xl p-3 bg-white">
                    <input 
                      type="checkbox" 
                      id="schedCheckbox"
                      checked={createAutoReviews}
                      onChange={(e) => setCreateAutoReviews(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-teal-500 cursor-pointer"
                    />
                    <label htmlFor="schedCheckbox" className="text-[11px] text-slate-600 font-bold leading-tight cursor-pointer selection:bg-transparent select-none">
                      Gerar revisões espaçadas automáticas no Anki (D1, D7, D15, D30, D60, D120, D240)
                    </label>
                  </div>
                </div>

                {/* Observacoes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Observações da Sessão</label>
                  <textarea 
                    placeholder="Quais foram seus principais achados ou conceitos errados? Como foi seu desempenho de foco?"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    rows={2}
                    maxLength={500}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none placeholder-slate-400"
                  />
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsOpenForm(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={availableContents.length === 0}
                    className={`text-white text-xs font-bold py-2 px-5 rounded-xl cursor-pointer ${
                      availableContents.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    Gravar Registro
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
        title="Excluir Sessão de Estudo"
        message={`Deseja realmente excluir a sessão de estudo realizada em ${deleteDesc}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        confirmText="Excluir"
        cancelText="Cancelar"
        danger={true}
      />

    </div>
  );
};
