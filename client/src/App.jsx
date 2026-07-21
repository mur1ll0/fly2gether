import React, { useState, useEffect } from 'react';
import { Plane, Users, Calendar, Search, Flame, Sparkles, Filter, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import Navbar from './components/Navbar';
import AirportAutocomplete from './components/AirportAutocomplete';
import SmartExtensionsToggle from './components/SmartExtensionsToggle';
import FlightCard from './components/FlightCard';
import CombinedFlightCard from './components/CombinedFlightCard';
import CreateAlertModal from './components/CreateAlertModal';
import MyAlertsDrawer from './components/MyAlertsDrawer';
import API from './services/api';

export default function App() {
  // Search Mode: 'normal' vs 'flytogether'
  const [searchMode, setSearchMode] = useState('flytogether');

  // Airport Selections
  const [origin1, setOrigin1] = useState({ iata: 'GRU', city: 'São Paulo', name: 'Aeroporto Internacional de Guarulhos' });
  const [origin2, setOrigin2] = useState({ iata: 'SDU', city: 'Rio de Janeiro', name: 'Aeroporto Santos Dumont' });
  const [destination, setDestination] = useState({ iata: 'FLN', city: 'Florianópolis', name: 'Aeroporto Hercílio Luz' });

  // Optional Dates
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  // Smart Extension Toggles
  const [onlyWeekends, setOnlyWeekends] = useState(true);
  const [isVacation, setIsVacation] = useState(false);
  const [vacationStart, setVacationStart] = useState('2026-10-01');
  const [vacationEnd, setVacationEnd] = useState('2026-10-20');
  const [durationDays, setDurationDays] = useState(4);

  // Results & UI State
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [activeAlertTarget, setActiveAlertTarget] = useState(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);

  const fetchAlertsCount = () => {
    API.get('/alerts')
      .then(res => setAlertsCount(res.data?.length || 0))
      .catch(() => {});
  };

  useEffect(() => {
    fetchAlertsCount();
    // Auto trigger initial search demo
    handleSearch();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    if (!destination) {
      alert('Selecione o Aeroporto de Destino.');
      return;
    }

    if (searchMode === 'flytogether' && (!origin1 || !origin2)) {
      alert('Selecione a Origem da Pessoa 1 e a Origem da Pessoa 2.');
      return;
    }

    if (searchMode === 'normal' && !origin1) {
      alert('Selecione o Aeroporto de Origem.');
      return;
    }

    setLoading(true);
    try {
      const params = {
        mode: searchMode,
        origin: origin1?.iata,
        origin1: origin1?.iata,
        origin2: origin2?.iata,
        destination: destination?.iata,
        departureDate,
        returnDate,
        onlyWeekends,
        isVacation,
        vacationStart,
        vacationEnd,
        durationDays
      };

      const res = await API.get('/flights/search', { params });
      setResults(res.data.results || []);
    } catch (err) {
      console.error('Erro na busca:', err);
      alert('Erro ao buscar voos.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateAlert = (flightOrCombined) => {
    setActiveAlertTarget(flightOrCombined);
    setIsAlertModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        onOpenAlertsDrawer={() => setIsDrawerOpen(true)}
        alertsCount={alertsCount}
      />

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Inteligência de Viagens em Parceria</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Encontre a data perfeita para{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400">
              viajar junto
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Economize tempo e dinheiro combinando passagens de duas origens diferentes para o mesmo destino, sincronizando horários de chegada e folgas de final de semana ou férias.
          </p>
        </div>

        {/* Search Panel Container */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative mb-12 bg-slate-900/90 backdrop-blur-2xl">
          {/* Mode Selector Tabs */}
          <div className="flex p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setSearchMode('flytogether')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                searchMode === 'flytogether'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-accent'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Fly Together (Combinados)</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchMode('normal')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                searchMode === 'normal'
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>Voo Simples</span>
            </button>
          </div>

          <form onSubmit={handleSearch}>
            {/* Airports Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {searchMode === 'flytogether' ? (
                <>
                  <AirportAutocomplete
                    label="Origem Pessoa 1"
                    placeholder="Sua cidade (ex: São Paulo - GRU)"
                    value={origin1}
                    onChange={setOrigin1}
                  />
                  <AirportAutocomplete
                    label="Origem Pessoa 2"
                    placeholder="Cidade do seu acompanhante (ex: Rio - SDU)"
                    value={origin2}
                    onChange={setOrigin2}
                  />
                  <AirportAutocomplete
                    label="Destino Comum do Encontro"
                    placeholder="Onde querem se encontrar? (ex: FLN)"
                    value={destination}
                    onChange={setDestination}
                  />
                </>
              ) : (
                <>
                  <div className="md:col-span-1">
                    <AirportAutocomplete
                      label="Aeroporto de Origem"
                      placeholder="De onde você vai partir?"
                      value={origin1}
                      onChange={setOrigin1}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <AirportAutocomplete
                      label="Aeroporto de Destino"
                      placeholder="Para onde quer viajar?"
                      value={destination}
                      onChange={setDestination}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Optional Specific Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-slate-950/40 rounded-2xl border border-slate-800/60">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Data de Ida (Opcional - Deixe em branco para busca flexível)
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Data de Volta (Opcional)
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Global Smart Extensions Component */}
            <SmartExtensionsToggle
              onlyWeekends={onlyWeekends}
              setOnlyWeekends={setOnlyWeekends}
              isVacation={isVacation}
              setIsVacation={setIsVacation}
              vacationStart={vacationStart}
              setVacationStart={setVacationStart}
              vacationEnd={vacationEnd}
              setVacationEnd={setVacationEnd}
              durationDays={durationDays}
              setDurationDays={setDurationDays}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-purple-600 to-brand-500 hover:from-brand-500 hover:to-purple-500 text-white font-extrabold text-base shadow-glow transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Pesquisando Melhores Datas & Preços...</span>
                </span>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>
                    {searchMode === 'flytogether'
                      ? 'Buscar Voos Combinados & Sincronizados'
                      : 'Buscar Melhores Voos & Promocoes'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
                <span>Resultados da Busca</span>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                  {results.length} opções encontradas
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {searchMode === 'flytogether'
                  ? 'Ordenado por sincronia de horário no destino, menor preço acumulado e mega promoções relâmpago.'
                  : 'Ordenado por preço e promoções das companhias aéreas.'}
              </p>
            </div>
          </div>

          {/* Render Results List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse"></div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((item) => (
                searchMode === 'flytogether' ? (
                  <CombinedFlightCard
                    key={item.id}
                    combined={item}
                    onCreateAlert={handleOpenCreateAlert}
                  />
                ) : (
                  <FlightCard
                    key={item.id}
                    flight={item}
                    onCreateAlert={handleOpenCreateAlert}
                  />
                )
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 space-y-3">
              <Plane className="w-12 h-12 mx-auto text-slate-600 stroke-1" />
              <h3 className="text-lg font-bold text-slate-300">Nenhum voo encontrado para estes critérios.</h3>
              <p className="text-xs text-slate-500">
                Tente desativar a restrição de finais de semana ou expandir as datas no filtro de férias.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modals & Drawers */}
      <CreateAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        alertTarget={activeAlertTarget}
        onAlertCreated={fetchAlertsCount}
      />

      <MyAlertsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        alertsCount={alertsCount}
        onRefresh={fetchAlertsCount}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 text-center text-xs text-slate-500 mt-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="flex items-center space-x-1">
            <span>Fly2Gether ✈️ Plataforma Inteligente de Viagens de Casais e Amigos</span>
          </p>
          <p className="text-slate-600">Desenvolvido com React + Vite + Tailwind + Express & Google Auth</p>
        </div>
      </footer>
    </div>
  );
}
