import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plane, Users, Calendar, Search, Flame, Sparkles, Filter, ArrowRight, ShieldCheck, Heart, XCircle, BarChart3, ChevronRight, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import Navbar from './components/Navbar';
import AirportAutocomplete from './components/AirportAutocomplete';
import SmartExtensionsToggle from './components/SmartExtensionsToggle';
import FilterSortBar, { TOLERANCE_STEPS } from './components/FilterSortBar';
import FlightCard from './components/FlightCard';
import CombinedFlightCard from './components/CombinedFlightCard';
import CreateAlertModal from './components/CreateAlertModal';
import MyAlertsDrawer from './components/MyAlertsDrawer';
import API from './services/api';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user } = useAuth();

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
  const [sortBy, setSortBy] = useState('sincronia_total'); // 'sincronia_total', 'tempo_juntos', 'price', 'duration', 'departureTime', 'sincronia'
  const [selectedAirlines, setSelectedAirlines] = useState(['LA', 'G3', 'AD', 'TP', 'CM']);
  const [stopsFilter, setStopsFilter] = useState('all'); // 'all', 'direct', 'stops'
  const [hideTransfers, setHideTransfers] = useState(false);
  const [toleranceIndex, setToleranceIndex] = useState(3); // Default to 3 (1h)

  // Results, Loading, SerpAPI Quota & Cancel Trigger
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [activeAlertTarget, setActiveAlertTarget] = useState(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearchModeChange = (mode) => {
    setSearchMode(mode);
    setSortBy(mode === 'flytogether' ? 'sincronia_total' : 'price');
  };
  const [alertsCount, setAlertsCount] = useState(0);
  const [serpApiUsage, setSerpApiUsage] = useState(null);
  const [useLiveApi, setUseLiveApi] = useState(false);
  const [scrapingMessage, setScrapingMessage] = useState('');

  const abortControllerRef = useRef(null);
  const pollingIntervalRef = useRef(null);

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
    fetchSerpApiUsage();
  }, []);

  useEffect(() => {
    fetchAlertsCount();
  }, [user]);

  const fetchAlertsCount = () => {
    if (!user) {
      setAlertsCount(0);
      return;
    }
    API.get('/alerts')
      .then(res => setAlertsCount(res.data?.length || 0))
      .catch(() => setAlertsCount(0));
  };

  const fetchSerpApiUsage = () => {
    API.get('/serpapi-usage')
      .then(res => setSerpApiUsage(res.data))
      .catch(() => {});
  };

  const startPollingSearch = (searchParams) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log('🔄 [Polling] Verificando se a coleta do robô terminou...');
        const res = await API.get('/flights/search', {
          params: searchParams
        });
        
        if (res.data?.status !== 'scraping') {
          console.log('✅ [Polling] Coleta concluída com sucesso!');
          setResults(Array.isArray(res.data?.results) ? res.data.results : []);
          setScrapingMessage('');
          setLoading(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          fetchSerpApiUsage();
        } else {
          setScrapingMessage(res.data.message || 'Nosso robô está minerando tarifas...');
        }
      } catch (err) {
        console.error('❌ [Polling] Erro no polling de busca:', err);
      }
    }, 5000); // 5s
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
    setScrapingMessage('');

    // Cancelar qualquer requisição ou polling ativos anteriores
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

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
        durationDays,
        useLiveApi
      };

      const res = await API.get('/flights/search', {
        params,
        signal: abortControllerRef.current.signal
      });

      if (res.data?.status === 'scraping') {
        setScrapingMessage(res.data.message || 'Nosso robô iniciou a busca no Google Flights...');
        startPollingSearch(params);
      } else {
        setResults(Array.isArray(res.data?.results) ? res.data.results : []);
        setScrapingMessage('');
        setLoading(false);
        fetchSerpApiUsage(); // Atualiza cota de buscas após realizar a pesquisa
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message?.includes('canceled')) {
        console.log('Pesquisa cancelada pelo usuário.');
      } else {
        console.error('Erro na busca:', err);
        setResults([]);
        setLoading(false);
      }
    }
  };

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setScrapingMessage('');
    setLoading(false);
    Swal.fire({
      title: 'Busca Cancelada',
      text: 'A consulta de voos foi interrompida.',
      icon: 'info',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      background: '#0f172a',
      color: '#f8fafc'
    });
  };

  const handleOpenCreateAlert = (flightOrCombined) => {
    if (!user) {
      Swal.fire({
        title: 'Login Necessário',
        text: 'Para criar alertas de preço sincronizados entre todos os seus dispositivos, faça login com sua conta do Google.',
        icon: 'info',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#0066ff',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const searchState = {
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
      durationDays,
      sortBy,
      selectedAirlines,
      stopsFilter,
      hideTransfers,
      toleranceIndex
    };

    setActiveAlertTarget({ flightOrCombined, searchState });
    setIsAlertModalOpen(true);
  };

  const handleOpenAlertsDrawer = () => {
    if (!user) {
      Swal.fire({
        title: 'Login Necessário',
        text: 'Faça login com sua conta do Google para visualizar e gerenciar seus alertas de preço.',
        icon: 'info',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#0066ff',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    setIsDrawerOpen(true);
  };

  // Checar se há resultados provenientes de cache expirado (SWR em revalidação)
  const hasStaleResults = useMemo(() => {
    const safeResults = Array.isArray(results) ? results : [];
    return safeResults.some(f => f.isStaleCache || f.person1?.isStaleCache || f.person2?.isStaleCache);
  }, [results]);

  // Filtragem e Ordenação Dinâmica de Resultados
  const filteredAndSortedResults = useMemo(() => {
    const safeResults = Array.isArray(results) ? results : [];

    return safeResults
      .filter(item => {
        // Filtro por Companhia Aérea
        if (searchMode === 'flytogether') {
          const code1 = item.person1?.airline?.code;
          const code2 = item.person2?.airline?.code;
          if (selectedAirlines.length > 0 && (!selectedAirlines.includes(code1) || !selectedAirlines.includes(code2))) {
            return false;
          }
        } else {
          const code = item.airline?.code;
          if (selectedAirlines.length > 0 && !selectedAirlines.includes(code)) {
            return false;
          }
        }

        // Filtro por Escalas / Conexões (considerando ida e volta)
        if (stopsFilter === 'direct') {
          if (searchMode === 'flytogether') {
            if (
              item.person1?.stopsCount > 0 || 
              item.person2?.stopsCount > 0 ||
              (item.person1?.returnStopsCount || 0) > 0 ||
              (item.person2?.returnStopsCount || 0) > 0
            ) return false;
          } else {
            if (item.stopsCount > 0 || (item.returnStopsCount || 0) > 0) return false;
          }
        } else if (stopsFilter === 'stops') {
          if (searchMode === 'flytogether') {
            if (
              item.person1?.stopsCount === 0 && 
              item.person2?.stopsCount === 0 &&
              (item.person1?.returnStopsCount || 0) === 0 &&
              (item.person2?.returnStopsCount || 0) === 0
            ) return false;
          } else {
            if (item.stopsCount === 0 && (item.returnStopsCount || 0) === 0) return false;
          }
        }

        // Filtro para ocultar conexões com troca de aeroporto (traslado na ida e volta)
        if (hideTransfers) {
          if (searchMode === 'flytogether') {
            if (
              item.person1?.hasAirportTransfer || 
              item.person1?.returnHasAirportTransfer ||
              item.person2?.hasAirportTransfer || 
              item.person2?.returnHasAirportTransfer
            ) return false;
          } else {
            if (
              item.hasAirportTransfer || 
              item.returnHasAirportTransfer
            ) return false;
          }
        }

        // Filtro de Tolerância de Horários no modo Fly Together
        if (searchMode === 'flytogether') {
          const limit = TOLERANCE_STEPS[toleranceIndex]?.value;
          if (limit !== undefined && limit !== Infinity) {
            let returnDepartureDelta = 0;
            let hasReturn = false;
            if (item.person1?.returnDepartureTime && item.person2?.returnDepartureTime) {
              const [h1, m1] = item.person1.returnDepartureTime.split(':').map(Number);
              const [h2, m2] = item.person2.returnDepartureTime.split(':').map(Number);
              returnDepartureDelta = Math.abs((h1 * 60 + m1) - (h2 * 60 + m2));
              hasReturn = true;
            }
            // Média de discrepância entre os trechos ativos
            const averageDelta = hasReturn 
              ? (item.arrivalDeltaMinutes + returnDepartureDelta) / 2 
              : item.arrivalDeltaMinutes;

            if (averageDelta > limit) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'sincronia_total' && searchMode === 'flytogether') {
          const getReturnDelta = (item) => {
            if (item.person1?.returnDepartureTime && item.person2?.returnDepartureTime) {
              const [h1, m1] = item.person1.returnDepartureTime.split(':').map(Number);
              const [h2, m2] = item.person2.returnDepartureTime.split(':').map(Number);
              return Math.abs((h1 * 60 + m1) - (h2 * 60 + m2));
            }
            return 0;
          };
          const totalDeltaA = a.arrivalDeltaMinutes + getReturnDelta(a);
          const totalDeltaB = b.arrivalDeltaMinutes + getReturnDelta(b);

          const limit = TOLERANCE_STEPS[toleranceIndex]?.value;
          if (limit !== undefined && limit !== Infinity) {
            // Se a tolerância está ativada, traz os mais baratos primeiro dentro dessa margem
            if (a.combinedPrice !== b.combinedPrice) {
              return a.combinedPrice - b.combinedPrice;
            }
            return totalDeltaA - totalDeltaB;
          } else {
            // Se for "Qualquer", ordena primeiramente pela melhor sincronia total
            if (totalDeltaA !== totalDeltaB) {
              return totalDeltaA - totalDeltaB;
            }
            return a.combinedPrice - b.combinedPrice;
          }
        } else if (sortBy === 'tempo_juntos' && searchMode === 'flytogether') {
          if (b.sharedStayMinutes !== a.sharedStayMinutes) {
            return b.sharedStayMinutes - a.sharedStayMinutes;
          }
          return a.combinedPrice - b.combinedPrice;
        } else if (sortBy === 'price') {
          const priceA = searchMode === 'flytogether' ? a.combinedPrice : a.totalPrice;
          const priceB = searchMode === 'flytogether' ? b.combinedPrice : b.totalPrice;
          return priceA - priceB;
        } else if (sortBy === 'sincronia' && searchMode === 'flytogether') {
          const limit = TOLERANCE_STEPS[toleranceIndex]?.value;
          if (limit !== undefined && limit !== Infinity) {
            if (a.combinedPrice !== b.combinedPrice) {
              return a.combinedPrice - b.combinedPrice;
            }
            return a.arrivalDeltaMinutes - b.arrivalDeltaMinutes;
          } else {
            return a.arrivalDeltaMinutes - b.arrivalDeltaMinutes;
          }
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
  }, [results, sortBy, selectedAirlines, stopsFilter, hideTransfers, searchMode, toleranceIndex]);

  // Resetar página atual de paginação ao alterar qualquer critério de filtragem ou ordenação
  useEffect(() => {
    setCurrentPage(1);
  }, [results, selectedAirlines, stopsFilter, hideTransfers, sortBy, toleranceIndex]);

  const PAGE_SIZE = 100;

  // Obter resultados fatiados para renderizar apenas a página atual
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedResults.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAndSortedResults, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedResults.length / PAGE_SIZE);
  }, [filteredAndSortedResults]);

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        onOpenAlertsDrawer={handleOpenAlertsDrawer}
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
            <span 
              className="bg-clip-text bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 font-extrabold"
              style={{ color: 'transparent', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
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
            {/* Paid API vs Free Scraper Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-800/60 mb-6 space-y-2 sm:space-y-0">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Pesquisar ao Vivo (SerpAPI Paga)
                </span>
                <p className="text-xs text-slate-400 max-w-lg">
                  O modo padrão (robô) usa cache de 24h e é grátis. O modo ao vivo pesquisa tarifas em tempo real consumindo créditos da API.
                </p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLiveApi}
                  onChange={(e) => setUseLiveApi(e.target.checked)}
                  disabled={loading}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500 peer-checked:after:bg-white peer-checked:after:border-brand-600"></div>
              </label>
            </div>

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
          {/* Planejamento Disclaimer Banner */}
          {results.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5 shadow-sm">
              <span className="text-base">⚠️</span>
              <p className="leading-relaxed">
                <strong>Aviso de Planejamento:</strong> Os horários, conexões e preços exibidos são para fins de histórico e planejamento conjunto. As tarifas aéreas reais flutuam constantemente e podem sofrer alterações pelas companhias no momento da compra.
              </p>
            </div>
          )}

          {/* Stale Cache background revalidation alert */}
          {results.length > 0 && hasStaleResults && (
            <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs flex items-center gap-2.5 shadow-sm animate-pulse">
              <RefreshCw className="w-4 h-4 text-brand-400 animate-spin" />
              <p>
                <strong>Dados Históricos Ativos:</strong> Algumas passagens exibidas acima são do cache de ontem. Nosso robô já foi acionado e está atualizando os preços em segundo plano.
              </p>
            </div>
          )}
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
              toleranceIndex={toleranceIndex}
              setToleranceIndex={setToleranceIndex}
            />
          )}

          {/* Render Results List */}
          {loading ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 space-y-4 bg-slate-900/40">
              <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <h3 className="text-lg font-bold text-slate-200">
                {scrapingMessage || 'Consultando as melhores opções no Google Flights...'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {scrapingMessage 
                  ? 'Nosso robô está vasculhando a web para colher tarifas, aeronaves e conexões detalhadas (isso pode levar cerca de 1 minuto na primeira busca).' 
                  : 'Consultando companhias aéreas e tarifas promocionais diretamente na API.'}
              </p>
            </div>
          ) : filteredAndSortedResults.length > 0 ? (
            <div className="space-y-6">
              <div className="space-y-4">
                {paginatedResults.map((item) => (
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

              {/* Controles de Paginação */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800/80 mt-6">
                  <span className="text-xs text-slate-400">
                    Exibindo {Math.min(filteredAndSortedResults.length, (currentPage - 1) * PAGE_SIZE + 1)}-{Math.min(filteredAndSortedResults.length, currentPage * PAGE_SIZE)} de {filteredAndSortedResults.length} opções (Página {currentPage} de {totalPages})
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    
                    {/* Renderizar números de páginas próximos */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                      let pageNum = index + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 3 + index;
                        if (pageNum + (4 - index) > totalPages) {
                          pageNum = totalPages - 4 + index;
                        }
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                            currentPage === pageNum
                              ? 'bg-brand-600 text-white shadow-glow'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
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
