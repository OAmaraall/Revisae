import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Plus, X, Search, Award, BookOpen, Layers, BarChart2, CheckSquare, Trash2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export const QuestionsTab: React.FC = () => {
  const { questions, subjects, contents, saveQuestionSession, deleteQuestionSession } = useData();

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ConfirmModal State
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleteDesc, setDeleteDesc] = useState('');

  // Form Fields
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [materiaId, setMateriaId] = useState('');
  const [conteudoId, setConteudoId] = useState('');
  const [fonte, setFonte] = useState('ENEM 2025');
  const [totalQuestoes, setTotalQuestoes] = useState(10);
  const [acertos, setAcertos] = useState(8);

  // Prefill defaults on load
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

  // Keep Erros as automatic difference calculation
  const calculatedErros = useMemo(() => {
    return Math.max(0, totalQuestoes - acertos);
  }, [totalQuestoes, acertos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiaId || !conteudoId || totalQuestoes <= 0) {
      alert("Preencha todos os campos.");
      return;
    }

    if (acertos > totalQuestoes) {
      alert("O número de acertos não pode ser maior que o número total de questões.");
      return;
    }

    try {
      await saveQuestionSession({
        data,
        materiaId,
        conteudoId,
        fonte: fonte.trim() || 'Simulado Geral',
        totalQuestoes: Number(totalQuestoes),
        acertos: Number(acertos),
        erros: calculatedErros
      });
      setIsOpenForm(false);
      alert("Lista de questões registrada com acertos mapeados!");
    } catch (err) {
      alert("Erro ao registrar lista de questões.");
    }
  };

  const handleDeleteTrigger = (id: string, fonteStr: string) => {
    setDeleteId(id);
    setDeleteDesc(fonteStr);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteQuestionSession(deleteId);
    } catch (e) {
      alert("Erro ao apagar registro.");
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  // Filter lists based on search
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const contentName = contents.find(c => c.id === q.conteudoId)?.nome || '';
      return q.fonte.toLowerCase().includes(searchQuery.toLowerCase()) ||
             contentName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [questions, contents, searchQuery]);

  // Overall Global Accuracy Gauge for vestibular prep
  const totalWeightyStats = useMemo(() => {
    const stats = questions.reduce(
      (acc, curr) => ({
        total: acc.total + curr.totalQuestoes,
        hits: acc.hits + curr.acertos,
        fails: acc.fails + curr.erros
      }),
      { total: 0, hits: 0, fails: 0 }
    );

    const averageRate = stats.total > 0 ? Math.round((stats.hits / stats.total) * 100) : 0;
    return { ...stats, averageRate };
  }, [questions]);

  return (
    <div className="space-y-6">
      
      {/* Title & Trigger Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Prática e Resolução de Questões 🎯</h2>
          <p className="text-xs text-slate-500">Registre e tabule gabaritos de listas de exercícios, provas antigas ou simulados de Medicina.</p>
        </div>

        {contents.length === 0 ? null : (
          <button 
            onClick={() => setIsOpenForm(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Lista</span>
          </button>
        )}
      </div>

      {/* Global Accuracy Metric Widgets Banner */}
      {questions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-5">
          
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aproveitamento Médio</span>
              <h4 className="text-2xl font-black text-slate-800 leading-tight">{totalWeightyStats.averageRate}%</h4>
              <p className="text-[10px] text-slate-500 font-semibold">Parâmetro de aprovação MED &gt; 82%</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-slate-200/60 pt-3 md:pt-0 md:pl-5">
            <div className="h-12 w-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Volume de Questões</span>
              <h4 className="text-2xl font-black text-slate-800 leading-tight">{totalWeightyStats.total}</h4>
              <p className="text-[10px] text-slate-500 font-semibold">{totalWeightyStats.hits} Acertos • {totalWeightyStats.fails} Erros</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-slate-200/60 pt-3 md:pt-0 md:pl-5">
            <div className="h-12 w-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Metas e Foco</span>
              <h4 className="text-sm font-bold text-slate-700 leading-snug">Rótulos FUVEST/ENEM</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">Alta taxa de fixação ativa nas revisões.</p>
            </div>
          </div>

        </div>
      )}

      {/* Search Input Filter */}
      <div className="relative">
        <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input 
          type="text" 
          placeholder="Filtrar resoluções de questões por vestibular, fonte ou nome de conteúdo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
        />
      </div>

      {/* Table Feed of Solved Lists */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-2xl">
          <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">Nenhuma lista de questões logada.</p>
          <p className="text-xs text-slate-400">Pratique questões de edital e guarde o balanço de acertos aqui.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 shadow-xs rounded-2xl overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Data</th>
                  <th className="py-3.5 px-5">Matéria / Conteúdo</th>
                  <th className="py-3.5 px-5">Fonte / Vestibular</th>
                  <th className="py-3.5 px-5">Métrica (Acertos / Total)</th>
                  <th className="py-3.5 px-5">Taxa de Acerto</th>
                  <th className="py-3.5 px-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredQuestions.map(q => {
                  const subObj = subjects.find(s => s.id === q.materiaId);
                  const contentObj = contents.find(c => c.id === q.conteudoId);
                  const rateColor = q.taxaAcerto >= 80 ? 'text-emerald-600 font-black' :
                                    q.taxaAcerto >= 60 ? 'text-amber-600 font-bold' : 'text-rose-600 font-bold';

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Date */}
                      <td className="py-4 px-5 font-mono text-slate-500 font-semibold">{q.data}</td>

                      {/* Subject and Content */}
                      <td className="py-4 px-5">
                        <div className="space-y-1 pl-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: subObj?.cor || "#cbd5e1" }} />
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{subObj?.nome || "Sem Matéria"}</span>
                          </div>
                          <h4 className="font-bold text-slate-800 leading-tight truncate max-w-[200px]" title={contentObj?.nome}>{contentObj?.nome || "Assunto Desconhecido"}</h4>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-4 px-5">
                        <span className="bg-slate-100 text-slate-700 font-bold font-sans tracking-tight rounded-md px-2.5 py-1 text-[10.5px]">
                          {q.fonte}
                        </span>
                      </td>

                      {/* Correct / Total counts */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-600">
                          <strong>{q.acertos}</strong> acertos de <strong>{q.totalQuestoes}</strong>
                          <span className="text-[10px] font-medium text-slate-400 block">{q.erros} erros cometidos</span>
                        </div>
                      </td>

                      {/* Taxa de acerto calculated automatically */}
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-1.5">
                          <span className={`${rateColor} text-sm font-mono`}>{q.taxaAcerto}%</span>
                          
                          {/* Circle indicator */}
                          <div className="w-1.5 h-1.5 rounded-full" style={{ 
                            backgroundColor: q.taxaAcerto >= 80 ? '#10B981' : 
                                            q.taxaAcerto >= 60 ? '#F59E0B' : '#EF4444' 
                          }} />
                        </div>
                      </td>

                      {/* Delete Action (Irreversible) */}
                      <td className="py-4 px-5 text-right">
                        <button 
                          onClick={() => handleDeleteTrigger(q.id, q.fonte)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Remover Registro"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Editor Modal */}
      {isOpenForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Registrar Prática de Questões</h3>
                <button onClick={() => setIsOpenForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form container */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Data & Fonte */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Data da Prática</label>
                    <input 
                      type="date" 
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Fonte da Questão</label>
                    <input 
                      type="text" 
                      placeholder="Ex: FUVEST 2024, ENEM, Vestibular"
                      value={fonte}
                      onChange={(e) => setFonte(e.target.value)}
                      maxLength={50}
                      required
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Subject selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Matéria Vinculada</label>
                  <select 
                    value={materiaId}
                    onChange={(e) => setMateriaId(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white cursor-pointer focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Content cascading selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Especifique o Conteúdo</label>
                  {availableContents.length === 0 ? (
                    <div className="text-xs text-rose-500 font-bold p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                      Nenhum conteúdo nesta matéria cadastrado ainda.
                    </div>
                  ) : (
                    <select 
                      value={conteudoId}
                      onChange={(e) => setConteudoId(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white cursor-pointer focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    >
                      {availableContents.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Question math metrics */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-100/30 p-3.5 rounded-2xl">
                  
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Total Geral</label>
                    <input 
                      type="number" 
                      min={1}
                      value={totalQuestoes}
                      onChange={(e) => setTotalQuestoes(Number(e.target.value))}
                      required
                      className="w-full border border-slate-200 rounded-xl p-2 text-sm bg-white text-center font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Acertos Lic.</label>
                    <input 
                      type="number" 
                      min={0}
                      value={acertos}
                      onChange={(e) => setAcertos(Number(e.target.value))}
                      required
                      className="w-full border border-slate-200 rounded-xl p-2 text-sm bg-white text-center font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Erros Auto</label>
                    <div className="w-full bg-slate-100 rounded-xl p-2 text-sm font-bold text-slate-600 text-center font-mono select-none">
                      {calculatedErros}
                    </div>
                  </div>

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
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 px-5 rounded-xl cursor-pointer disabled:bg-slate-300"
                  >
                    Registrar Métrica
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
        title="Excluir Registro de Questões"
        message={`Deseja realmente apagar o registro da lista "${deleteDesc}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        confirmText="Excluir"
        cancelText="Cancelar"
        danger={true}
      />

    </div>
  );
};
