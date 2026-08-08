import React, { useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { formatToBrazillianDate } from '../utils/dateFormatter';

export default function CustomDateInput({
  label,
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  iconColor = 'text-brand-400'
}) {
  const nativeInputRef = useRef(null);

  const displayValue = value ? formatToBrazillianDate(value) : '';

  const handleContainerClick = () => {
    if (nativeInputRef.current) {
      try {
        if (typeof nativeInputRef.current.showPicker === 'function') {
          nativeInputRef.current.showPicker();
        } else {
          nativeInputRef.current.focus();
        }
      } catch (e) {
        nativeInputRef.current.focus();
      }
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="text-[11px] font-bold text-slate-400 hover:text-rose-400 transition-colors flex items-center space-x-1"
          >
            <X className="w-3 h-3" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      <div
        onClick={handleContainerClick}
        className="relative flex items-center cursor-pointer group"
      >
        <input
          type="text"
          readOnly
          value={displayValue}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none group-hover:border-brand-500/60 transition-all font-mono select-none"
        />

        <Calendar className={`w-4 h-4 absolute right-3.5 ${iconColor} pointer-events-none`} />

        <input
          ref={nativeInputRef}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
      </div>
    </div>
  );
}
