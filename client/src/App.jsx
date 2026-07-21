import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plane, Users, Calendar, Search, Flame, Sparkles, Filter, ArrowRight, ShieldCheck, Heart, XCircle, BarChart3, ChevronRight, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import Navbar from './components/Navbar';
import AirportAutocomplete from './components/AirportAutocomplete';
import SmartExtensionsToggle from './components/SmartExtensionsToggle';
import FilterSortBar from './components/FilterSortBar';
import FlightCard from './components/FlightCard';
import CombinedFlightCard from './components/CombinedFlightCard';
import CreateAlertModal from './components/CreateAlertModal';
import MyAlertsDrawer from './components/MyAlertsDrawer';
import API from './services/api';

export default function App() {
  // Search Mode: 'normal' vs 'flytogether'
  const [searchMode, setSearchMode] = useState('flytogether');

  // Airport Selections
  const [origin1, setOrigin1] = useState(null);
  const [origin2, setOrigin2] = useState(null);
  const [destination, setDestination] = useState(null);

  // Optional Dates
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  // Smart Extension Toggles
  const [onlyWeekends, setOnlyWeekends] = useState(true);
  const [isVacation, setIsVacation] = useState(false);
  const [vacationStart, setVacationStart] = useState('2026-10-01');
  const [vacationEnd, setVacationEnd] = useState('2026-10-20');
  const [durationDays, setDurationDays] = useState(4);

  // Sorting & Filtering Controls
  const [sortBy, setSortBy] = useState('tempo_juntos'); // 'tempo_juntos', 'price', 'duration', 'departureTime', 'sincronia'
  const [selectedAirlines, setSelectedAirlines] = useState(['LA', 'G3', 'AD', 'TP', 'CM']);
  const [stopsFilter, setStopsFilter] = useState('all'); // 'all', 'direct', 'stops'
  const [hideTransfers, setHideTransfers] = useState(false);

  // Results, Loading, SerpAPI Quota & Cancel Trigger
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [activeAlertTarget, setActiveAlertTarget] = useState(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSearchModeChange = (mode) => {
    setSearchMode(mode);
    setSortBy(mode === 'flytogether' ? 'tempo_juntos' : 'price');
  };
  const [alertsCount, setAlertsCount] = useState(0);
  const [serpApiUsage, setSerpApiUsage] = useState(null);

  const abortControllerRef = useRef(null);

  // Restaurar dados da última pesquisa do usuário
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fly2gether_last_search');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.searchMode) handleSearchModeChange(parsed.searchMode);
        if (parsed.origin1) setOrigin1(parsed.origin1);
        if (parsed.origin2) setOrigin2(parsed.origin2);
        if (parsed.destination) setDestination(parsed.destination);
        if (parsed.departureDate) setDepartureDate(parsed.departureDate);
        if (parsed.returnDate) setReturnDate(parsed.returnDate);
        if (parsed.onlyWeekends !== undefined) setOnlyWeekends(parsed.onlyWeekends);
        if (parsed.isVacation !== undefined) setIsVacation(parsed.isVacation);
        if (parsed.vacationStart) setVacationStart(parsed.vacationStart);
        if (parsed.vacationEnd) setVacationEnd(parsed.vacationEnd);
        if (parsed.durationDays) setDurationDays(Number(parsed.durationDays));
      } else {
        // Fallback default
        setOrigin1({ iata: 'GRU', city: 'São Paulo', name: 'Aeroporto Internacional de Guarulhos' });
        setOrigin2({ iata: 'SDU', city: 'Rio de Janeiro', name: 'Aeroporto Santos Dumont' });
        setDestination({ iata: 'FLN', city: 'Florianópolis', name: 'Aeroporto Hercílio Luz' });
      }
    } catch (e) {
      console.error('Erro ao restaurar última pesquisa:', e);
    }
    fetchAlertsCount();
    fetchSerpApiUsage();
  }, []);

  const fetchAlertsCount = () => {
    API.get('/alerts')
      .then(res => setAlertsCount(res.data?.length || 0))
      .catch(() => {});
  };

  const fetchSerpApiUsage = () => {
    API.get('/serpapi-usage')
      .then(res => setSerpApiUsage(res.data))
      .catch(() => {});
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    if (!destination) {
      Swal.fire({
        title: 'Selecione o Destino',
        text: 'Por favor, informe o aeroporto ou cidade para onde deseja viajar.',
        icon: 'warning',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#0066ff'
      });
      return;
    }

    if (searchMode === 'flytogether' && (!origin1 || !origin2)) {
      Swal.fire({
        title: 'Informe as 2 Origens',
        text: 'No modo Fly Together, selecione a origem da Pessoa 1 e da Pessoa 2.',
        icon: 'warning',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#0066ff'
      });
      return;
    }

    if (searchMode === 'normal' && !origin1) {
      Swal.fire({
        title: 'Selecione a Origem',
        text: 'Por favor, selecione o aeroporto de partida.',
        icon: 'warning',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#0066ff'
      });
      return;
    }

    // Salvar critérios de busca no localStorage para a próxima visita
    const searchCriteria = {
      searchMode,
      origin1,
      origin2,
      destination,
      departureDate,
      returnDate,
      onlyWeekends,
      isVacation,
      vacationStart,
      vacationEnd,
      durationDays
    };
    localStorage.setItem('fly2gether_last_search', JSON.stringify(searchCriteria));

    setLoading(true);

    // Cancelar qualquer requisição ativa anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

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

      const res = await API.get('/flights/search', {
        params,
        signal: abortControllerRef.current.signal
      });
      setResults(Array.isArray(res.data?.results) ? res.data.results : []);
      fetchSerpApiUsage(); // Atualiza cota de buscas após realizar a pesquisa
    } catch (err) {
      if (err.name === 'CanceledError' || err.message?.includes('canceled')) {
        console.log('Pesquisa cancelada pelo usuário.');
      } else {
        console.error('Erro na busca:', err);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    Swal.fire({
      title: 'Busca Cancelada',
      text: 'A consulta de voos foi interrompida.',
      icon: 'info',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      background: '#0f172a',
      color: '#f8fafc'
    });
  };

  const handleOpenCreateAlert = (flightOrCombined) => {
    setActiveAlertTarget(flightOrCombined);
    setIsAlertModalOpen(true);
  };

  // Filtragem e Ordenação Dinâmica de Resultados
  const filteredAndSortedResults = useMemo(() => {
    const safeResults = Array.isArray(results) ? results : [];

    return safeResults
      .filter(item => {
        // Filtro por Companhia Aérea
        if (searchMode === 'flytogether') {
          const code1 = item.person1?.airline?.code;
          const code2 = item.person2?.airline?.code;
          if (selectedAirlines.length > 0 && !selectedAirlines.includes(code1) && !selectedAirlines.includes(code2)) {
            return false;
          }
        } else {
          const code = item.airline?.code;
          if (selectedAirlines.length > 0 && !selectedAirlines.includes(code)) {
            return false;
          }
        }

        // Filtro por Escalas / Conexões
        if (stopsFilter === 'direct') {
          if (searchMode === 'flytogether') {
            if (item.person1?.stopsCount > 0 || item.person2?.stopsCount > 0) return false;
          } else {
            if (item.stopsCount > 0) return false;
          }
        } else if (stopsFilter === 'stops') {
          if (searchMode === 'flytogether') {
            if (item.person1?.stopsCount === 0 && item.person2?.stopsCount === 0) return false;
          } else {
            if (item.stopsCount === 0) return false;
          }
        }

        // Filtro para ocultar conexões com troca de aeroporto (traslado)
        if (hideTransfers) {
          if (searchMode === 'flytogether') {
            if (item.person1?.hasAirportTransfer || item.person2?.hasAirportTransfer) return false;
          } else {
            if (item.hasAirportTransfer || item.returnHasAirportTransfer) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'tempo_juntos' && searchMode === 'flytogether') {
          if (b.sharedStayMinutes !== a.sharedStayMinutes) {
            return b.sharedStayMinutes - a.sharedStayMinutes;
          }
          return a.combinedPrice - b.combinedPrice;
        } else if (sortBy === 'price') {
          const priceA = searchMode === 'flytogether' ? a.combinedPrice : a.totalPrice;
          const priceB = searchMode === 'flytogether' ? b.combinedPrice : b.totalPrice;
          return priceA - priceB;
        } else if (sortBy === 'sincronia' && searchMode === 'flytogether') {
          return a.arrivalDeltaMinutes - b.arrivalDeltaMinutes;
        } else if (sortBy === 'departureTime') {
          const timeA = searchMode === 'flytogether' ? a.person1?.departureTime : a.departureTime;
          const timeB = searchMode === 'flytogether' ? b.person1?.departureTime : b.departureTime;
          return (timeA || '').localeCompare(timeB || '');
        } else if (sortBy === 'duration') {
          const durA = searchMode === 'flytogether' ? a.arrivalDeltaMinutes : parseInt(a.duration || '0');
          const durB = searchMode === 'flytogether' ? b.arrivalDeltaMinutes : parseInt(b.duration || '0');
          return durA - durB;
        }
        return 0;
      });
  }, [results, sortBy, selectedAirlines, stopsFilter, hideTransfers, searchMode]);

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
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative mb-10 bg-slate-900/90 backdrop-blur-2xl">
          {/* Mode Selector Tabs */}
          <div className="flex p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6 max-w-md mx-auto">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSearchModeChange('flytogether')}
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
              disabled={loading}
              onClick={() => handleSearchModeChange('normal')}
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

            {/* Submit & Cancel Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-purple-600 to-brand-500 hover:from-brand-500 hover:to-purple-500 text-white font-extrabold text-base shadow-glow transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Consultando ofertas ao vivo no Google Flights...</span>
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

              {loading && (
                <button
                  type="button"
                  onClick={handleCancelSearch}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/50 text-rose-300 font-bold text-base transition-all flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Cancelar</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-100 flex flex-col sm:flex-row sm:items-center gap-2">
                <span>Resultados da Busca</span>
                
                <div className="flex flex-wrap gap-2 mt-1 sm:mt-0">
                  <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                    {filteredAndSortedResults.length} opções
                  </span>
                  
                  {/* SerpAPI Quota Usage Badge */}
                  {serpApiUsage && serpApiUsage.enabled && (
                    <span className="text-xs px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/25 font-mono font-bold flex items-center space-x-1.5" title="Seu limite mensal do plano gratuito do SerpAPI para buscas ao vivo no Google Flights">
                      <BarChart3 className="w-3.5 h-3.5 text-brand-400" />
                      <span>Cota Google Flights: {serpApiUsage.this_month_usage} / {serpApiUsage.searches_per_month} buscas ({serpApiUsage.total_searches_left} restantes)</span>
                    </span>
                  )}
                </div>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {searchMode === 'flytogether'
                  ? 'Combinações de passagens ordenadas por sincronia no destino, menor preço e tarifas promocionais.'
                  : 'Passagens aéreas individuais ordenadas pelo menor preço e quantidade de escalas.'}
              </p>
            </div>
          </div>

          {/* Interactive Sorting & Filtering Controls Bar */}
          {results.length > 0 && (
            <FilterSortBar
              sortBy={sortBy}
              setSortBy={setSortBy}
              selectedAirlines={selectedAirlines}
              setSelectedAirlines={setSelectedAirlines}
              stopsFilter={stopsFilter}
              setStopsFilter={setStopsFilter}
              hideTransfers={hideTransfers}
              setHideTransfers={setHideTransfers}
              searchMode={searchMode}
            />
          )}

          {/* Render Results List */}
          {loading ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 space-y-4 bg-slate-900/40">
              <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <h3 className="text-lg font-bold text-slate-200">
                Consultando as melhores opções no Google Flights...
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Consultando companhias aéreas e tarifas promocionais diretamente na API.
              </p>
            </div>
          ) : filteredAndSortedResults.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSortedResults.map((item) => (
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
              <h3 className="text-lg font-bold text-slate-300">
                {results.length > 0
                  ? 'Nenhum voo corresponde aos filtros ativos (companhia, escala ou troca de aeroporto).'
                  : 'Pronto para buscar! Clique em buscar para trazer passagens em tempo real.'}
              </h3>
              <p className="text-xs text-slate-500">
                {results.length > 0
                  ? 'Tente ajustar os filtros na barra de ordenação acima.'
                  : 'Informe os aeroportos de partida e destino para ver as melhores datas.'}
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
