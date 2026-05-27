import React, { useState } from 'react';
import { useData } from './context/DataContext';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { SubjectsTab } from './components/SubjectsTab';
import { ContentsTab } from './components/ContentsTab';
import { StudiesTab } from './components/StudiesTab';
import { ReviewsTab } from './components/ReviewsTab';
import { QuestionsTab } from './components/QuestionsTab';
import { ErrorsTab } from './components/ErrorsTab';
import { LoginScreen } from './components/LoginScreen';
import { 
  Sliders, 
  Layers, 
  CheckSquare, 
  BookOpen, 
  RotateCw, 
  HelpCircle, 
  AlertTriangle 
} from 'lucide-react';

export default function App() {
  const { user, loadingAuth, initializing } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // High usability: preselect specific content when pivoting from dashboard trigger
  const [preselectedContentId, setPreselectedContentId] = useState<string | undefined>(undefined);

  // Router handler from dashboard links
  const handleNavigateFromDashboard = (tab: string, contentId?: string) => {
    setActiveTab(tab);
    if (contentId) {
      setPreselectedContentId(contentId);
    }
  };

  const clearPreselected = () => {
    setPreselectedContentId(undefined);
  };

  // 1. Initial connection or authentication state checks
  if (initializing || loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        {/* Medicine themed heartbeat/circle spinner */}
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 border-4 border-teal-100 border-t-teal-700 rounded-full animate-spin" />
          <span className="absolute text-slate-400 text-[10px] uppercase font-mono font-bold">Med</span>
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-none">Revisae</p>
          <p className="text-[10px] text-slate-400">Sincronizando registros médicos com a nuvem Firebase...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated user gets the aesthetic onboarding page
  if (!user) {
    return <LoginScreen />;
  }

  // 3. Main logged workspace
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Dynamic Header (Branding, Export, Reset buttons) */}
      <Header />

      {/* Primary Tab Navigation Control Panel */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-3 overflow-x-auto py-3 no-scrollbar select-none scroll-smooth">
            
            {/* Dashboard */}
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>📊 Dashboard</span>
            </button>

            {/* Matérias */}
            <button 
              onClick={() => setActiveTab('subjects')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'subjects' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>Matérias</span>
            </button>

            {/* Conteúdos */}
            <button 
              onClick={() => setActiveTab('contents')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'contents' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Conteúdos</span>
            </button>

            {/* Estudos */}
            <button 
              onClick={() => setActiveTab('studies')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'studies' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Estudos</span>
            </button>

            {/* Revisões */}
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'reviews' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <RotateCw className="h-4 w-4 animate-spin-slow" />
              <span>Revisões Espaçadas</span>
            </button>

            {/* Questões */}
            <button 
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'questions' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>Questões</span>
            </button>

            {/* Caderno de Erros */}
            <button 
              onClick={() => setActiveTab('errors')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'errors' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Caderno de Erros 📓</span>
            </button>

          </div>
        </div>
      </div>

      {/* Main Workspace Frame container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'dashboard' && (
          <DashboardTab 
            onNavigateToTab={(index) => {
              const tabMapping: Record<number, string> = {
                0: 'dashboard',
                1: 'subjects',
                2: 'contents',
                3: 'studies',
                4: 'reviews',
                5: 'questions',
                6: 'errors',
              };
              const tabName = tabMapping[index] || 'dashboard';
              handleNavigateFromDashboard(tabName);
            }}
            onSelectQuickContent={(contentId, action) => {
              const tabName = action === 'study' ? 'studies' : 'reviews';
              handleNavigateFromDashboard(tabName, contentId);
            }}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectsTab />
        )}

        {activeTab === 'contents' && (
          <ContentsTab />
        )}

        {activeTab === 'studies' && (
          <StudiesTab 
            quickPreselectedContentId={preselectedContentId} 
            onClearQuickPreselected={clearPreselected} 
          />
        )}

        {activeTab === 'reviews' && (
          <ReviewsTab 
            quickPreselectedContentId={preselectedContentId} 
            onClearQuickPreselected={clearPreselected} 
          />
        )}

        {activeTab === 'questions' && (
          <QuestionsTab />
        )}

        {activeTab === 'errors' && (
          <ErrorsTab />
        )}

      </main>

      {/* Simple clean workspace copyright footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-[10px] text-slate-400">
        Revisae &copy; 2026 — Plataforma de Gerenciamento de Revisão Espaçada Ativa para Vestibulares de Medicina.
      </footer>

    </div>
  );
}
