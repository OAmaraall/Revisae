import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { BookOpen, LogOut, Download, Upload, Trash2, Check, X, HelpCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, exportDataJSON, importDataJSON, clearAllUserData } = useData();
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirmWipe, setShowConfirmWipe] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const dataStr = exportDataJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `revisae_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Erro ao exportar dados.");
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await importDataJSON(text);
        setImportSuccess(true);
        setImportError('');
        setTimeout(() => {
          setImportSuccess(false);
          setShowSettings(false);
        }, 2000);
      } catch (err: any) {
        setImportError(err.message || 'Erro ao processar arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportTextSubmit = async () => {
    if (!importText.trim()) return;
    try {
      await importDataJSON(importText);
      setImportSuccess(true);
      setImportError('');
      setImportText('');
      setTimeout(() => {
        setImportSuccess(false);
        setShowImportDialog(false);
        setShowSettings(false);
      }, 2000);
    } catch (err: any) {
      setImportError(err.message || 'Erro ao processar JSON.');
    }
  };

  const handleWipeData = async () => {
    try {
      await clearAllUserData();
      setShowConfirmWipe(false);
      setShowSettings(false);
      alert("Todos os seus dados foram apagados com sucesso! O sistema foi resetado.");
    } catch (e) {
      alert("Erro ao deletar dados.");
    }
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-100">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Revisae</h1>
            <p className="text-[10px] text-teal-600 font-mono tracking-wider uppercase font-semibold">Premium Med Prep</p>
          </div>
        </div>

        {/* User Indicators & Quick Settings */}
        <div className="flex items-center space-x-3">
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-slate-600 font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Dados & Backup
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "Avatar"} 
                className="h-7 w-7 rounded-lg border border-teal-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-7 w-7 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold text-xs uppercase">
                {user.email?.substring(0, 2) || "U"}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-700 leading-tight truncate max-w-[120px]">
                {user.displayName || "Estudante"}
              </p>
              <p className="text-[9px] text-slate-400 font-medium leading-none truncate max-w-[120px]">
                {user.email}
              </p>
            </div>
            
            <button 
              onClick={() => logout()}
              title="Logout"
              className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-white transition-colors cursor-pointer ml-1"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Backup e Configuração</h3>
                <button 
                  onClick={() => {
                    setShowSettings(false);
                    setShowConfirmWipe(false);
                    setShowImportDialog(false);
                    setImportError('');
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Exportar dados</h4>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                    Salve todos os seus registros de estudos, conteúdos e revisões em um único arquivo JSON seguro.
                  </p>
                  <button 
                    onClick={handleExport}
                    className="w-full flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold py-2 px-4 rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Baixar Backup (.JSON)</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Importar dados</h4>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                    Carregue um arquivo de backup para restaurar ou sincronizar suas revisões na nuvem.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold py-2 px-3 rounded-xl border border-emerald-100 transition-all cursor-pointer"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload de Arquivo</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImportFile}
                      accept=".json"
                      className="hidden"
                    />
                    
                    <button 
                      onClick={() => setShowImportDialog(true)}
                      className="flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 transition-all cursor-pointer"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span>Colar texto JSON</span>
                    </button>
                  </div>

                  {importSuccess && (
                    <div className="mt-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl p-3 text-xs flex items-center space-x-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Importação executada com sucesso!</span>
                    </div>
                  )}

                  {importError && (
                    <div className="mt-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl p-3 text-xs">
                      {importError}
                    </div>
                  )}
                </div>

                {/* Clear options */}
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Zerar Conta</h4>
                  {!showConfirmWipe ? (
                    <button 
                      onClick={() => setShowConfirmWipe(true)}
                      className="w-full flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold py-2 px-4 rounded-xl border border-rose-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Apagar Todos os Dados</span>
                    </button>
                  ) : (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 space-y-3">
                      <p className="text-xs text-rose-800 font-medium">
                        ATENÇÃO! Esta ação é irreversível. Todas as suas matérias, revisões, sessões e logs de erros serão apagados permanentemente de sua conta Firebase.
                      </p>
                      <div className="flex space-x-2">
                        <button 
                          onClick={handleWipeData}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Sim, Apagar Tudo</span>
                        </button>
                        <button 
                          onClick={() => setShowConfirmWipe(false)}
                          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Pasting Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Importar texto JSON</h3>
                <button 
                  onClick={() => setShowImportDialog(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <textarea 
                placeholder='Cole o conteúdo do backup aqui. Deve ter tags "subjects", "contents", etc.' 
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={10}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono bg-slate-50 focus:ring-1 focus:ring-teal-500 focus:outline-none mb-4"
              />

              {importSuccess && (
                <div className="mb-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl p-3 text-xs flex items-center space-x-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>Importação concluída com sucesso!</span>
                </div>
              )}

              {importError && (
                <div className="mb-4 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl p-3 text-xs">
                  {importError}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportError('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleImportTextSubmit}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
                >
                  Processar e Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
