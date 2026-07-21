import React, { useState, useEffect, useRef } from 'react';
import { Plane, MapPin, X, Check } from 'lucide-react';
import API from '../services/api';

export default function AirportAutocomplete({ label, placeholder, value, onChange, icon: Icon = MapPin }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value && typeof value === 'object') {
      setQuery(`${value.city} (${value.iata}) - ${value.name}`);
    } else if (typeof value === 'string' && value) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    setIsOpen(true);

    if (text.trim().length === 0) {
      setSuggestions([]);
      onChange(null);
      return;
    }

    setLoading(true);
    API.get(`/airports?q=${encodeURIComponent(text)}`)
      .then(res => {
        setSuggestions(res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleSelect = (airport) => {
    setQuery(`${airport.city} (${airport.iata})`);
    onChange(airport);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onChange(null);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
          <Icon className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            if (!suggestions.length) handleInputChange({ target: { value: query } });
          }}
          placeholder={placeholder || 'Digite a cidade ou código IATA (ex: GRU, Rio, Salvador)...'}
          className="w-full pl-11 pr-10 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-inner text-sm font-medium"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900/95 border border-slate-700/90 rounded-xl shadow-2xl max-h-64 overflow-y-auto backdrop-blur-md divide-y divide-slate-800">
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400 animate-pulse">Buscando aeroportos...</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((item) => (
              <button
                key={item.iata}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-3 text-left hover:bg-slate-800/90 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="px-2.5 py-1 text-xs font-bold font-mono bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-md group-hover:bg-brand-500 group-hover:text-white transition-colors">
                    {item.iata}
                  </span>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                      {item.city}, {item.state ? `${item.state} - ` : ''}{item.country}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{item.name}</p>
                  </div>
                </div>
                {value && value.iata === item.iata && (
                  <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />
                )}
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              {query ? 'Nenhum aeroporto encontrado' : 'Digite para buscar por cidade ou código IATA'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
