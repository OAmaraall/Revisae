import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Subject } from '../types';
import { Plus, Edit2, Trash2, X, Sliders, Hash, Star } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

const PALETTE = [
  "#EF4444", // Red
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#14B8A6", // Teal
  "#6B7280"  // Gray
];

export const SubjectsTab: React.FC = () => {
  const { subjects, saveSubject, deleteSubject, contents } = useData();

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // ConfirmModal State
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleteName, setDeleteName] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  // Form Fields
  const [nome, setNome] = useState('');
  const [peso, setPeso] = useState(3);
  const [prioridade, setPrioridade] = useState<"Alta" | "Média" | "Baixa">("Média");
  const [cor, setCor] = useState(PALETTE[0]);

  const handleOpenNew = () => {
    setEditingSubject(null);
    setNome('');
    setPeso(3);
    setPrioridade('Média');
    setCor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    setIsOpenForm(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setNome(sub.nome);
    setPeso(sub.peso);
    setPrioridade(sub.prioridade);
    setCor(sub.cor);
    setIsOpenForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    try {
      await saveSubject({
        id: editingSubject?.id || '',
        nome: nome.trim(),
        peso: Number(peso),
        prioridade,
        cor
      });
      setIsOpenForm(false);
    } catch (err) {
      alert("Erro ao salvar matéria.");
    }
  };

  const handleDeleteTrigger = (id: string, name: string) => {
    // Count contents linked to this subject
    const linkedContents = contents.filter(c => c.materiaId === id).length;
    let message = `Deseja realmente excluir a matéria "${name}"?`;
    if (linkedContents > 0) {
      message = `A matéria "${name}" possui ${linkedContents} conteúdos vinculados. Se você excluí-la, ela continuará salva nas revisões e estudos, mas os conteúdos ficarão órfãos. Confirmar exclusão?`;
    }
    setDeleteId(id);
    setDeleteName(name);
    setDeleteMessage(message);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteSubject(deleteId);
    } catch (err) {
      alert("Erro ao excluir matéria.");
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Trigger Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Matérias Acadêmicas 📚</h2>
          <p className="text-xs text-slate-500">Configure as disciplinas e atribua pesos com base na incidência das provas ou no peso do Sisu do seu foco.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Matéria</span>
        </button>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
            <Sliders className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">Nenhuma matéria criada.</p>
            <p className="text-xs text-slate-400">Clique em "Cadastrar Matéria" no topo para estruturar sua grade.</p>
          </div>
        ) : (
          subjects.map((sub) => {
            const numRelated = contents.filter(c => c.materiaId === sub.id).length;
            const subWeightPercent = Math.min(100, Math.round((sub.peso / 3) * 100));

            return (
              <div 
                key={sub.id} 
                className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-xs transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                {/* Accent Header Ribbon */}
                <div className="absolute left-0 right-0 top-0 h-1.5" style={{ backgroundColor: sub.cor }} />

                <div className="space-y-4">
                  
                  {/* Name and Meta */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight truncate max-w-[150px]" title={sub.nome}>{sub.nome}</h3>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {numRelated} {numRelated === 1 ? 'conteúdo' : 'conteúdos'}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      sub.prioridade === 'Alta' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                      sub.prioridade === 'Média' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      Prioridade {sub.prioridade}
                    </span>
                  </div>

                  {/* Weight stats and relative meter */}
                  <div className="space-y-1.5 bg-slate-50 border border-slate-100/40 rounded-xl p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Hash className="h-3.5 w-3.5" />
                        <span>Peso Acadêmico / Sisu</span>
                      </span>
                      <span className="font-mono text-slate-700">{sub.peso} de 3</span>
                    </div>
                    {/* Progress representation */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all" 
                        style={{ backgroundColor: sub.cor, width: `${subWeightPercent}%` }}
                      />
                    </div>
                  </div>

                </div>

                {/* Edit / Delete footer */}
                <div className="flex items-center justify-end space-x-2 pt-4 mt-4 border-t border-slate-50">
                  <button 
                    onClick={() => handleOpenEdit(sub)}
                    className="p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-teal-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Editar matéria"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteTrigger(sub.id, sub.nome)}
                    className="p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Excluir matéria"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Slide / Modal overlay */}
      {isOpenForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSubject ? "Editar Matéria" : "Cadastrar Nova Matéria"}
                </h3>
                <button 
                  onClick={() => setIsOpenForm(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Nome */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Nome da Matéria</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Biologia, Física Mecânica"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    maxLength={50}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Grid Fields */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Peso */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Peso Sisu (1-3)</label>
                    <input 
                      type="number" 
                      min={1}
                      max={3}
                      value={peso}
                      onChange={(e) => setPeso(Number(e.target.value))}
                      required
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>

                  {/* Prioridade */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Prioridade</label>
                    <select 
                      value={prioridade}
                      onChange={(e) => setPrioridade(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                      <option value="Baixa">Baixa</option>
                    </select>
                  </div>
                </div>

                {/* Color Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Cor da Matéria</label>
                  <div className="grid grid-cols-5 gap-2.5 p-1 bg-slate-50 border border-slate-100 rounded-xl">
                    {PALETTE.map((c) => (
                      <button 
                        key={c}
                        type="button"
                        onClick={() => setCor(c)}
                        className={`h-7 rounded-lg border-2 cursor-pointer transition-all ${
                          cor === c ? 'border-slate-800 scale-105 shadow-xs' : 'border-transparent hover:scale-102'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                  {/* Custom Hex Choice */}
                  <input 
                    type="text" 
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    placeholder="Hexadecimal manual: #000"
                    className="w-full mt-2 border border-slate-200 rounded-xl p-2 text-xs font-mono bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
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
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 px-5 rounded-xl cursor-pointer"
                  >
                    Salvar
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
        title="Excluir Matéria"
        message={deleteMessage}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        confirmText="Excluir"
        cancelText="Cancelar"
        danger={true}
      />

    </div>
  );
};
