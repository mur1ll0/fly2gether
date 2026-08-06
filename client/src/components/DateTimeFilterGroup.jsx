import React, { useState } from 'react';
import { Clock, Sun, Sunset, Moon, Sunrise, RotateCcw, User, Heart } from 'lucide-react';

const PRESETS = [
  { id: 'all', label: 'Qualquer Horário', min: '', max: '', icon: Clock },
  { id: 'madrugada', label: 'Madrugada (00h-06h)', min: '00:00', max: '06:00', icon: Sunrise },
  { id: 'manha', label: 'Manhã (06h-12h)', min: '06:00', max: '12:00', icon: Sun },
  { id: 'tarde', label: 'Tarde (12h-18h)', min: '12:00', max: '18:00', icon: Sunset },
  { id: 'noite', label: 'Noite (18h-24h)', min: '18:00', max: '23:59', icon: Moon }
];

const HOUR_OPTIONS = [
  { value: '', label: 'Sem limite' },
  { value: '05:00', label: '05:00' },
  { value: '06:00', label: '06:00' },
  { value: '07:00', label: '07:00' },
  { value: '08:00', label: '08:00' },
  { value: '09:00', label: '09:00' },
  { value: '10:00', label: '10:00' },
  { value: '11:00', label: '11:00' },
  { value: '12:00', label: '12:00' },
  { value: '13:00', label: '13:00' },
  { value: '14:00', label: '14:00' },
  { value: '15:00', label: '15:00' },
  { value: '16:00', label: '16:00' },
  { value: '17:00', label: '17:00' },
  { value: '18:00', label: '18:00' },
  { value: '19:00', label: '19:00' },
  { value: '20:00', label: '20:00' },
  { value: '21:00', label: '21:00' },
  { value: '22:00', label: '22:00' },
  { value: '23:00', label: '23:00' }
];

export default function DateTimeFilterGroup({
  searchMode = 'normal',
  person1Name = 'Pessoa 1',
  person2Name = 'Pessoa 2',
  timeFilters = {},
  setTimeFilters = () => {}
}) {
  const [activeTab, setActiveTab] = useState('person1');

  const setPreset = (personPrefix, legPrefix, preset) => {
    setTimeFilters(prev => ({
      ...prev,
      [`${personPrefix}${legPrefix}TimeMin`]: preset.min,
      [`${personPrefix}${legPrefix}TimeMax`]: preset.max
    }));
  };

  const setCustomTime = (key, value) => {
    setTimeFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearPersonFilters = (personPrefix) => {
    setTimeFilters(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith(personPrefix)) {
          delete next[k];
        }
      });
      return next;
    });
  };

  const renderTimeSection = (personPrefix, legPrefix, label, isBrand) => {
    const minKey = `${personPrefix}${legPrefix}TimeMin`;
    const maxKey = `${personPrefix}${legPrefix}TimeMax`;
    const currentMin = timeFilters[minKey] || '';
    const currentMax = timeFilters[maxKey] || '';

    return (
      <div className="space-y-2 pt-2 first:pt-0 border-t first:border-t-0 border-slate-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide block">
            {label}
          </label>
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
            <span>A partir de:</span>
            <select
              value={currentMin}
              onChange={(e) => setCustomTime(minKey, e.target.value)}
              className="px-2 py-0.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:border-brand-500 font-semibold"
            >
              {HOUR_OPTIONS.map(h => (
                <option key={`min-${h.value}`} value={h.value}>{h.label}</option>
              ))}
            </select>

            <span>Até:</span>
            <select
              value={currentMax}
              onChange={(e) => setCustomTime(maxKey, e.target.value)}
              className="px-2 py-0.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:border-brand-500 font-semibold"
            >
              {HOUR_OPTIONS.map(h => (
                <option key={`max-${h.value}`} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => {
            const Icon = p.icon;
            const isActive = currentMin === p.min && currentMax === p.max;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(personPrefix, legPrefix, p)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border flex items-center space-x-1 transition-all ${
                  isActive
                    ? isBrand 
                      ? 'bg-brand-500/30 text-brand-300 border-brand-500/50 ring-1 ring-brand-400/40 shadow-sm'
                      : 'bg-purple-500/30 text-purple-300 border-purple-500/50 ring-1 ring-purple-400/40 shadow-sm'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSinglePersonFilters = (personPrefix = 'p1', title = 'Filtros de Horário', colorTheme = 'brand') => {
    const isBrand = colorTheme === 'brand';
    const borderColor = isBrand ? 'border-brand-500/30' : 'border-purple-500/30';
    const bgColor = isBrand ? 'bg-brand-500/5' : 'bg-purple-500/5';
    const textColor = isBrand ? 'text-brand-300' : 'text-purple-300';

    return (
      <div className={`p-4 rounded-2xl border ${borderColor} ${bgColor} space-y-4`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <Clock className={`w-4 h-4 ${textColor}`} />
            <h4 className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>{title}</h4>
          </div>
          <button
            type="button"
            onClick={() => clearPersonFilters(personPrefix)}
            className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-red-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar Horários</span>
          </button>
        </div>

        {renderTimeSection(personPrefix, 'Dep', '🛫 Horário de Saída da Origem (Decolagem)', isBrand)}
        {renderTimeSection(personPrefix, 'Arr', '🛬 Horário de Chegada no Destino (Pouso)', isBrand)}
        {renderTimeSection(personPrefix, 'RetDep', '🛫 Horário de Saída do Destino (Decolagem Volta)', isBrand)}
        {renderTimeSection(personPrefix, 'RetArr', '🛬 Horário de Chegada na Origem (Pouso Volta)', isBrand)}
      </div>
    );
  };

  if (searchMode !== 'flytogether') {
    return renderSinglePersonFilters('p1', 'Filtros de Horário de Ida e Volta', 'brand');
  }

  return (
    <div className="space-y-3">
      {/* Tab Switcher para Fly Together */}
      <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 max-w-xs">
        <button
          type="button"
          onClick={() => setActiveTab('person1')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'person1'
              ? 'bg-brand-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{person1Name || 'Pessoa 1'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('person2')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'person2'
              ? 'bg-purple-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>{person2Name || 'Pessoa 2'}</span>
        </button>
      </div>

      {/* Render Active Tab Content */}
      {activeTab === 'person1' ? (
        renderSinglePersonFilters('p1', `Horários da ${person1Name || 'Pessoa 1'}`, 'brand')
      ) : (
        renderSinglePersonFilters('p2', `Horários da ${person2Name || 'Pessoa 2'}`, 'purple')
      )}
    </div>
  );
}
