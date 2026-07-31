import React from 'react';
import { Bot, RefreshCw, XCircle, CheckCircle2, Sparkles, Plane, Layers } from 'lucide-react';

export default function ScraperProgress({
  scrapingMessage,
  completedCount = 0,
  totalCount = 0,
  onCancel
}) {
  const percentage = totalCount > 0 
    ? Math.min(100, Math.max(10, Math.round((completedCount / totalCount) * 100))) 
    : 15;

  return (
    <div className="glass-panel p-8 text-center rounded-3xl border border-brand-500/40 bg-slate-900/80 backdrop-blur-xl shadow-glow space-y-6 max-w-2xl mx-auto my-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
            <Bot className="w-6 h-6 animate-bounce" />
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-100">Coleta Inteligente em Andamento</h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-400/10 text-amber-400 border border-amber-400/30 rounded-full animate-pulse">
                Ao Vivo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Nosso robô está minerando tarifas e combinações de voos
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-all border border-slate-700/60"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Progresso das Consultas</span>
          </span>
          <span className="text-brand-400 font-mono font-bold text-sm">
            {totalCount > 0 ? `${completedCount} de ${totalCount} (${percentage}%)` : `${percentage}%`}
          </span>
        </div>

        {/* Outer Bar */}
        <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner relative">
          {/* Inner Bar */}
          <div
            className="h-full bg-gradient-to-r from-brand-600 via-purple-500 to-amber-400 rounded-full transition-all duration-700 ease-out relative overflow-hidden shadow-glow"
            style={{ width: `${percentage}%` }}
          >
            {/* Animated Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Dynamic Status Message */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-left space-y-2">
        <div className="flex items-start space-x-2.5">
          <RefreshCw className="w-4 h-4 text-brand-400 animate-spin mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-200 leading-snug">
              {scrapingMessage || 'Raspando trechos aéreos no Google Flights...'}
            </p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              O robô analisa companhias como LATAM, GOL e Azul em tempo real. Os resultados serão atualizados na tela assim que cada lote for finalizado.
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
        <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <span className="text-[10px] font-semibold text-slate-300 block">1. Rotas Mapeadas</span>
        </div>
        <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/30 text-center">
          <Plane className="w-4 h-4 text-brand-400 mx-auto mb-1 animate-pulse" />
          <span className="text-[10px] font-bold text-brand-300 block">2. Minerando Preços</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-center">
          <Sparkles className="w-4 h-4 text-amber-400 mx-auto mb-1 opacity-60" />
          <span className="text-[10px] font-semibold text-slate-400 block">3. Ordenando Sincronia</span>
        </div>
      </div>
    </div>
  );
}
