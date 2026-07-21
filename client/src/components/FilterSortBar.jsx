import React from 'react';
import { ArrowUpDown, Filter, Plane, ShieldCheck, Clock } from 'lucide-react';

export default function FilterSortBar({
  sortBy,
  setSortBy,
  selectedAirlines,
  setSelectedAirlines,
  stopsFilter,
  setStopsFilter,
  hideTransfers,
  setHideTransfers,
  searchMode
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
    <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/90 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
              <option value="tempo_juntos">Tempo Juntos no Destino (Recomendado)</option>
              <option value="price">Menor Preço Combinado</option>
              <option value="sincronia">Sincronia de Chegada</option>
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
  );
}
