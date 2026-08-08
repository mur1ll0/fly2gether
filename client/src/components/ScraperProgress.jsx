import React from 'react';
import { Bot, RefreshCw, XCircle, CheckCircle2, Sparkles, Plane, Layers, Flame, AlertTriangle } from 'lucide-react';
import { formatToBrazillianDate } from '../utils/dateFormatter';

export default function ScraperProgress({
  scrapingMessage,
  completedCount = 0,
  totalCount = 0,
  totalOffersFound = 0,
  legDetails = [],
  onCancel
}) {
  const percentage = totalCount > 0 
    ? Math.min(100, Math.round((completedCount / totalCount) * 100)) 
    : 0;

  return (
    <div className="glass-panel p-6 md:p-8 text-center rounded-3xl border border-brand-500/40 bg-slate-900/90 backdrop-blur-xl shadow-glow space-y-6 max-w-2xl mx-auto my-6 animate-fadeIn">
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
              Nosso robô está minerando tarifas e combinações de voos em tempo real
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

      {/* Estimativa Amigável de Tempo de Espera */}
      <div className="flex items-center justify-center space-x-2 py-2 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
        <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
        <span>⏳ Nosso robô está minerando as melhores combinações na nuvem. A busca leva em média de 2 a 5 minutos e atualiza automaticamente!</span>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Progresso da Varredura</span>
          </span>
          <span className="text-brand-400 font-mono font-bold text-sm">
            {completedCount} de {totalCount} trechos ({percentage}%)
          </span>
        </div>

        {/* Outer Bar */}
        <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner relative">
          {/* Inner Bar */}
          <div
            className="h-full bg-gradient-to-r from-brand-600 via-purple-500 to-amber-400 rounded-full transition-all duration-500 ease-out relative overflow-hidden shadow-glow"
            style={{ width: `${percentage}%` }}
          >
            {/* Animated Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Dynamic Status Message & Live Offer Counter */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{totalOffersFound} voos catalogados até agora nesta busca</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Sincronizando em tempo real</span>
        </div>

        <div className="flex items-start space-x-2.5">
          <RefreshCw className="w-4 h-4 text-brand-400 animate-spin mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-200 leading-snug">
              {scrapingMessage || 'Buscando e comparando tarifas de voos em tempo real...'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Leg Feed (Cards/Badges por perna pesquisada) */}
      {legDetails && legDetails.length > 0 && (
        <div className="space-y-2 text-left">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Status Detalhado por Rota & Data</span>
            <span className="text-slate-500">{legDetails.length} trechos</span>
          </div>
          <div className="max-h-48 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 custom-scrollbar">
            {legDetails.map((leg, idx) => {
              const isDone = leg.status === 'completed';
              const dateStr = leg.departureDate ? formatToBrazillianDate(leg.departureDate) : '';
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    isDone
                      ? leg.flightsCount > 0
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-950/20 border-amber-500/20 text-amber-300'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 animate-pulse'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {isDone ? (
                      leg.flightsCount > 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      )
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-brand-400 animate-spin flex-shrink-0" />
                    )}
                    <span className="font-mono font-bold">
                      {leg.origin}➔{leg.destination} ({dateStr})
                    </span>
                  </div>

                  <span className="font-semibold text-[11px] ml-2 flex-shrink-0">
                    {isDone
                      ? leg.flightsCount > 0
                        ? `${leg.flightsCount} voos`
                        : '0 voos'
                      : 'Buscando...'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Indicators */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
        <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <span className="text-[10px] font-semibold text-slate-300 block">1. Mapeando Rotas</span>
        </div>
        <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/30 text-center">
          <Plane className="w-4 h-4 text-brand-400 mx-auto mb-1 animate-pulse" />
          <span className="text-[10px] font-bold text-brand-300 block">2. Coletando Ofertas</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-center">
          <Sparkles className="w-4 h-4 text-amber-400 mx-auto mb-1 opacity-60" />
          <span className="text-[10px] font-semibold text-slate-400 block">3. Sincronizando Casal</span>
        </div>
      </div>
    </div>
  );
}
