import React from 'react';
import { Plane, Calendar, Flame, ArrowRight, Bell } from 'lucide-react';

export default function FlightCard({ flight, onCreateAlert }) {
  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-brand-500/50 transition-all duration-300 relative group overflow-hidden bg-slate-900/80">
      {/* Promo Badge */}
      {flight.isMegaPromo && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-600 to-amber-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-bl-xl shadow-md flex items-center space-x-1">
          <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
          <span>🔥 MEGA PROMOÇÃO DA COMPANHIA AÉREA</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Airline & Route Info */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center space-x-3">
            <span className="text-xl">{flight.airline.logo}</span>
            <div>
              <h4 className="text-sm font-bold text-slate-100">{flight.airline.name}</h4>
              <p className="text-xs text-slate-400 font-mono">Voo {flight.airline.code}-2026</p>
            </div>
            {flight.isWeekendOrHoliday && (
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded-full flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{flight.holidayDetails ? flight.holidayDetails.name : 'Fim de Semana'}</span>
              </span>
            )}
          </div>

          {/* Times & Route Visualizer */}
          <div className="flex items-center space-x-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="text-center">
              <p className="text-base font-extrabold text-slate-100">{flight.departureTime}</p>
              <p className="text-xs font-bold text-brand-400 font-mono">{flight.origin}</p>
            </div>

            <div className="flex-1 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-medium">{flight.duration}</span>
              <div className="w-full flex items-center my-1">
                <div className="h-[2px] flex-1 bg-slate-700"></div>
                <Plane className="w-4 h-4 text-brand-400 mx-1 transform rotate-90" />
                <div className="h-[2px] flex-1 bg-slate-700"></div>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Direto</span>
            </div>

            <div className="text-center">
              <p className="text-base font-extrabold text-slate-100">{flight.arrivalTime}</p>
              <p className="text-xs font-bold text-brand-400 font-mono">{flight.destination}</p>
            </div>
          </div>

          {/* Dates Subtitle */}
          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <p>Ida: <strong className="text-slate-200">{flight.departureDate}</strong></p>
            {flight.returnDate && (
              <p>Volta: <strong className="text-slate-200">{flight.returnDate} ({flight.returnDepartureTime})</strong></p>
            )}
          </div>
        </div>

        {/* Right: Price & CTA */}
        <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
          <div className="text-left md:text-right">
            <p className="text-xs text-slate-400 uppercase font-medium">Preço Total por Pessoa</p>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              R$ {flight.totalPrice.toLocaleString('pt-BR')}
            </p>
            {flight.inboundPrice > 0 && (
              <p className="text-[11px] text-slate-500 font-mono">
                Ida: R$ {flight.outboundPrice} | Volta: R$ {flight.inboundPrice}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <button
              onClick={() => onCreateAlert(flight)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
              title="Criar alerta por e-mail para esta rota"
            >
              <Bell className="w-3.5 h-3.5 text-brand-400" />
              <span>Criar Alerta</span>
            </button>
            <button
              onClick={() => alert(`Redirecionando para reserva na ${flight.airline.name}...`)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow flex items-center space-x-1 transition-all"
            >
              <span>Ver Voo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
