import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { ErrorStatus } from '../types';
import { Plus, X, Search, Lightbulb, SlidersHorizontal, BookOpen, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export const ErrorsTab: React.FC = () => {
  const { errors, subjects, contents, saveErrorEntry, toggleErrorStatus, deleteErrorEntry } = useData();

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingError, setEditingError] = useState<any>(null);

  // ConfirmModal State
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Todos' | ErrorStatus>('Todos');

  // Form Fields
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [materiaId, setMateriaId] = useState('');
  const [conteudoId, setConteudoId] = useState('');
  const [descricaoErro, setDescricaoErro] = useState('');
  const [explicacaoCorreta, setExplicacaoCorreta] = useState('');
  const [comoEvitar, setComoEvitar] = useState('');
  const [status, setStatus] = useState<ErrorStatus>("aberto");

  // Defaults on load
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

  const handleOpenNew = () => {
    setEditingError(null);
    setMateriaId(subjects[0]?.id || '');
    setDescricaoErro('');
    setExplicacaoCorreta('');
    setComoEvitar('');
    setStatus('aberto');
    setIsOpenForm(true);
  };

  const handleOpenEdit = (err: any) => {
    setEditingError(err);
    setMateriaId(err.materiaId);
    setConteudoId(err.conteudoId);
    setDescricaoErro(err.descricaoErro);
    setExplicacaoCorreta(err.explicacaoCorreta);
    setComoEvitar(err.comoEvitar);
    setStatus(err.status);
    setData(err.data || new Date().toISOString().split('T')[0]);
    setIsOpenForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiaId || !conteudoId || !descricaoErro.trim()) return;

    try {
      await saveErrorEntry({
        id: editingError?.id || '',
        data,
        materiaId,
        conteudoId,
        descricaoErro: descricaoErro.trim(),
        explicacaoCorreta: explicacaoCorreta.trim(),
        comoEvitar: comoEvitar.trim(),
        status
      });
      setIsOpenForm(false);
      alert(editingError ? "Conceito de erro atualizado!" : "Gatilho de erro adicionado ao caderno secreto!");
    } catch (err) {
      alert("Erro ao salvar erro.");
    }
  };

  const handleDeleteTrigger = (id: string) => {
    setDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteErrorEntry(deleteId);
    } catch (err) {
      alert("Erro ao excluir.");
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  const handleCycleStatus = async (id: string, current: ErrorStatus) => {
    const sequence: ErrorStatus[] = ["aberto", "revisado", "resolvido"];
    const nextIdx = (sequence.indexOf(current) + 1) % sequence.length;
    try {
      await toggleErrorStatus(id, sequence[nextIdx]);
    } catch (err) {
      alert("Erro ao alternar status.");
    }
  };

  // Filter application
  const filteredErrors = useMemo(() => {
    return errors.filter(er => {
      const matchSearch = er.descricaoErro.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          er.comoEvitar.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'Todos' || er.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [errors, searchQuery, filterStatus]);

  return (
    <div className="space-y-6">
      
      {/* Title & Trigger Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Caderno de Erros Secreto 📓</h2>
          <p className="text-xs text-slate-500">Mapeie pegadinhas, erros recorrentes e crie gatilhos mentais para blindar sua nota nas provas.</p>
        </div>

        {contents.length === 0 ? null : (
          <button 
            onClick={handleOpenNew}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Mapear Erro</span>
          </button>
        )}
      </div>

      {/* Filter and Search controls */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        
        {/* Search */}
        <div className="flex-1 relative w-full">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por descrição de erro, gatilhos de mitigação ou fórmulas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Status Tab buttons */}
        <div className="flex space-x-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(["Todos", "aberto", "revisado", "resolvido"] as const).map((st) => (
            <button 
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === st 
                  ? 'bg-slate-800 text-white shadow-xs' 
                  : 'text-slate-500 hover:bg-slate-100 bg-white border border-slate-250/20'
              }`}
            >
              {st === 'Todos' ? 'Todos os erros' : 
               st === 'aberto' ? 'Abertos 🔴' : 
               st === 'revisado' ? 'Revisados 🟡' : 'Resolvidos 🟢'}
            </button>
          ))}
        </div>

      </div>

      {/* Error Notebook Grid display */}
      {filteredErrors.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-2xl">
          <Lightbulb className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">Nenhum erro registrado neste filtro.</p>
          <p className="text-xs text-slate-400">Errar faz parte! Guarde suas falhas de simulados para dominá-las futuramente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredErrors.map((er) => {
            const subObj = subjects.find(s => s.id === er.materiaId);
            const contentObj = contents.find(c => c.id === er.conteudoId);
            
            const badgeColor = er.status === 'aberto' ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' :
                               er.status === 'revisado' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                               'bg-emerald-50 text-emerald-800 border-emerald-200';

            return (
              <div 
                key={er.id} 
                className="bg-white border border-slate-150/60 rounded-2xl p-5 hover:shadow-xs transition-shadow flex flex-col justify-between relative overflow-hidden"
              >
                {/* Accent Tag */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: subObj?.cor || "#cbd5e1" }} />

                <div className="space-y-4">
                  {/* Top Bar tags */}
                  <div className="flex items-start justify-between pl-1">
                    <div className="space-y-0.5">
                      <span 
                        className="text-[9px] font-extrabold px-2 py-0.5 rounded-md text-white mr-2" 
                        style={{ backgroundColor: subObj?.cor || "#6b7280" }}
                      >
                        {subObj?.nome || "Sem Matéria"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tight">{er.data}</span>
                    </div>

                    {/* Cycle Status Badge */}
                    <button 
                      onClick={() => handleCycleStatus(er.id, er.status)}
                      title="Clique para alternar status do erro"
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer select-none ${badgeColor}`}
                    >
                      {er.status === 'aberto' ? 'Aberto 🔴' : 
                       er.status === 'revisado' ? 'Revisado 🟡' : 'Resolvido 🟢'}
                    </button>
                  </div>

                  {/* Header Subtopic Name */}
                  <h3 className="font-bold text-slate-700 text-sm pl-1 uppercase tracking-tight">
                    Tópico: <strong className="text-slate-800 normal-case">{contentObj?.nome || "Geral / Vestibular"}</strong>
                  </h3>

                  {/* Core Content boxes (The visual secret!) */}
                  <div className="space-y-2.5 pl-1.5 border-l-2 border-slate-100">
                    
                    {/* Descricao do Erro */}
                    <div className="space-y-1">
                      <div className="text-[9.5px] uppercase font-bold text-rose-500 flex items-center space-x-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>O que eu errei (A pegadinha / lacuna)</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium bg-rose-50/20 p-2.5 rounded-lg border border-rose-100/30">
                        {er.descricaoErro}
                      </p>
                    </div>

                    {/* Explicação Correta */}
                    <div className="space-y-1">
                      <div className="text-[9.5px] uppercase font-bold text-emerald-600 flex items-center space-x-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Resolução Matemática / Conceito Correto</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/30">
                        {er.explicacaoCorreta}
                      </p>
                    </div>

                    {/* Como Evitar */}
                    <div className="space-y-1">
                      <div className="text-[9.5px] uppercase font-bold text-teal-600 flex items-center space-x-1">
                        <Lightbulb className="h-3.5 w-3.5" />
                        <span>Como Evitar / Gatilho de Atenção</span>
                      </div>
                      <p className="text-xs text-teal-900 leading-relaxed font-mono bg-teal-50/35 p-2.5 rounded-lg border border-teal-100/20">
                        {er.comoEvitar}
                      </p>
                    </div>

                  </div>

                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end space-x-3 pt-3.5 mt-3.5 border-t border-slate-50">
                  <button 
                    onClick={() => handleOpenEdit(er)}
                    className="text-[10.5px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    Editar Conceito
                  </button>
                  <button 
                    onClick={() => handleDeleteTrigger(er.id)}
                    className="text-[10.5px] font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Remover Erro
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {isOpenForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6">
              
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingError ? "Editar Registro de Erro" : "Mapear Novo Erro no Caderno"}
                </h3>
                <button onClick={() => setIsOpenForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Data e Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Data do Erro</label>
                    <input 
                      type="date" 
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white font-mono focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Status Inicial</label>
                    <select 
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ErrorStatus)}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white cursor-pointer focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="aberto">Aberto 🔴</option>
                      <option value="revisado">Revisado 🟡</option>
                      <option value="resolvido">Resolvido 🟢</option>
                    </select>
                  </div>
                </div>

                {/* Subject selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Matéria Vinculada</label>
                  <select 
                    value={materiaId}
                    onChange={(e) => setMateriaId(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white cursor-pointer"
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
                      Nenhum conteúdo nesta matéria cadastrado ainda.
                    </div>
                  ) : (
                    <select 
                      value={conteudoId}
                      onChange={(e) => setConteudoId(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white cursor-pointer"
                    >
                      {availableContents.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* O Erro (A pegadinha / lacuna) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">O que eu errei (A pegadinha / lacuna)</label>
                  <textarea 
                    placeholder="Descreva o que levou ao erro: pegadinha interpretativa, sinal de cálculo trocado, etc."
                    value={descricaoErro}
                    onChange={(e) => setDescricaoErro(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    required
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Explicação Correta */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Resolução Matemática / Conceito Correto</label>
                  <textarea 
                    placeholder="Qual é a explicação científica ou o cálculo matemático perfeito que resolve este exercício?"
                    value={explicacaoCorreta}
                    onChange={(e) => setExplicacaoCorreta(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    required
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Como Evitar */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Como Evitar / Gatilho de Atenção</label>
                  <textarea 
                    placeholder="Qual o macete prático para se lembrar dessa regra na hora do vestibular? Ex: 'Ler as perguntas antes do texto...'"
                    value={comoEvitar}
                    onChange={(e) => setComoEvitar(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    required
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none placeholder-teal-600/60 font-mono"
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
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 px-5 rounded-xl cursor-pointer disabled:bg-slate-300"
                  >
                    Salvar no Caderno
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
        title="Excluir Erro do Caderno"
        message="Deseja deletar para sempre este erro de seu caderno de reincidências?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        confirmText="Excluir"
        cancelText="Cancelar"
        danger={true}
      />

    </div>
  );
};
