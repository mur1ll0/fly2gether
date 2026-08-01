import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, X } from 'lucide-react';
import { formatToBrazillianDate } from '../utils/dateFormatter';

export default function DateMultiSelectDropdown({
  availableDates = [],
  selectedDates = [],
  setSelectedDates = () => {},
  label = 'Data de Ida:',
  iconColor = 'text-brand-400'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha o dropdown ao clicar fora do componente
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!availableDates || availableDates.length === 0) return null;

  const toggleDate = (dateStr) => {
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const handleSelectAll = () => {
    setSelectedDates([...availableDates]);
  };

  const handleClearAll = () => {
    setSelectedDates([]);
  };

  const getDayOfWeekName = (dateStr) => {
    if (!dateStr) return '';
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const d = new Date(dateStr + 'T00:00:00');
    return days[d.getUTCDay()];
  };

  const selectedCount = selectedDates.length;
  const isAllSelected = selectedCount === availableDates.length;
  const isNoneSelected = selectedCount === 0;

  return (
    <div className="relative z-50 inline-block text-left" ref={dropdownRef}>
      <div className="flex items-center space-x-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 shrink-0">
          <Calendar className={`w-4 h-4 ${iconColor}`} />
          <span>{label}</span>
        </span>

        {/* Botão Principal do Dropdown */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-2 select-none shadow-sm ${
            selectedCount > 0
              ? 'bg-brand-500/20 text-brand-300 border-brand-500/50 hover:bg-brand-500/30 ring-1 ring-brand-500/30'
              : 'bg-slate-950 text-slate-200 border-slate-700/80 hover:border-slate-600 hover:bg-slate-900'
          }`}
        >
          <span>
            {isNoneSelected
              ? `Todas as Datas (${availableDates.length})`
              : isAllSelected
              ? `Todas Selecionadas (${availableDates.length})`
              : `${selectedCount} de ${availableDates.length} Datas`}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Botão de Limpeza rápida caso haja datas selecionadas */}
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            title="Limpar seleção de datas (mostrar todas)"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Menu do Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl z-[9999] p-3 backdrop-blur-xl animate-fadeIn">
          {/* Cabeçalho de Ações Rápidas */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {availableDates.length} datas disponíveis
            </span>
            <div className="flex items-center space-x-2 text-xs font-semibold">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-brand-400 hover:underline text-[11px]"
              >
                Marcar Todas
              </button>
              <span className="text-slate-700">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-rose-400 hover:underline text-[11px]"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Lista de Opções de Data */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {availableDates.map((dateStr) => {
              const isChecked = selectedDates.includes(dateStr);
              const dayName = getDayOfWeekName(dateStr);

              return (
                <label
                  key={dateStr}
                  onClick={() => toggleDate(dateStr)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-brand-500/20 text-slate-100 font-bold border border-brand-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // tratado no click do container
                      className="rounded bg-slate-950 border-slate-700 text-brand-500 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold">{formatToBrazillianDate(dateStr)}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    dayName === 'Sex' || dayName === 'Sáb' || dayName === 'Dom'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {dayName}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Rodapé informativo */}
          <div className="pt-2 mt-2 border-t border-slate-800 text-[11px] text-slate-400 text-center italic">
            {isNoneSelected
              ? 'Nenhuma selecionada = Exibindo todas as datas'
              : `${selectedCount} data(s) filtrada(s)`}
          </div>
        </div>
      )}
    </div>
  );
}
