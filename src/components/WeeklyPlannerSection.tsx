import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { WeeklyPlanner, PlannerRow } from '../types';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  Calendar, 
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export const WeeklyPlannerSection: React.FC = () => {
  const { weeklyPlanners, subjects, saveWeeklyPlanner, deleteWeeklyPlanner } = useData();

  // Selected week accordion state (IDs of expanded weeks)
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  // UI state for creating/editing week
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPlanner, setEditingPlanner] = useState<Partial<WeeklyPlanner> | null>(null);
  
  // Week deletion confirm modal
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleteTitle, setDeleteTitle] = useState('');

  const toggleWeek = (id: string) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenCreate = () => {
    // Determine next week name dynamically
    let defaultTitle = `Semana 1: `;
    if (weeklyPlanners.length > 0) {
      defaultTitle = `Semana ${weeklyPlanners.length + 1}: `;
    }

    // Pre-populate with current subjects
    const defaultRows: PlannerRow[] = subjects.map(s => ({
      id: `row_${Math.random().toString(36).substring(2, 9)}`,
      materiaId: s.id,
      conteudos: ''
    }));

    // Add an extra row by default
    defaultRows.push({
      id: `row_${Math.random().toString(36).substring(2, 9)}`,
      materiaId: 'extra',
      conteudos: ''
    });

    setEditingPlanner({
      titulo: defaultTitle,
      linhas: defaultRows
    });
    setEditorOpen(true);
  };

  const handleOpenEdit = (planner: WeeklyPlanner) => {
    setEditingPlanner({
      id: planner.id,
      titulo: planner.titulo,
      linhas: [...planner.linhas]
    });
    setEditorOpen(true);
  };

  const handleAddEditorRow = () => {
    if (!editingPlanner) return;
    const currentRows = editingPlanner.linhas || [];
    const newRow: PlannerRow = {
      id: `row_${Math.random().toString(36).substring(2, 9)}`,
      materiaId: subjects[0]?.id || 'extra',
      conteudos: ''
    };
    setEditingPlanner({
      ...editingPlanner,
      linhas: [...currentRows, newRow]
    });
  };

  const handleRemoveEditorRow = (rowId: string) => {
    if (!editingPlanner) return;
    const currentRows = editingPlanner.linhas || [];
    setEditingPlanner({
      ...editingPlanner,
      linhas: currentRows.filter(r => r.id !== rowId)
    });
  };

  const handleRowFieldChange = (rowId: string, field: 'materiaId' | 'conteudos', value: string) => {
    if (!editingPlanner) return;
    const currentRows = editingPlanner.linhas || [];
    const updated = currentRows.map(r => {
      if (r.id === rowId) {
        return { ...r, [field]: value };
      }
      return r;
    });
    setEditingPlanner({
      ...editingPlanner,
      linhas: updated
    });
  };

  const handleSavePlanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlanner || !editingPlanner.titulo?.trim()) {
      alert("Por favor, preencha o título da semana.");
      return;
    }

    try {
      await saveWeeklyPlanner({
        id: editingPlanner.id,
        titulo: editingPlanner.titulo.trim(),
        linhas: editingPlanner.linhas || []
      });
      setEditorOpen(false);
      setEditingPlanner(null);
    } catch (err) {
      alert("Erro ao gravar o planejamento semanal.");
    }
  };

  const handleDeleteTrigger = (id: string, title: string) => {
    setDeleteId(id);
    setDeleteTitle(title);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteWeeklyPlanner(deleteId);
      setConfirmDeleteOpen(false);
    } catch (err) {
      alert("Erro ao excluir planejamento.");
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
      
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <Calendar className="h-6 w-6 text-indigo-600" />
          <div>
            <h3 className="text-base font-bold text-slate-800">Organizador Semanal de Estudos 📅</h3>
            <p className="text-xs text-slate-500">Formule suas metas semanais de disciplinas no estilo Notion e saiba exatamente o que estudar.</p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center space-x-1 shadow-sm transition-colors self-start sm:self-center cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nova Semana</span>
        </button>
      </div>

      {/* Accordion list */}
      {weeklyPlanners.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">Nenhum planejamento semanal iniciado.</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5">
            Crie sua primeira semana! Nós iremos preencher a colunas de matérias para você economizar tempo digitando.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Começar Organização
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {weeklyPlanners.map((wp) => {
            const isOpen = expandedWeeks[wp.id] !== false; // default to expanded

            return (
              <div 
                key={wp.id} 
                className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs transition-colors"
              >
                {/* Accordion Trigger Header */}
                <div 
                  className="bg-slate-50/50 hover:bg-slate-50 p-4 flex items-center justify-between cursor-pointer select-none"
                  onClick={() => toggleWeek(wp.id)}
                >
                  <div className="flex items-center space-x-2.5">
                    {isOpen ? (
                      <ChevronDown className="h-4.5 w-4.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4.5 w-4.5 text-slate-400" />
                    )}
                    <span className="text-sm font-extrabold text-slate-800 font-sans">
                      {wp.titulo}
                    </span>
                  </div>

                  {/* Actions for this week */}
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEdit(wp)}
                      title="Editar esta semana"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-55/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrigger(wp.id, wp.titulo)}
                      title="Excluir semana"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Accordion Body - Notion Table */}
                {isOpen && (
                  <div className="p-4 bg-white border-t border-slate-50 overflow-x-auto">
                    {wp.linhas.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400 italic">
                        Nenhuma matéria adicionada a essa semana ainda. Clique em editar para adicionar matérias.
                      </div>
                    ) : (
                      <table className="w-full min-w-[500px] border-collapse text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400">
                            <th className="py-2.5 px-3 text-[10.5px] font-bold uppercase tracking-wider w-1/3">Matéria</th>
                            <th className="py-2.5 px-3 text-[10.5px] font-bold uppercase tracking-wider w-2/3">Conteúdos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60">
                          {wp.linhas.map((row) => {
                            // Find corresponding real subject details if available
                            const subjectDetails = subjects.find(s => s.id === row.materiaId);
                            const isExtra = row.materiaId === 'extra';

                            return (
                              <tr key={row.id} className="hover:bg-slate-50/25 transition-colors">
                                {/* Subject Identifier */}
                                <td className="py-3 px-3 align-top">
                                  {isExtra ? (
                                    <span className="inline-block bg-slate-100 text-slate-600 text-[10.5px] font-bold px-2.5 py-1 rounded-lg">
                                      Complementares / Extra
                                    </span>
                                  ) : subjectDetails ? (
                                    <span 
                                      className="inline-block text-white text-[10.5px] font-bold px-2.5 py-1 rounded-lg shadow-xs"
                                      style={{ backgroundColor: subjectDetails.cor }}
                                    >
                                      {subjectDetails.nome}
                                    </span>
                                  ) : (
                                    <span className="inline-block bg-slate-100 text-slate-400 text-[10.5px] font-bold px-2.5 py-1 rounded-lg italic">
                                      Matéria não encontrada
                                    </span>
                                  )}
                                </td>

                                {/* Planned Topics */}
                                <td className="py-3 px-3 text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                                  {row.conteudos.trim() ? (
                                    row.conteudos
                                  ) : (
                                    <span className="text-slate-300 italic font-normal">Nenhum conteúdo definido ainda</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Scheduler Creator/Editor Modal */}
      {editorOpen && editingPlanner && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-150 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5.5 w-5.5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingPlanner.id ? "Editar Tabela Semanal" : "Criar Agenda Organizadora"}
                </h3>
              </div>
              <button 
                onClick={() => setEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSavePlanner} className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Week Title Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                  Identificador da Semana *
                </label>
                <input 
                  type="text"
                  placeholder="Ex: Semana 2: 03/06 a 09/06"
                  value={editingPlanner.titulo || ''}
                  onChange={(e) => setEditingPlanner({ ...editingPlanner, titulo: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-semibold text-slate-800"
                />
              </div>

              {/* Rows List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-tight">
                    Mapeamento de Matérias e Assuntos
                  </span>
                  <button
                    type="button"
                    onClick={handleAddEditorRow}
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Adicionar Linha</span>
                  </button>
                </div>

                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {(editingPlanner.linhas || []).length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-xl text-xs text-slate-400 italic">
                      Nenhuma matéria listada. Adicione uma linha acima.
                    </div>
                  ) : (
                    (editingPlanner.linhas || []).map((row, index) => (
                      <div 
                        key={row.id} 
                        className="bg-slate-50/75 border border-slate-100 rounded-2xl p-3.5 flex flex-col md:flex-row items-stretch md:items-start gap-3 relative md:pr-10"
                      >
                        {/* Selector or Label */}
                        <div className="w-full md:w-2/5 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Matéria</label>
                          <select
                            value={row.materiaId}
                            onChange={(e) => handleRowFieldChange(row.id, 'materiaId', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700/90 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                          >
                            <option value="extra">Complementares / Extra</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id}>{s.nome}</option>
                            ))}
                          </select>
                        </div>

                        {/* Contents description area */}
                        <div className="w-full md:w-3/5 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Assuntos a Estudar (estilo Notion/Lista)</label>
                          <textarea
                            placeholder="Ex: Potenciação, radiciação ou Ler apostila pág 12-25"
                            value={row.conteudos}
                            onChange={(e) => handleRowFieldChange(row.id, 'conteudos', e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 placeholder-slate-350"
                          />
                        </div>

                        {/* Delete single row */}
                        <button
                          type="button"
                          onClick={() => handleRemoveEditorRow(row.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 bg-white hover:bg-rose-50 rounded-lg transition-colors border border-slate-100 md:border-0 md:bg-transparent md:absolute md:right-2 md:top-8 cursor-pointer self-end md:self-auto"
                          title="Remover linha"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-55 flex justify-end gap-2.5">
              <button 
                type="button"
                onClick={() => setEditorOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                onClick={handleSavePlanner}
                className="bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-5 rounded-xl cursor-pointer"
              >
                Salvar Metas
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation delete week modal */}
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Excluir Planejamento Semanal"
        message={`Deseja realmente deletar a programação de "${deleteTitle}"? Esta ação removerá a tabela permanentemente.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        confirmText="Excluir"
        cancelText="Cancelar"
        danger={true}
      />

    </div>
  );
};
