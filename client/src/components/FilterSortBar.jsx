import React from 'react';
import { ArrowUpDown, Filter, Clock } from 'lucide-react';

export const TOLERANCE_STEPS = [
  { value: 0, label: '0m (Exato)' },
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
  { value: 180, label: '3h' },
  { value: 240, label: '4h' },
  { value: 300, label: '5h' },
  { value: 360, label: '6h' },
  { value: 420, label: '7h' },
  { value: 480, label: '8h' },
  { value: 540, label: '9h' },
  { value: 600, label: '10h' },
  { value: 660, label: '11h' },
  { value: 720, label: '12h' },
  { value: Infinity, label: 'Qualquer' }
];

export default function FilterSortBar({
  sortBy,
  setSortBy,
  selectedAirlines,
  setSelectedAirlines,
  stopsFilter,
  setStopsFilter,
  hideTransfers,
  setHideTransfers,
  searchMode,
  toleranceIndex,
  setToleranceIndex
}) {
  const toggleAirline = (code) => {
    if (selectedAirlines.includes(code)) {
      if (selectedAirlines.length === 1) return; // manter ao menos uma selecionada
      setSelectedAirlines(selectedAirlines.filter(c => c !== code));
    } else {
      setSelectedAirlines([...selectedAirlines, code]);
    }
  };

  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/90 mb-6 flex flex-col gap-4">
      {/* Primeira linha: Filtros de Ordenação, Companhias e Escalas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Esquerda: Ordenação */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <ArrowUpDown className="w-4 h-4 text-brand-400" />
            <span>Ordenar por:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-100 focus:outline-none focus:border-brand-500"
          >
            {searchMode === 'flytogether' ? (
              <>
                <option value="sincronia_total">Sincronia de Chegada e Saída (Padrão)</option>
                <option value="tempo_juntos">Tempo Juntos no Destino</option>
                <option value="price">Menor Preço Combinado</option>
                <option value="sincronia">Sincronia de Chegada Apenas</option>
              </>
            ) : (
              <>
                <option value="price">Menor Preço (Padrão)</option>
                <option value="duration">Tempo Total / Duração</option>
                <option value="departureTime">Horário de Saída</option>
              </>
            )}
          </select>
        </div>

        {/* Meio: Filtro por Companhias */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Companhias:</span>
          <div className="flex items-center space-x-2">
            {[
              { code: 'LA', name: 'LATAM', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
              { code: 'G3', name: 'GOL', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
              { code: 'AD', name: 'Azul', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' }
            ].map((item) => {
              const isSelected = selectedAirlines.includes(item.code);
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => toggleAirline(item.code)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                    isSelected
                      ? `${item.color} shadow-sm ring-1 ring-white/20`
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direita: Escalas & Conexões */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-purple-400" />
              <span>Escalas:</span>
            </span>
            <select
              value={stopsFilter}
              onChange={(e) => setStopsFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-100 focus:outline-none focus:border-purple-500"
            >
              <option value="all">Todas as opções</option>
              <option value="direct">Apenas Direto</option>
              <option value="stops">Com Escalas / Conexão</option>
            </select>
          </div>

          {/* Checkbox para ocultar troca de aeroporto */}
          <div className="flex items-center">
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-300 uppercase tracking-wider bg-slate-950/45 px-3 py-1.5 border border-slate-800 rounded-xl hover:border-slate-700 transition-all select-none">
              <input 
                type="checkbox" 
                checked={hideTransfers}
                onChange={(e) => setHideTransfers(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-purple-500 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <span>Ocultar Troca de Aeroporto</span>
            </label>
          </div>
        </div>
      </div>

      {/* Segunda linha: Tolerância de Sincronia no modo Fly Together */}
      {searchMode === 'flytogether' && (
        <div className="border-t border-slate-800/80 pt-4 mt-1 flex flex-col md:flex-row md:items-center gap-4 pb-2">
          <div className="flex items-center space-x-2 shrink-0">
            <Clock className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Tolerância de Pouso/Decolagem:
            </span>
            <span className="px-2.5 py-0.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold rounded-lg min-w-[80px] text-center">
              {TOLERANCE_STEPS[toleranceIndex]?.label}
            </span>
          </div>
          
          <div className="flex-1 flex items-center space-x-4">
            <span className="text-xs text-slate-500 font-semibold select-none">0m (Exato)</span>
            <div className="flex-1 relative pb-4">
              <input
                type="range"
                min="0"
                max="15"
                value={toleranceIndex}
                onChange={(e) => setToleranceIndex(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-500 border border-slate-800"
              />
              <div className="absolute left-0 right-0 bottom-0 h-5 pointer-events-none select-none font-bold">
                {[
                  { index: 0, label: '0m' },
                  { index: 2, label: '30m' },
                  { index: 3, label: '1h' },
                  { index: 4, label: '2h' },
                  { index: 6, label: '4h' },
                  { index: 8, label: '6h' },
                  { index: 10, label: '8h' },
                  { index: 12, label: '10h' },
                  { index: 14, label: '12h' },
                  { index: 15, label: 'Qualquer' }
                ].map((tick) => {
                  const percentage = (tick.index / 15) * 100;
                  let style = {};
                  if (tick.index === 0) {
                    style = { left: '0%' };
                  } else if (tick.index === 15) {
                    style = { right: '0%', transform: 'translateX(25%)' };
                  } else {
                    style = { left: `${percentage}%`, transform: 'translateX(-50%)' };
                  }
                  return (
                    <span
                      key={tick.index}
                      className="absolute text-[10px] sm:text-[11px] text-slate-400 font-bold select-none pointer-events-none"
                      style={style}
                    >
                      {tick.label}
                    </span>
                  );
                })}
              </div>
            </div>
            <span className="text-xs text-slate-500 font-semibold select-none">Sem Limite</span>
          </div>
        </div>
      )}
    </div>
  );
}
