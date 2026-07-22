import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Mail, DollarSign, Filter, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TOLERANCE_STEPS } from './FilterSortBar';

export default function CreateAlertModal({ isOpen, onClose, alertTarget, onAlertCreated }) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user ? user.email : '');
  const [maxBudget, setMaxBudget] = useState(1500);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const flightCard = alertTarget?.flightOrCombined || alertTarget;
  const searchState = alertTarget?.searchState || {};

  useEffect(() => {
    if (user && user.email) {
      setEmail(user.email);
    }
    if (flightCard) {
      const price = flightCard.combinedPrice || flightCard.totalPrice || 1500;
      setMaxBudget(price);
    }
  }, [user, alertTarget]);

  if (!isOpen || !alertTarget) return null;

  const isFlyTogether = Boolean(flightCard?.person1) || searchState.searchMode === 'flytogether';

  const getSortLabel = (key) => {
    switch (key) {
      case 'sincronia_total': return 'Sincronia Total (Ida + Volta)';
      case 'tempo_juntos': return 'Maior Tempo Juntos';
      case 'price': return 'Menor Preço';
      case 'sincronia': return 'Sincronia na Chegada';
      case 'departureTime': return 'Horário de Partida';
      case 'duration': return 'Duração da Viagem';
      default: return key;
    }
  };

  const getStopsLabel = (key) => {
    if (key === 'direct') return 'Apenas voos diretos';
    if (key === 'stops') return 'Com conexões';
    return 'Qualquer quantidade de escalas';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');

    try {
      const payload = {
        mode: isFlyTogether ? 'flytogether' : 'normal',
        origin1: isFlyTogether ? (flightCard?.person1?.origin || searchState.origin1?.iata) : (flightCard?.origin || searchState.origin1?.iata),
        origin1Name: searchState.origin1?.name || searchState.origin1?.city || null,
        origin2: isFlyTogether ? (flightCard?.person2?.origin || searchState.origin2?.iata) : null,
        origin2Name: isFlyTogether ? (searchState.origin2?.name || searchState.origin2?.city) : null,
        destination: flightCard?.destination || searchState.destination?.iata,
        destinationName: searchState.destination?.name || searchState.destination?.city || null,
        departureDate: flightCard?.departureDate || searchState.departureDate || null,
        returnDate: flightCard?.returnDate || searchState.returnDate || null,
        maxBudgetCombined: Number(maxBudget),
        onlyWeekends: searchState.onlyWeekends || flightCard?.isWeekendOrHoliday || false,
        isVacation: searchState.isVacation || false,
        vacationStart: searchState.vacationStart || null,
        vacationEnd: searchState.vacationEnd || null,
        durationDays: searchState.durationDays || 4,
        sortBy: searchState.sortBy || (isFlyTogether ? 'sincronia_total' : 'price'),
        selectedAirlines: searchState.selectedAirlines || ['LA', 'G3', 'AD', 'TP', 'CM'],
        stopsFilter: searchState.stopsFilter || 'all',
        hideTransfers: Boolean(searchState.hideTransfers),
        toleranceIndex: searchState.toleranceIndex !== undefined ? searchState.toleranceIndex : 3,
        notifyEmail: user ? user.email : email
      };

      await API.post('/alerts', payload);
      
      Swal.fire({
        title: 'Alerta Vinculado à sua Conta!',
        text: 'O monitoramento levará em conta todos os seus filtros e ordenação configurados.',
        icon: 'success',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#22c55e',
        timer: 3000
      });

      setSuccessMessage('✅ Alerta ativado e vinculado à sua conta Google!');
      if (onAlertCreated) onAlertCreated();
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch (err) {
      Swal.fire({
        title: 'Erro',
        text: err.response?.data?.error || 'Não foi possível criar o alerta.',
        icon: 'error',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-700 shadow-2xl relative bg-slate-900/95 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-brand-500/20 border border-brand-500/40 rounded-xl text-brand-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Criar Alerta por E-mail</h3>
            <p className="text-xs text-slate-400">
              Notificação automática vinculada à sua conta do Google
            </p>
          </div>
        </div>

        {/* Resumo do Voo */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl mb-4 text-xs space-y-2">
          <p className="text-slate-200 font-bold">
            {isFlyTogether ? (
              <span>🤝 Voo Combinado: {flightCard?.person1?.origin || searchState.origin1?.iata} + {flightCard?.person2?.origin || searchState.origin2?.iata} ➔ {flightCard?.destination || searchState.destination?.iata}</span>
            ) : (
              <span>✈️ Voo Simples: {flightCard?.origin || searchState.origin1?.iata} ➔ {flightCard?.destination || searchState.destination?.iata}</span>
            )}
          </p>
          <p className="text-slate-400">
            Preço Atual Encontrado: <strong className="text-emerald-400">R$ {isFlyTogether ? flightCard?.combinedPrice : flightCard?.totalPrice}</strong>
          </p>

          {/* Configurações do Alerta */}
          <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px] text-slate-400">
            <p className="font-semibold text-brand-300 flex items-center gap-1">
              <Filter className="w-3 h-3 text-brand-400" /> Configuração salva no alerta:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
              <li>Ordenação: <strong>{getSortLabel(searchState.sortBy)}</strong></li>
              <li>Escalas: <strong>{getStopsLabel(searchState.stopsFilter)}</strong></li>
              {searchState.hideTransfers && <li>Sem trocas de aeroporto</li>}
              {isFlyTogether && (
                <li>Tolerância de horários: <strong>{TOLERANCE_STEPS[searchState.toleranceIndex]?.label || 'Ideal (1h)'}</strong></li>
              )}
              {searchState.selectedAirlines && (
                <li>Companhias: <strong>{searchState.selectedAirlines.join(', ')}</strong></li>
              )}
            </ul>
          </div>
        </div>

        {successMessage ? (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm font-semibold text-center animate-pulse">
            {successMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Conta Vinculada (Google)</span>
                <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Autenticado
                </span>
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3 text-slate-500" />
                <input
                  type="email"
                  disabled
                  readOnly
                  value={user ? user.email : email}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-300 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Avisar quando o preço for menor ou igual a (R$)
              </label>
              <div className="relative flex items-center">
                <DollarSign className="w-4 h-4 absolute left-3 text-slate-500" />
                <input
                  type="number"
                  required
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500 font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-xl text-sm shadow-glow transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Salvando Alerta...</span>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Salvar Alerta na Minha Conta</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
