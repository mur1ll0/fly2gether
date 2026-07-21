import React, { useState } from 'react';
import { Bell, X, Check, Mail, DollarSign } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CreateAlertModal({ isOpen, onClose, alertTarget, onAlertCreated }) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user ? user.email : '');
  const [maxBudget, setMaxBudget] = useState(alertTarget ? (alertTarget.combinedPrice || alertTarget.totalPrice || 1500) : 1500);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen || !alertTarget) return null;

  const isFlyTogether = Boolean(alertTarget.person1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');

    try {
      const payload = {
        mode: isFlyTogether ? 'flytogether' : 'normal',
        origin1: isFlyTogether ? alertTarget.person1.origin : alertTarget.origin,
        origin2: isFlyTogether ? alertTarget.person2.origin : null,
        destination: alertTarget.destination,
        maxBudgetCombined: Number(maxBudget),
        onlyWeekends: alertTarget.isWeekendOrHoliday || false,
        notifyEmail: email
      };

      await API.post('/alerts', payload);
      setSuccessMessage('✅ Alerta ativado! Você receberá e-mails quando o valor baixar.');
      if (onAlertCreated) onAlertCreated();
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao criar alerta de preço.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-700 shadow-2xl relative bg-slate-900/95">
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
              Notificação automática quando o preço baixar ou houver mega promoção
            </p>
          </div>
        </div>

        {/* Resumo do Voo */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl mb-4 text-xs space-y-1">
          <p className="text-slate-300 font-bold">
            {isFlyTogether ? (
              <span>🤝 Voo Combinado: {alertTarget.person1.origin} + {alertTarget.person2.origin} ➔ {alertTarget.destination}</span>
            ) : (
              <span>✈️ Voo Normal: {alertTarget.origin} ➔ {alertTarget.destination}</span>
            )}
          </p>
          <p className="text-slate-400">
            Preço Encontrado Hoje: <strong className="text-emerald-400">R$ {isFlyTogether ? alertTarget.combinedPrice : alertTarget.totalPrice}</strong>
          </p>
        </div>

        {successMessage ? (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm font-semibold text-center animate-pulse">
            {successMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                E-mail para Notificações (Google)
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Avisar quando o preço for menor que (R$)
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
                  <span>Ativar Alerta de Promoções</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
