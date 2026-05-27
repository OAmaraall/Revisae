import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Content, ContentStatus, DifficultyLevel, PriorityLevel } from '../types';
import { Plus, Edit2, Trash2, X, Search, SlidersHorizontal, Eye, AlertCircle, Calendar } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export const ContentsTab: React.FC = () => {
  const { contents, subjects, saveContent, deleteContent } = useData();

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // ConfirmModal State
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleteName, setDeleteName] = useState('');

  // Form Fields
  const [materiaId, setMateriaId] = useState('');
  const [nome, setNome] = useState('');
  const [bloco, setBloco] = useState('');
  const [status, setStatus] = useState<ContentStatus>("Não iniciado");
  const [dificuldade, setDificuldade] = useState<DifficultyLevel>("Médio");
  const [dataLimite, setDataLimite] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Pre-fill fields for a new Content with some sensible defaults
  const handleOpenNew = () => {
    setEditingContent(null);
    setMateriaId(subjects[0]?.id || '');
    setNome('');
    setBloco('Módulo 01');
    setStatus('Não iniciado');
    setDificuldade('Médio');
    
    // Default deadline is empty as requested to remove deadline option
    setDataLimite('');
    setObservacoes('');
    setIsOpenForm(true);
  };

  const handleOpenEdit = (c: Content) => {
    setEditingContent(c);
    setMateriaId(c.materiaId);
    setNome(c.nome);
    setBloco(c.bloco);
    setStatus(c.status);
    setDificuldade(c.dificuldade);
    setDataLimite(c.dataLimite || '');
    setObservacoes(c.observacoes || '');
    setIsOpenForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiaId || !nome.trim()) return;

    try {
      await saveContent({
        id: editingContent?.id || '',
        materiaId,
        nome: nome.trim(),
        bloco: bloco.trim() || 'Geral',
        status,
        dificuldade,
        prioridade: editingContent?.prioridade || 'Média',
        dataLimite,
        observacoes: observacoes.trim()
      });
      setIsOpenForm(false);
    } catch (err) {
      alert("Erro ao salvar conteúdo.");
    }
  };

  const handleDeleteTrigger = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteContent(deleteId);
    } catch (err) {
      alert("Erro ao excluir conteúdo.");
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  // Status Styling Colors Helper
  const getStatusStyle = (st: ContentStatus) => {
    switch (st) {
      case "Não iniciado":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "Resumo lido":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Aula vista":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "Questões feitas":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Em revisão":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Dominado":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  // Filter application
  const filteredContents = useMemo(() => {
    return contents.filter(c => {
      const matchesSearch = c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.bloco && c.bloco.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSubject = filterSubject === 'Todos' || c.materiaId === filterSubject;
      const matchesStatus = filterStatus === 'Todos' || c.status === filterStatus;
      
      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [contents, searchQuery, filterSubject, filterStatus]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      
      {/* Title & Trigger Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Conteúdos e Edital 📑</h2>
          <p className="text-xs text-slate-500">Mapeie seu cronograma, monitore sua evolução no edital de vestibular e estabeleça prazos de conclusão.</p>
        </div>
        
        {subjects.length === 0 ? (
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
            Crie ao menos uma matéria para poder salvar conteúdos!
          </span>
        ) : (
          <button 
            onClick={handleOpenNew}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Conteúdo</span>
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3">
        
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por conteúdo ou módulo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Matter dropdown */}
        <div className="w-full md:w-48 flex items-center space-x-1.5 p-1 bg-white border border-slate-200 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 pl-2">Matéria:</span>
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="flex-1 border-0 text-xs bg-transparent focus:ring-0 focus:outline-none py-1.5 cursor-pointer text-slate-700 font-medium"
          >
            <option value="Todos">Todas</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
        </div>

        {/* Status dropdown */}
        <div className="w-full md:w-48 flex items-center space-x-1.5 p-1 bg-white border border-slate-200 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 pl-2">Status:</span>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 border-0 text-xs bg-transparent focus:ring-0 focus:outline-none py-1.5 cursor-pointer text-slate-700 font-medium"
          >
            <option value="Todos">Todos</option>
            <option value="Não iniciado">Não iniciado</option>
            <option value="Resumo lido">Resumo lido</option>
            <option value="Aula vista">Aula vista</option>
            <option value="Questões feitas">Questões feitas</option>
            <option value="Em revisão">Em revisão</option>
            <option value="Dominado">Dominado</option>
          </select>
        </div>

      </div>

      {/* Contents Display */}
      {filteredContents.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
          <SlidersHorizontal className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">Nenhum conteúdo encontrado.</p>
          <p className="text-xs text-slate-400">Tente ajustar seus filtros na barra ou cadastre conteúdos.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-50 shadow-xs rounded-2xl overflow-hidden">
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Matéria</th>
                  <th className="py-3.5 px-5">Conteúdo / Módulo</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Dificuldade</th>
                  <th className="py-3.5 px-5">Prazo Estimado</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredContents.map(c => {
                  const subObj = subjects.find(s => s.id === c.materiaId);
                  const isOverdue = c.dataLimite && c.dataLimite < todayStr && c.status !== "Dominado";

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Subject */}
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-2">
                          <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: subObj?.cor || "#cbd5e1" }} />
                          <span className="font-semibold text-slate-700">{subObj?.nome || "Sem Matéria"}</span>
                        </div>
                      </td>
                      
                      {/* Name / Block / Obs tag */}
                      <td className="py-4 px-5 max-w-sm">
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-800 leading-tight truncate">{c.nome}</h4>
                          <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400">
                            <span>{c.bloco}</span>
                            {c.observacoes && (
                              <span className="cursor-help text-teal-600 bg-teal-50 px-1 rounded-sm" title={c.observacoes}>
                                obs
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusStyle(c.status)}`}>
                          {c.status}
                        </span>
                      </td>

                      {/* Difficulty */}
                      <td className="py-4 px-5">
                        <span className={`font-semibold ${
                          c.dificuldade === 'Difícil' ? 'text-rose-600' :
                          c.dificuldade === 'Médio' ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {c.dificuldade}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-1">
                          <Calendar className={`h-3.5 w-3.5 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                          <span className={`font-mono font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                            {c.dataLimite || "Sem limite"}
                          </span>
                          {isOverdue && (
                            <span className="bg-rose-50 text-rose-600 text-[9px] px-1 rounded-sm font-bold animate-pulse">
                              Atrasado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button 
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTrigger(c.id, c.nome)}
                            className="p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (Visible below md) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredContents.map(c => {
              const subObj = subjects.find(s => s.id === c.materiaId);
              const isOverdue = c.dataLimite && c.dataLimite < todayStr && c.status !== "Dominado";

              return (
                <div key={c.id} className="p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: subObj?.cor || "#cbd5e1" }} />
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{subObj?.nome || "Materia"}</span>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{c.nome}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{c.bloco}</p>
                    </div>
                    
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusStyle(c.status)}`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-100/30 p-2 rounded-xl">
                    <div>
                      <span className="text-slate-400">Dificuldade:</span> <strong className="text-slate-600">{c.dificuldade}</strong>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                        {c.dataLimite || "s/ prazo"}
                      </span>
                      {isOverdue && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />}
                    </div>
                  </div>

                  {c.observacoes && (
                    <p className="text-[10px] text-slate-400 italic bg-gray-50 p-2 rounded-lg truncate">
                      * {c.observacoes}
                    </p>
                  )}

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-50">
                    <button 
                      onClick={() => handleOpenEdit(c)}
                      className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteTrigger(c.id, c.nome)}
                      className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Editor Modal */}
      {isOpenForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingContent ? "Editar Conteúdo" : "Cadastrar Conteúdo"}
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
                
                {/* Materia vinculada */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Matéria Vinculada</label>
                  <select 
                    value={materiaId}
                    onChange={(e) => setMateriaId(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer text-slate-700 font-medium"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Nome */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Nome do Tópico/Conteúdo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Citologia, Termodinâmica Química, Juros Compostos"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    maxLength={100}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Bloco/Modulo */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Bloco / Módulo / Apostila</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Módulo 1, Extensivo"
                    value={bloco}
                    onChange={(e) => setBloco(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Status, Dificuldade */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Evolução</label>
                    <select 
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Não iniciado">Não iniciado</option>
                      <option value="Resumo lido">Resumo lido</option>
                      <option value="Aula vista">Aula vista</option>
                      <option value="Questões feitas">Questões feitas</option>
                      <option value="Em revisão">Em revisão</option>
                      <option value="Dominado">Dominado</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Dificuldade</label>
                    <select 
                      value={dificuldade}
                      onChange={(e) => setDificuldade(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Fácil">Fácil</option>
                      <option value="Médio">Médio</option>
                      <option value="Difícil">Difícil</option>
                    </select>
                  </div>
                </div>

                {/* Observacoes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Observações, Macetes ou Foco</label>
                  <textarea 
                    placeholder="Anote detalhes importantes de lembrete como fórmulas, pegadinhas reincidentes no edital..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
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
        title="Excluir Conteúdo"
        message={`Deseja realmente excluir o conteúdo "${deleteName}"? Suas sessões de estudo vinculadas perderão esta referência.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        confirmText="Excluir"
        cancelText="Cancelar"
        danger={true}
      />

    </div>
  );
};
