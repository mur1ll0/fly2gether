import React, { useState, useEffect } from 'react';
import { X, Trash2, Bell, RefreshCw, Mail, CheckCircle, ExternalLink } from 'lucide-react';
import API from '../services/api';

export default function MyAlertsDrawer({ isOpen, onClose, alertsCount, onRefresh }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await API.get('/alerts');
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Erro ao buscar alertas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen]);

  const handleDelete = async (id) => {
    try {
      await API.delete(`/alerts/${id}`);
      fetchAlerts();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Erro ao excluir alerta.');
    }
  };

  const handleManualScan = async () => {
    setScanning(true);
    try {
      await API.post('/alerts/check-now');
      alert('⚡ Varredura manual executada com sucesso! Verifique sua caixa de e-mail.');
      fetchAlerts();
    } catch (err) {
      alert('Erro ao disparar varredura.');
    } finally {
      setScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl relative">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <Bell className="w-5 h-5 text-brand-400" />
              <h3 className="text-lg font-bold text-slate-100">Meus Alertas de Preço</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-400">Total de {alerts.length} alerta(s) configurado(s)</p>
            <button
              onClick={handleManualScan}
              disabled={scanning}
              className="px-3 py-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 text-xs font-semibold rounded-lg border border-brand-500/30 flex items-center space-x-1 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Varrendo...' : 'Testar Varredura'}</span>
            </button>
          </div>

          <div className="mt-4 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-xs text-slate-400 text-center py-8">Carregando alertas...</p>
            ) : alerts.length > 0 ? (
              alerts.map((item) => (
                <div
                  key={item._id || item.id}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex justify-between items-start"
                >
                  <div className="space-y-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                      item.mode === 'flytogether' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    }`}>
                      {item.mode === 'flytogether' ? 'Fly Together' : 'Voo Simples'}
                    </span>

                    <p className="text-sm font-bold text-slate-100 mt-1">
                      {item.mode === 'flytogether' ? (
                        <span>{item.origin1} + {item.origin2} ➔ {item.destination}</span>
                      ) : (
                        <span>{item.origin1} ➔ {item.destination}</span>
                      )}
                    </p>

                    <p className="text-xs text-slate-400">
                      Teto máximo: <strong className="text-emerald-400">R$ {item.maxBudgetCombined}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{item.notifyEmail}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(item._id || item.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Excluir alerta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Bell className="w-10 h-10 mx-auto text-slate-700 stroke-1" />
                <p className="text-sm font-medium">Nenhum alerta cadastrado ainda.</p>
                <p className="text-xs text-slate-600">
                  Ao pesquisar voos, clique no botão "Criar Alerta" para receber e-mails automáticos!
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
