import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { BookOpen, Award, CheckSquare, ShieldCheck, Heart, ArrowRight } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useData();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await login();
    } catch (e) {
      console.error("Sign in failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between overflow-x-hidden font-sans select-none">
      
      {/* Upper background visual highlights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-100/30 rounded-full blur-3xl pointer-events-none transform -translate-x-20 translate-y-20" />

      {/* Main hero cards */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 my-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center relative z-10">
        
        {/* Left column info */}
        <div className="space-y-6 text-left">
          
          <div className="inline-flex items-center space-x-2 bg-teal-50 border border-teal-100 text-teal-800 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500 animate-pulse" />
            <span>Premium Med Prep Core</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-800">
              Revisae
            </h1>
            <p className="text-lg font-semibold text-teal-700 leading-snug">
              O cockpit de revisão espaçada definitivo para aprovação em Medicina.
            </p>
          </div>

          <p className="text-slate-500 text-sm leading-relaxed font-sans">
            Esqueça as planilhas complexas. Cadastre sua grade, registre sessões de estudos e o algoritmo calibra seus cartões de resumos e revisões automáticas (D1 a D240) à prova de esquecimento.
          </p>

          {/* Icon highlights */}
          <div className="space-y-3.5 pt-2">
            
            <div className="flex items-start space-x-3">
              <div className="h-6 w-6 mt-0.5 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-slate-700">Priorização Ponderada</h4>
                <p className="text-slate-450 text-slate-500 leading-relaxed">Algoritmo integrado recalcula pesos de disciplinas, taxas de erros e prazos de vestibular.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-6 w-6 mt-0.5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-slate-700">Blindagem do Caderno de Erros</h4>
                <p className="text-slate-500 leading-relaxed">Mapeie falhas de simulados e crie gatilhos mentais para blindar sua nota nas provas.</p>
              </div>
            </div>

          </div>

        </div>

        {/* Right column card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between text-center space-y-6">

          <div className="absolute top-0 right-0 bg-teal-500/10 text-teal-700 font-extrabold font-mono text-[9px] uppercase px-3 py-1 rounded-bl-xl tracking-wider">
            Cloud Sync v1.0
          </div>

          <div className="space-y-2">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center text-white mx-auto shadow-md shadow-teal-100">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Conecte sua Conta</h3>
            <p className="text-xs text-slate-400">
              Sua nuvem de estudos armazena matérias, logs e cadernos de erros no Firebase para acessar de qualquer celular ou PC.
            </p>
          </div>

          <div className="space-y-4">
            
            {/* Google Authentication Trigger */}
            <button 
              onClick={handleSignIn}
              disabled={loading}
              className={`w-full flex items-center justify-center space-x-3 bg-slate-900 hover:bg-slate-850 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-slate-200 transition-all cursor-pointer ${
                loading ? 'opacity-80 cursor-wait' : ''
              }`}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {/* Google Custom SVG Icon */}
                  <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12.24 10.285V13.4h6.86c-.277 1.56-1.602 4.585-6.86 4.585-4.54 0-8.24-3.765-8.24-8.4s3.7-8.4 8.24-8.4c2.58 0 4.307 1.095 5.298 2.045l2.465-2.37C18.435 1.21 15.62 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.4-.195-1.925H12.24z"/>
                  </svg>
                  <span className="text-sm">Acessar com o Google</span>
                </>
              )}
            </button>

            <span className="block text-[10px] text-slate-400">
              Ao acessar, você concorda com os termos de salvaguarda do banco Firebase cooperativo.
            </span>

          </div>

          {/* Academic features showcase bullet */}
          <div className="border-t border-slate-50 pt-4 flex justify-around text-center">
            <div>
              <div className="text-sm font-black text-slate-800">11+</div>
              <div className="text-[9px] text-slate-400 uppercase font-mono tracking-wider font-bold">Matérias Pré-Salvas</div>
            </div>
            <div className="border-r border-slate-100" />
            <div>
              <div className="text-sm font-black text-slate-800">Anki</div>
              <div className="text-[9px] text-slate-400 uppercase font-mono tracking-wider font-bold">Algoritmo Espaçado</div>
            </div>
            <div className="border-r border-slate-100" />
            <div>
              <div className="text-sm font-black text-slate-800">Erros</div>
              <div className="text-[9px] text-slate-400 uppercase font-mono tracking-wider font-bold">Resumos Ativos</div>
            </div>
          </div>

        </div>

      </div>

      {/* Footer credits */}
      <footer className="py-6 text-center text-[10px] text-slate-400 border-t border-slate-100">
        Revisae Medicina Academics &copy; 2026. Feito com design focado em Medicina Geral.
      </footer>

    </div>
  );
};
