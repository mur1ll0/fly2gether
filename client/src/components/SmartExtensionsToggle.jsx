import React from 'react';
import { Calendar, Sun, Palmtree, Clock, Sparkles } from 'lucide-react';

export default function SmartExtensionsToggle({
  onlyWeekends,
  setOnlyWeekends,
  isVacation,
  setIsVacation,
  vacationStart,
  setVacationStart,
  vacationEnd,
  setVacationEnd,
  durationDays,
  setDurationDays
}) {
  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-700/60 mb-6 bg-slate-900/60 backdrop-blur-xl">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Filtros & Extensões Inteligentes de Agenda
        </h3>
        <span className="px-2 py-0.5 text-xs font-extrabold uppercase bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-full">
          Diferencial Fly2Gether
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Toggle 1: Finais de Semana & Feriados */}
        <div
          onClick={() => setOnlyWeekends(!onlyWeekends)}
          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3.5 ${
            onlyWeekends
              ? 'bg-brand-600/20 border-brand-500/80 shadow-glow'
              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2.5 rounded-lg flex-shrink-0 ${onlyWeekends ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-100">Finais de Semana & Feriados</span>
              <input
                type="checkbox"
                checked={onlyWeekends}
                onChange={() => {}} // handled by parent div onClick
                className="w-4 h-4 text-brand-500 rounded focus:ring-brand-500 bg-slate-900 border-slate-700"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Foca apenas em viagens de Sexta à noite ➔ Domingo à noite ou emenda feriados nacionais.
            </p>
          </div>
        </div>

        {/* Toggle 2: Férias Conjuntas */}
        <div
          onClick={() => setIsVacation(!isVacation)}
          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3.5 ${
            isVacation
              ? 'bg-purple-600/20 border-purple-500/80 shadow-glow-accent'
              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2.5 rounded-lg flex-shrink-0 ${isVacation ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
            <Palmtree className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-100">Férias Conjuntas / Janela Flexível</span>
              <input
                type="checkbox"
                checked={isVacation}
                onChange={() => {}}
                className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500 bg-slate-900 border-slate-700"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Encontra a melhor janela de dias com o menor custo dentro do período de férias.
            </p>
          </div>
        </div>
      </div>

      {/* Painel Expansível de Férias Conjuntas */}
      {isVacation && (
        <div className="mt-4 p-4 bg-slate-950/70 border border-purple-500/30 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
          <div>
            <label className="block text-xs font-medium text-purple-300 mb-1">Início das Férias</label>
            <input
              type="date"
              value={vacationStart}
              onChange={(e) => setVacationStart(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-purple-300 mb-1">Fim das Férias</label>
            <input
              type="date"
              value={vacationEnd}
              onChange={(e) => setVacationEnd(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-purple-300 mb-1">Duração da Viagem (Dias)</label>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-purple-500"
            >
              <option value={3}>3 dias (Fim de semana curto)</option>
              <option value={4}>4 dias (Fim de semana + 1 dia)</option>
              <option value={7}>7 dias (1 semana inteira)</option>
              <option value={10}>10 dias</option>
              <option value={14}>14 dias (2 semanas)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
