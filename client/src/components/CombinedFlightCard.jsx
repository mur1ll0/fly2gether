import React from 'react';
import { Users, Clock, Flame, Calendar, Bell, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function CombinedFlightCard({ combined, onCreateAlert }) {
  const { person1, person2, destination, departureDate, returnDate, combinedPrice, arrivalDeltaMinutes, isSynchronized, hasPromo, isWeekendOrHoliday, holidayDetails } = combined;

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-all duration-300 relative group overflow-hidden bg-slate-900/90 shadow-xl">
      {/* Header Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>ENCONTRO EM {destination}</span>
          </span>

          {isSynchronized && (
            <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sincronia Perfeita (Diferença de {arrivalDeltaMinutes} min no aeroporto)</span>
            </span>
          )}

          {isWeekendOrHoliday && (
            <span className="px-2.5 py-1 text-xs font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded-lg flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{holidayDetails ? holidayDetails.name : 'Viagem de Fim de Semana'}</span>
            </span>
          )}
        </div>

        {hasPromo && (
          <span className="px-3 py-1 text-xs font-extrabold bg-gradient-to-r from-rose-600 to-amber-500 text-white rounded-lg shadow-md flex items-center space-x-1">
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span>🔥 MEGA PROMOÇÃO DETECTADA</span>
          </span>
        )}
      </div>

      {/* Side-by-side Flight Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Pessoa 1 */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
              <span>Pessoa 1 ({person1.origin})</span>
            </span>
            <span className="text-sm font-bold text-slate-200">{person1.airline.logo} {person1.airline.name}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-mono text-slate-200 mt-2">
            <div>
              <p className="text-[10px] text-slate-400 font-sans">Saída</p>
              <p className="font-bold text-slate-100">{person1.departureTime}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600" />
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-sans">Chegada em {destination}</p>
              <p className="font-bold text-brand-400">{person1.arrivalTime}</p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex justify-between items-center text-xs">
            <span className="text-slate-400">Passagem Pessoa 1:</span>
            <span className="font-bold text-emerald-400 font-mono">R$ {person1.price}</span>
          </div>
        </div>

        {/* Pessoa 2 */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>Pessoa 2 ({person2.origin})</span>
            </span>
            <span className="text-sm font-bold text-slate-200">{person2.airline.logo} {person2.airline.name}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-mono text-slate-200 mt-2">
            <div>
              <p className="text-[10px] text-slate-400 font-sans">Saída</p>
              <p className="font-bold text-slate-100">{person2.departureTime}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600" />
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-sans">Chegada em {destination}</p>
              <p className="font-bold text-purple-400">{person2.arrivalTime}</p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex justify-between items-center text-xs">
            <span className="text-slate-400">Passagem Pessoa 2:</span>
            <span className="font-bold text-emerald-400 font-mono">R$ {person2.price}</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Dates, Combined Price & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
        <div className="text-xs text-slate-400 space-y-1 text-center sm:text-left">
          <p>📅 Período: <strong className="text-slate-200">{departureDate}</strong> {returnDate ? `até ${returnDate}` : ''}</p>
          <p className="text-[11px] text-slate-500">⏱️ Espera no aeroporto no desembarque: {arrivalDeltaMinutes} minutos</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Combinado (Ambos)</p>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
              R$ {combinedPrice.toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onCreateAlert(combined)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
              title="Monitorar este voo combinado por e-mail"
            >
              <Bell className="w-4 h-4 text-purple-400" />
              <span className="hidden xs:inline">Alertar</span>
            </button>

            <button
              onClick={() => alert(`Reservando voo combinado para ${person1.origin} e ${person2.origin} com destino a ${destination}...`)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-accent flex items-center space-x-1.5 transition-all"
            >
              <span>Ver Opção</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
