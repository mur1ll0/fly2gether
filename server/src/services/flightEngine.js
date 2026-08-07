import crypto from 'crypto';
import { searchGoogleFlights } from './providers/googleFlightsProvider.js';
import { searchDuffelFlights } from './providers/duffelProvider.js';
import FlightCache from '../models/FlightCache.js';
import SearchSession from '../models/SearchSession.js';
import { scrapeGoogleFlights } from './providers/googleFlightsScraper.js';
import { triggerGithubScraper } from '../utils/githubDispatcher.js';

import { getBrazilianHolidays, getHolidayInfo } from '../utils/holidays.js';

// Cache em memória de rotas já disparadas para o GitHub Actions para evitar disparos duplicados
const recentlyTriggered = new Set();

export function generateSearchHash(params) {
  const mode = params.mode || 'normal';
  const orig1 = (params.origin1 || params.origin || '').toUpperCase().trim();
  const orig2 = (params.origin2 || '').toUpperCase().trim();
  const dest = (params.destination || '').toUpperCase().trim();
  const dep = (params.departureDate || '').trim();
  const ret = (params.returnDate || '').trim();

  const str = `${mode}:${orig1}:${orig2}:${dest}:${dep}:${ret}`;
  return crypto.createHash('md5').update(str).digest('hex');
}

const AIRLINES = [
  { code: 'LA', name: 'LATAM Airlines' },
  { code: 'G3', name: 'GOL Linhas Aéreas' },
  { code: 'AD', name: 'Azul Linhas Aéreas' }
];

function getRouteBasePrice(origin, dest) {
  const hash = (origin.charCodeAt(0) + dest.charCodeAt(0)) % 3;
  if (hash === 0) return 380;
  if (hash === 1) return 480;
  return 590;
}

function getHolidayOnDate(dateStr) {
  return getHolidayInfo(dateStr);
}

/**
 * Retorna se a data é fim de semana (Sábado ou Domingo)
 */
function isWeekend(dateStr) {
  const day = new Date(dateStr).getUTCDay();
  return day === 0 || day === 6; // 0 = Domingo, 6 = Sábado
}

/**
 * Diagnóstico inteligente de conectividade de malha aérea entre aeroportos
 */
export function diagnoseAirportRoute(origin, destination) {
  const orig = (origin || '').toUpperCase();
  const dest = (destination || '').toUpperCase();

  // Chapecó (XAP) -> São Paulo Congonhas (CGH)
  if (orig === 'XAP' && dest === 'CGH') {
    return {
      hasDirectConnection: false,
      reason: `O aeroporto de Chapecó (XAP) não possui voos operando para São Paulo Congonhas (CGH). Na malha aérea brasileira, Chapecó conecta-se prioritariamente com São Paulo Guarulhos (GRU) e Campinas (VCP).`,
      suggestedDestinations: ['GRU', 'VCP']
    };
  }

  if (orig === 'XAP' && !['GRU', 'VCP', 'CWB', 'FLN'].includes(dest)) {
    return {
      hasDirectConnection: false,
      reason: `O aeroporto de Chapecó (XAP) possui voos comerciais limitados principalmente para Guarulhos (GRU), Viracopos (VCP) e Curitiba (CWB).`,
      suggestedDestinations: ['GRU', 'VCP']
    };
  }

  // Santos Dumont (SDU)
  if (orig === 'SDU' && !['CGH', 'BSB', 'VCP', 'CNF'].includes(dest)) {
    return {
      hasDirectConnection: false,
      reason: `O aeroporto Santos Dumont (SDU) opera rotas restritas principalmente para Congonhas (CGH), Brasília (BSB) e Confins (CNF). Para outros destinos, consulte Galeão (GIG).`,
      suggestedDestinations: ['GIG']
    };
  }

  return {
    hasDirectConnection: true,
    reason: `Não foram encontrados voos disponíveis operando entre ${orig} e ${dest} nas datas selecionadas.`,
    suggestedDestinations: []
  };
}

/**
 * Gera datas de finais de semana ou emendas de feriados
 */
function generateWeekendCandidateDates() {
  const candidates = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Limite de 60 dias (2 meses) para fins de semana normais sem feriado
  const twoMonthsAhead = new Date(today);
  twoMonthsAhead.setDate(today.getDate() + 60);
  const maxNormalDateStr = twoMonthsAhead.toISOString().split('T')[0];

  // Varre os próximos 365 dias para identificar feriados e fins de semana
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const holiday = getHolidayOnDate(dateStr);
    const dayOfWeek = d.getUTCDay(); // 0: Dom, 1: Seg, 2: Ter, 3: Qua, 4: Qui, 5: Sex, 6: Sáb

    // 1. Caso Feriado na Segunda-feira (ex: 7/Set, 12/Out, 02/Nov)
    if (holiday && dayOfWeek === 1) {
      const friPrev = new Date(d); friPrev.setDate(d.getDate() - 3);
      const satPrev = new Date(d); satPrev.setDate(d.getDate() - 2);

      // Opção A: Ida na Sexta à noite ➔ Volta na Segunda (feriado)
      candidates.push({
        departureDate: friPrev.toISOString().split('T')[0],
        returnDate: dateStr,
        isWeekendOrHoliday: true,
        holidayDetails: holiday
      });
      // Opção B: Ida no Sábado ➔ Volta na Segunda (feriado)
      candidates.push({
        departureDate: satPrev.toISOString().split('T')[0],
        returnDate: dateStr,
        isWeekendOrHoliday: true,
        holidayDetails: holiday
      });
    }

    // 2. Caso Feriado na Sexta-feira (ex: 20/Nov, 25/Dez)
    if (holiday && dayOfWeek === 5) {
      const thuPrev = new Date(d); thuPrev.setDate(d.getDate() - 1);
      const sunNext = new Date(d); sunNext.setDate(d.getDate() + 2);

      // Opção A: Ida na Quinta à noite ➔ Volta no Domingo
      candidates.push({
        departureDate: thuPrev.toISOString().split('T')[0],
        returnDate: sunNext.toISOString().split('T')[0],
        isWeekendOrHoliday: true,
        holidayDetails: holiday
      });
      // Opção B: Ida na Sexta (feriado) ➔ Volta no Domingo
      candidates.push({
        departureDate: dateStr,
        returnDate: sunNext.toISOString().split('T')[0],
        isWeekendOrHoliday: true,
        holidayDetails: holiday
      });
    }

    // 3. Caso Feriado na Quinta-feira (Emenda na Sexta-feira, ex: Corpus Christi)
    if (holiday && dayOfWeek === 4) {
      const sunNext = new Date(d); sunNext.setDate(d.getDate() + 3);
      candidates.push({
        departureDate: dateStr, // Partida no feriado (Quinta)
        returnDate: sunNext.toISOString().split('T')[0], // Retorno no Domingo
        isWeekendOrHoliday: true,
        holidayDetails: holiday
      });
    }

    // 4. Caso Feriado na Terça-feira (Emenda na Segunda-feira)
    if (holiday && dayOfWeek === 2) {
      const satPrev = new Date(d); satPrev.setDate(d.getDate() - 3);
      candidates.push({
        departureDate: satPrev.toISOString().split('T')[0], // Partida no Sábado anterior
        returnDate: dateStr, // Retorno no feriado (Terça)
        isWeekendOrHoliday: true,
        holidayDetails: holiday
      });
    }

    // 5. Finais de Semana Padrão (Sem Feriado): Apenas para os PRÓXIMOS 2 MESES (60 dias)
    if (dayOfWeek === 5 && dateStr <= maxNormalDateStr && !holiday) { // Sexta-feira sem feriado
      const sat = new Date(d); sat.setDate(d.getDate() + 1);
      const sun = new Date(d); sun.setDate(d.getDate() + 2);

      // Sexta ➔ Domingo
      candidates.push({
        departureDate: dateStr,
        returnDate: sun.toISOString().split('T')[0],
        isWeekendOrHoliday: true,
        holidayDetails: null
      });
    }
  }

  // Filtrar apenas candidatos futuros e remover duplicatas ordenando cronologicamente
  const unique = [];
  const seen = new Set();

  for (const c of candidates) {
    const key = `${c.departureDate}_${c.returnDate}`;
    if (!seen.has(key) && c.departureDate >= todayStr) {
      seen.add(key);
      unique.push(c);
    }
  }

  return unique.sort((a, b) => a.departureDate.localeCompare(b.departureDate));
}

/**
 * Calcula a janela de férias comuns entre o casal
 */
function generateVacationCandidateDates(start, end, duration) {
  const candidates = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Intervalo total em dias
  const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  if (totalDays < duration) return [];

  // Amostragem de datas de partida e volta dentro da janela de férias informada
  for (let i = 0; i <= totalDays - duration; i += 3) { // passo de 3 dias para amostragem variada
    const dep = new Date(startDate);
    dep.setDate(startDate.getDate() + i);
    const ret = new Date(dep);
    ret.setDate(dep.getDate() + duration);

    candidates.push({
      departureDate: dep.toISOString().split('T')[0],
      returnDate: ret.toISOString().split('T')[0],
      isWeekendOrHoliday: false,
      holidayDetails: null
    });
  }

  return candidates;
}

/**
 * Calcula o tempo total compartilhado que o casal passa junto no destino (em minutos)
 */
function calculateSharedStayMinutes(f1, f2, departureDate, returnDate) {
  // Se não houver data de volta, o tempo juntos é indefinido. 
  // Minimizamos a diferença de horários de chegada para que cheguem juntos (maior sincronia).
  if (!returnDate) {
    const [h1, m1] = f1.arrivalTime.split(':').map(Number);
    const [h2, m2] = f2.arrivalTime.split(':').map(Number);
    const delta = Math.abs((h1 * 60 + m1) - (h2 * 60 + m2));
    // Retornamos um número negativo do delta para que valores menores (menor tempo de espera) fiquem no topo
    return -delta;
  }

  try {
    const depTime1 = f1.arrivalTime || '12:00';
    const depTime2 = f2.arrivalTime || '12:00';
    const retTime1 = f1.returnDepartureTime || '12:00';
    const retTime2 = f2.returnDepartureTime || '12:00';

    const arrivalDateTime1 = new Date(`${departureDate}T${depTime1}`);
    const arrivalDateTime2 = new Date(`${departureDate}T${depTime2}`);
    const returnDateTime1 = new Date(`${returnDate}T${retTime1}`);
    const returnDateTime2 = new Date(`${returnDate}T${retTime2}`);

    // Início do tempo juntos: quando o último chega
    const startJuntos = Math.max(arrivalDateTime1.getTime(), arrivalDateTime2.getTime());
    // Fim do tempo juntos: quando o primeiro vai embora
    const endJuntos = Math.min(returnDateTime1.getTime(), returnDateTime2.getTime());

    const diffMs = endJuntos - startJuntos;
    return diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
  } catch (e) {
    return 0;
  }
}

// Helper to generate mock flights as fallback
export function generateMockFlights(origin, destination, departureDate, returnDate, pair = {}) {
  const basePrice = getRouteBasePrice(origin, destination);
  const mockOffers = [];
  
  for (const airline of AIRLINES) {
    const dayHash = (new Date(departureDate).getDate() * 17 + airline.code.charCodeAt(0)) % 40;
    const isMegaPromo = dayHash < 10;
    const discount = isMegaPromo ? 0.35 : 0;

    const priceOutbound = Math.round((basePrice * (0.85 + (dayHash / 100))) * (1 - discount));
    const priceInbound = returnDate ? Math.round((basePrice * (0.80 + (dayHash / 120))) * (1 - discount)) : 0;
    const totalPrice = priceOutbound + priceInbound;

    const depHour = 7 + (dayHash % 14);
    const arrHour = (depHour + 2) % 24;
    const retDepHour = 16 + (dayHash % 6);
    const retArrHour = (retDepHour + 2) % 24;

    const isXAP = origin.toUpperCase() === 'XAP';
    const stopsDetails = isXAP ? '1 escala em Campinas (VCP)' : 'Direto';
    const stopsCount = isXAP ? 1 : 0;
    const stopsList = isXAP ? [{ city: 'Campinas', iata: 'VCP', name: 'Aeroporto Internacional de Viracopos' }] : [];

    const fNumber = `${airline.code} ${3000 + (dayHash % 6000)}`;
    const retFNumber = returnDate ? `${airline.code} ${4000 + (dayHash % 6000)}` : null;
    const airplaneModel = isXAP ? 'Boeing 737-800' : 'Airbus A320neo';

    const formatTime = (h, m) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    mockOffers.push({
      id: `mock-${origin}-${destination}-${airline.code}-${departureDate}`,
      airline: {
        code: airline.code,
        name: airline.name,
        logo: `https://www.gstatic.com/flights/airline_logos/70px/${airline.code}.png`
      },
      origin,
      destination,
      departureDate,
      returnDate,
      departureTime: formatTime(depHour, 15),
      arrivalTime: formatTime(arrHour, 45),
      returnDepartureTime: returnDate ? formatTime(retDepHour, 10) : null,
      returnArrivalTime: returnDate ? formatTime(retArrHour, 40) : null,
      duration: isXAP ? '4h 15m' : '2h 30m',
      returnDuration: isXAP ? '4h 15m' : '2h 30m',
      flightNumber: fNumber,
      airplane: airplaneModel,
      returnFlightNumber: retFNumber,
      returnAirplane: returnDate ? airplaneModel : null,
      outboundPrice: priceOutbound,
      inboundPrice: priceInbound,
      totalPrice,
      isMegaPromo,
      promoTag: isMegaPromo ? '🔥 Mega Promoção LATAM/GOL/Azul (-35%)' : null,
      isWeekendOrHoliday: pair.isWeekendOrHoliday || false,
      holidayDetails: pair.holidayDetails || null,
      stopsCount,
      stopsDetails,
      stopsList,
      returnStopsCount: stopsCount,
      returnStopsList: stopsList,
      departureToken: returnDate ? `mock-token-${origin}-${destination}-${airline.code}-${departureDate}` : null,
      bookingUrl: `https://www.google.com/travel/flights?q=Voos%20de%20${origin}%20para%20${destination}`,
      provider: 'Simulador Fly2Gether'
    });
  }
  return mockOffers;
}

// Combina voos de ida e volta do cache de pernas únicas
function pairOneWayFlights(outboundFlights, inboundFlights, returnDate) {
  const paired = [];
  outboundFlights.slice(0, 15).forEach((out, outIdx) => {
    inboundFlights.slice(0, 15).forEach((inb, inbIdx) => {
      const totalPrice = out.totalPrice + inb.totalPrice;
      paired.push({
        id: `gflight-${out.origin}-${out.destination}-${outIdx}-${inbIdx}-${Date.now()}`,
        airline: out.airline,
        origin: out.origin,
        destination: out.destination,
        departureDate: out.departureDate,
        returnDate: returnDate,

        // Ida (Outbound)
        departureTime: out.departureTime,
        arrivalTime: out.arrivalTime,
        duration: out.duration,
        stopsCount: out.stopsCount,
        stopsList: out.stopsList,
        hasAirportTransfer: out.hasAirportTransfer,
        flightNumber: out.flightNumber,
        airplane: out.airplane,

        // Volta (Inbound)
        returnDepartureTime: inb.departureTime,
        returnArrivalTime: inb.arrivalTime,
        returnDuration: inb.duration,
        returnStopsCount: inb.stopsCount,
        returnStopsList: inb.stopsList,
        returnHasAirportTransfer: inb.hasAirportTransfer,
        returnFlightNumber: inb.flightNumber,
        returnAirplane: inb.airplane,

        outboundPrice: out.totalPrice,
        inboundPrice: inb.totalPrice,
        totalPrice,
        isMegaPromo: out.isMegaPromo || inb.isMegaPromo,
        bookingUrl: out.bookingUrl,
        provider: 'Google Flights (cache)'
      });
    });
  });
  return paired.sort((a, b) => a.totalPrice - b.totalPrice);
}

// Aciona a revalidação da leg em segundo plano
function triggerRevalidation(origin, destination, date) {
  const isLocal = process.env.RUN_SCRAPER_LOCALLY === 'true' || process.env.NODE_ENV === 'development';
  if (isLocal) {
    // Executa em background de forma assíncrona no Node local
    Promise.resolve().then(async () => {
      try {
        console.log(`[Background Revalidate] Iniciando Puppeteer local assíncrono para ${origin}➔${destination}...`);
        const flightsList = await scrapeGoogleFlights({ origin, destination, departureDate: date });
        if (flightsList && flightsList.length > 0) {
          await FlightCache.findOneAndUpdate(
            { origin, destination, departureDate: date, returnDate: null },
            { flights: flightsList, scrapedAt: new Date(), source: 'scraper', status: 'completed' },
            { upsert: true }
          );
          console.log(`[Background Revalidate] Cache local revalidado com sucesso!`);
        }
      } catch (e) {
        console.error(`[Background Revalidate] Erro ao revalidar localmente:`, e.message);
      }
    });
  } else {
    // Em produção (Vercel), dispara o GitHub Actions de revalidação
    console.log(`[Background Revalidate] Disparando Actions no GitHub para ${origin}➔${destination}...`);
    triggerGithubScraper(origin, destination, date).catch(() => {});
  }
}

// Aciona a revalidação do par de voos da SerpAPI em segundo plano
function revalidateLiveSearch(origin, destination, departureDate, returnDate) {
  Promise.resolve().then(async () => {
    try {
      console.log(`[Background Revalidate API] Iniciando SerpAPI em background para ${origin}➔${destination}...`);
      const liveOffers = await searchGoogleFlights({ origin, destination, departureDate, returnDate });
      if (liveOffers && liveOffers.length > 0) {
        await FlightCache.findOneAndUpdate(
          { origin, destination, departureDate, returnDate },
          { flights: liveOffers, scrapedAt: new Date(), source: 'api' },
          { upsert: true }
        );
        console.log(`[Background Revalidate API] Cache de API revalidado com sucesso!`);
      }
    } catch (e) {
      console.error(`[Background Revalidate API] Erro ao revalidar API:`, e.message);
    }
  });
}

const localScrapeQueue = [];
let activeScrapesCount = 0;
const MAX_CONCURRENT_SCRAPES = 2;
const queuedKeys = new Set();

function triggerLocalScrape(origin, destination, date) {
  const key = `${origin}-${destination}-${date}`;
  if (queuedKeys.has(key)) return;
  queuedKeys.add(key);

  localScrapeQueue.push({ origin, destination, date, key });
  processLocalScrapeQueue();
}

function processLocalScrapeQueue() {
  if (activeScrapesCount >= MAX_CONCURRENT_SCRAPES || localScrapeQueue.length === 0) return;

  const task = localScrapeQueue.shift();
  activeScrapesCount++;

  Promise.resolve().then(async () => {
    try {
      console.log(`[Fila Local (${activeScrapesCount}/${MAX_CONCURRENT_SCRAPES})] Puppeteer iniciando para ${task.origin}➔${task.destination} em ${task.date}...`);
      const flightsList = await scrapeGoogleFlights({ origin: task.origin, destination: task.destination, departureDate: task.date });
      await FlightCache.findOneAndUpdate(
        { origin: task.origin, destination: task.destination, departureDate: task.date, returnDate: null },
        { flights: flightsList || [], scrapedAt: new Date(), source: 'scraper', status: 'completed' },
        { upsert: true }
      );
      console.log(`[Fila Local] ✅ Concluído para ${task.origin}➔${task.destination} em ${task.date} (${flightsList?.length || 0} voos)`);
    } catch (err) {
      console.error(`[Fila Local] ❌ Falha na raspagem para ${task.origin}➔${task.destination} em ${task.date}:`, err.message);
      await FlightCache.findOneAndUpdate(
        { origin: task.origin, destination: task.destination, departureDate: task.date, returnDate: null },
        { flights: [], scrapedAt: new Date(), source: 'scraper', status: 'completed' },
        { upsert: true }
      );
    } finally {
      queuedKeys.delete(task.key);
      activeScrapesCount--;
      processLocalScrapeQueue();
    }
  }).catch((err) => {
    console.error(`[Fila Local Warning] Falha na fila:`, err.message);
    queuedKeys.delete(task.key);
    activeScrapesCount--;
    processLocalScrapeQueue();
  });
}

function isTimeInWindow(timeStr, minTime, maxTime) {
  if (!timeStr) return true;
  if (!minTime && !maxTime) return true;
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const minutes = h * 60 + (m || 0);

    if (minTime) {
      const [minH, minM] = minTime.split(':').map(Number);
      if (minutes < minH * 60 + (minM || 0)) return false;
    }
    if (maxTime) {
      const [maxH, maxM] = maxTime.split(':').map(Number);
      if (minutes > maxH * 60 + (maxM || 0)) return false;
    }
  } catch (e) {
    return true;
  }
  return true;
}

// Resolve voos de perna única (One-Way) usando Cache unificado + SWR + Scraper Local/Nuvem
async function resolveOneWayLeg(origin, destination, date, useLiveApi = false, forceRefresh = false) {
  const originUpper = origin.toUpperCase();
  const destUpper = destination.toUpperCase();
  const freshThreshold = new Date(Date.now() - 8 * 60 * 60 * 1000);

  if (forceRefresh) {
    console.log(`[Force Refresh] Ignorando e limpando cache existente para ${originUpper}➔${destUpper} em ${date}`);
    await FlightCache.deleteOne({ origin: originUpper, destination: destUpper, departureDate: date, returnDate: null });
  }

  // 1. Tentar encontrar no Cache do MongoDB (se não for forceRefresh)
  const cached = forceRefresh ? null : await FlightCache.findOne({
    origin: originUpper,
    destination: destUpper,
    departureDate: date,
    returnDate: null
  });

  if (cached) {
    if (cached.status === 'pending') {
      const isStalePending = new Date() - cached.scrapedAt > 5 * 60 * 1000; // 5 minutos
      if (!isStalePending) {
        const isLocal = process.env.RUN_SCRAPER_LOCALLY === 'true' || process.env.NODE_ENV === 'development';
        if (isLocal) {
          triggerLocalScrape(originUpper, destUpper, date);
        }
        // Em produção, a busca está rodando ativamente na nuvem. Aguarda o término dentro da janela de 5 minutos sem re-disparar.
        return {
          status: 'scraping',
          origin: originUpper,
          destination: destUpper,
          departureDate: date,
          flightsCount: 0,
          isCompleted: false
        };
      }
      console.log(`[Cache Pending Stale] Tentativa de raspagem anterior expirou. Reiniciando...`);
    } else {
      const isFresh = cached.scrapedAt >= freshThreshold;
      if (isFresh) {
        console.log(`[Cache Hit] Perna fresca: ${originUpper}➔${destUpper} em ${date}`);
        return cached.flights;
      } else {
        console.log(`[Cache Stale] Perna expirada. Retornando cache e revalidando: ${originUpper}➔${destUpper} em ${date}`);
        triggerRevalidation(originUpper, destUpper, date);
        return cached.flights.map(f => ({ ...f, isStaleCache: true, cachedAt: cached.scrapedAt }));
      }
    }
  }

  // 2. Cache Miss: Rota inédita
  console.log(`[Cache Miss] Perna inédita: ${originUpper}➔${destUpper} em ${date}`);

  // Marca como pending no banco imediatamente
  await FlightCache.findOneAndUpdate(
    { origin: originUpper, destination: destUpper, departureDate: date, returnDate: null },
    { flights: [], scrapedAt: new Date(), source: 'scraper', status: 'pending' },
    { upsert: true }
  );

  const isLocal = process.env.RUN_SCRAPER_LOCALLY === 'true' || process.env.NODE_ENV === 'development';
  if (isLocal) {
    triggerLocalScrape(originUpper, destUpper, date);
  } else if (useLiveApi) {
    console.log(`[API Fallback] Buscando perna única via SerpAPI...`);
    try {
      const liveOffers = await searchGoogleFlights({ origin: originUpper, destination: destUpper, departureDate: date });
      await FlightCache.findOneAndUpdate(
        { origin: originUpper, destination: destUpper, departureDate: date, returnDate: null },
        { flights: liveOffers || [], scrapedAt: new Date(), source: 'api', status: 'completed' },
        { upsert: true }
      );
      return liveOffers || [];
    } catch (err) {
      console.error(`[API Fallback] Falha no SerpAPI para ${originUpper}➔${destUpper}:`, err.message);
      await FlightCache.findOneAndUpdate(
        { origin: originUpper, destination: destUpper, departureDate: date, returnDate: null },
        { flights: [], scrapedAt: new Date(), source: 'api', status: 'completed' },
        { upsert: true }
      );
      return [];
    }
  } else {
    const triggerKey = `${originUpper}-${destUpper}`;
    if (!recentlyTriggered.has(triggerKey)) {
      recentlyTriggered.add(triggerKey);
      setTimeout(() => recentlyTriggered.delete(triggerKey), 60000);
      triggerGithubScraper(originUpper, destUpper, date).catch(() => {});
    }
  }

  return {
    status: 'scraping',
    origin: originUpper,
    destination: destUpper,
    departureDate: date,
    flightsCount: 0,
    isCompleted: false
  };
}

// Resolve o par de voos (Ida + Volta)
async function resolveFlightsForPair({ origin, destination, departureDate, returnDate, useLiveApi, forceRefresh = false }) {
  const originUpper = origin.toUpperCase();
  const destUpper = destination.toUpperCase();
  const freshThreshold = new Date(Date.now() - 8 * 60 * 60 * 1000);

  // Caso 1: Modo API Paga (Tratamento unificado com cache)
  if (returnDate && useLiveApi) {
    if (forceRefresh) {
      await FlightCache.deleteOne({ origin: originUpper, destination: destUpper, departureDate, returnDate });
    }
    const cached = forceRefresh ? null : await FlightCache.findOne({
      origin: originUpper,
      destination: destUpper,
      departureDate,
      returnDate
    });

    if (cached) {
      const isFresh = cached.scrapedAt >= freshThreshold;
      if (isFresh) {
        console.log(`[Cache Hit API] Retornando cache combinado de API: ${originUpper}-${destUpper}`);
        return cached.flights;
      } else {
        console.log(`[Cache Stale API] Cache combinado expirado. Revalidando API em background...`);
        revalidateLiveSearch(originUpper, destUpper, departureDate, returnDate);
        return cached.flights.map(f => ({ ...f, isStaleCache: true, cachedAt: cached.scrapedAt }));
      }
    }

    // Se não há cache, faz consulta real e salva
    console.log(`[Cache Miss API] Executando chamada SerpAPI combinada...`);
    try {
      const liveOffers = await searchGoogleFlights({ origin: originUpper, destination: destUpper, departureDate, returnDate });
      if (liveOffers && liveOffers.length > 0) {
        await FlightCache.findOneAndUpdate(
          { origin: originUpper, destination: destUpper, departureDate, returnDate },
          { flights: liveOffers, scrapedAt: new Date(), source: 'api', status: 'completed' },
          { upsert: true }
        );
        return liveOffers;
      }
      return [];
    } catch (err) {
      console.error(`[API Call Error] Falha na busca SerpAPI combinada:`, err.message);
      return [];
    }
  }

  // Caso 2: Modo Robô Econômico (Combina duas pernas raspadas de ida e volta)
  if (returnDate && !useLiveApi) {
    const outboundFlights = await resolveOneWayLeg(originUpper, destUpper, departureDate, useLiveApi, forceRefresh);
    const inboundFlights = await resolveOneWayLeg(destUpper, originUpper, returnDate, useLiveApi, forceRefresh);

    // Se alguma das pernas estiver raspando, retorna status de carregamento
    if (outboundFlights.status === 'scraping' || inboundFlights.status === 'scraping') {
      return {
        status: 'scraping',
        message: 'O robô está coletando voos de ida ou volta. Aguarde...'
      };
    }

    const paired = pairOneWayFlights(outboundFlights, inboundFlights, returnDate);
    
    // Propaga aviso de cache expirado se houver
    const isStale = outboundFlights.some(f => f.isStaleCache) || inboundFlights.some(f => f.isStaleCache);
    if (isStale) {
      return paired.map(f => ({ ...f, isStaleCache: true }));
    }
    return paired;
  }

  // Caso 3: Perna única (One-Way)
  return await resolveOneWayLeg(originUpper, destUpper, departureDate, useLiveApi, forceRefresh);
}

const TOLERANCE_VALUES = [0, 15, 30, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720, Infinity];

// 1. MODO 1: Busca de Voos Únicos (Simples)
export async function searchSingleFlights(params) {
  const {
    origin,
    destination,
    departureDate,
    returnDate,
    selectedAirlines,
    stopsFilter = 'all',
    hideTransfers = false,
    selectedDates,
    selectedReturnDates,
    sortBy = 'price',
    timeFilters = {},
    forceRefresh = false
  } = params;

  const originUpper = (origin || '').toUpperCase().trim();
  const destUpper = (destination || '').toUpperCase().trim();
  const airlinesList = selectedAirlines ? (Array.isArray(selectedAirlines) ? selectedAirlines : String(selectedAirlines).split(',')).filter(Boolean) : [];
  const datesList = selectedDates ? (Array.isArray(selectedDates) ? selectedDates : String(selectedDates).split(',')).filter(Boolean) : [];
  const returnDatesList = selectedReturnDates ? (Array.isArray(selectedReturnDates) ? selectedReturnDates : String(selectedReturnDates).split(',')).filter(Boolean) : [];
  const boolHideTransfers = hideTransfers === 'true' || hideTransfers === true;

  const searchHash = generateSearchHash({ mode: 'normal', origin: originUpper, destination: destUpper, departureDate, returnDate });

  if (forceRefresh) {
    console.log(`[Force Refresh] Limpando sessão e voos para hash ${searchHash}`);
    await SearchSession.deleteOne({ _id: searchHash });
    await FlightCache.deleteMany({ searchHash });
  }

  // 1. Tentar encontrar SearchSession ativa (< 2h)
  let session = forceRefresh ? null : await SearchSession.findById(searchHash);

  if (!session) {
    console.log(`[SearchSession Miss] Criando nova sessão de busca normal no Mongo: ${searchHash}`);
    session = await SearchSession.findOneAndUpdate(
      { _id: searchHash },
      {
        _id: searchHash,
        searchHash,
        mode: 'normal',
        origin1: originUpper,
        destination: destUpper,
        departureDate,
        returnDate: returnDate || null,
        status: 'pending',
        legs: [{ origin: originUpper, destination: destUpper, departureDate, returnDate: returnDate || null, person: 'p1', status: 'pending', offersCount: 0 }],
        totalOffersCount: 0,
        scrapedAt: new Date(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
      },
      { upsert: true, new: true }
    );

    triggerGithubScraper(originUpper, destUpper, departureDate, returnDate).catch(() => {});
  }

  // 2. Buscar ofertas em FlightCache vinculadas pelo searchHash ou rota equivalente
  const cachedDocs = await FlightCache.find({
    $or: [
      { searchHash },
      { origin: originUpper, destination: destUpper, departureDate, returnDate: returnDate || null }
    ]
  }).lean();

  const allFlights = [];
  cachedDocs.forEach(doc => {
    (doc.flights || []).forEach(flight => {
      const flightDepDate = flight.departureDate || departureDate;
      const flightRetDate = flight.returnDate || returnDate;

      if (datesList.length > 0 && !datesList.includes(flightDepDate)) return;
      if (returnDatesList.length > 0 && flightRetDate && !returnDatesList.includes(flightRetDate)) return;
      if (airlinesList.length > 0 && flight.airline?.code && !airlinesList.includes(flight.airline.code)) return;
      if (stopsFilter === 'direct' && (flight.stopsCount > 0 || (flight.returnStopsCount || 0) > 0)) return;
      if (stopsFilter === 'stops' && flight.stopsCount === 0 && (flight.returnStopsCount || 0) === 0) return;
      if (boolHideTransfers && (flight.hasAirportTransfer || flight.returnHasAirportTransfer)) return;

      const tf = timeFilters || {};
      if (!isTimeInWindow(flight.departureTime, tf.p1DepTimeMin, tf.p1DepTimeMax)) return;
      if (!isTimeInWindow(flight.arrivalTime, tf.p1ArrTimeMin, tf.p1ArrTimeMax)) return;
      if (!isTimeInWindow(flight.returnDepartureTime, tf.p1RetDepTimeMin, tf.p1RetDepTimeMax)) return;
      if (!isTimeInWindow(flight.returnArrivalTime, tf.p1RetArrTimeMin, tf.p1RetArrTimeMax)) return;

      allFlights.push({
        ...flight,
        origin: flight.origin || originUpper,
        destination: flight.destination || destUpper,
        departureDate: flightDepDate,
        returnDate: flightRetDate
      });
    });
  });

  allFlights.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));

  const isCompleted = session.status === 'completed';
  const completedLegsCount = session.legs.filter(l => l.status === 'completed').length;

  return {
    results: allFlights,
    status: session.status,
    isCompleted,
    completedCount: completedLegsCount,
    totalCount: session.legs.length,
    totalOffersFound: allFlights.length,
    legDetails: session.legs
  };
}

// 2. MODO 2: Fly Together (Voos Combinados: Origem 1 + Origem 2 -> Mesmo Destino)
export async function searchCombinedFlights(params) {
  const {
    origin1,
    origin2,
    destination,
    departureDate,
    returnDate,
    selectedAirlines,
    stopsFilter = 'all',
    hideTransfers = false,
    toleranceIndex,
    selectedDates,
    selectedReturnDates,
    sortBy = 'sincronia_total',
    timeFilters = {},
    forceRefresh = false
  } = params;

  const orig1Upper = (origin1 || '').toUpperCase().trim();
  const orig2Upper = (origin2 || '').toUpperCase().trim();
  const destUpper = (destination || '').toUpperCase().trim();
  const airlinesList = selectedAirlines ? (Array.isArray(selectedAirlines) ? selectedAirlines : String(selectedAirlines).split(',')).filter(Boolean) : [];
  const datesList = selectedDates ? (Array.isArray(selectedDates) ? selectedDates : String(selectedDates).split(',')).filter(Boolean) : [];
  const returnDatesList = selectedReturnDates ? (Array.isArray(selectedReturnDates) ? selectedReturnDates : String(selectedReturnDates).split(',')).filter(Boolean) : [];
  const boolHideTransfers = hideTransfers === 'true' || hideTransfers === true;

  const tIdx = parseInt(toleranceIndex);
  const toleranceMinutes = (!isNaN(tIdx) && TOLERANCE_VALUES[tIdx] !== undefined) ? TOLERANCE_VALUES[tIdx] : Infinity;

  const searchHash = generateSearchHash({ mode: 'flytogether', origin1: orig1Upper, origin2: orig2Upper, destination: destUpper, departureDate, returnDate });

  if (forceRefresh) {
    console.log(`[Force Refresh] Limpando sessão Fly Together e voos para hash ${searchHash}`);
    await SearchSession.deleteOne({ _id: searchHash });
    await FlightCache.deleteMany({ searchHash });
  }

  // 1. Tentar encontrar SearchSession ativa (< 2h)
  let session = forceRefresh ? null : await SearchSession.findById(searchHash);

  if (!session) {
    console.log(`[SearchSession Miss] Criando nova sessão de busca Fly Together no Mongo: ${searchHash}`);
    session = await SearchSession.findOneAndUpdate(
      { _id: searchHash },
      {
        _id: searchHash,
        searchHash,
        mode: 'flytogether',
        origin1: orig1Upper,
        origin2: orig2Upper,
        destination: destUpper,
        departureDate,
        returnDate: returnDate || null,
        status: 'pending',
        legs: [
          { origin: orig1Upper, destination: destUpper, departureDate, returnDate: returnDate || null, person: 'p1', status: 'pending', offersCount: 0 },
          { origin: orig2Upper, destination: destUpper, departureDate, returnDate: returnDate || null, person: 'p2', status: 'pending', offersCount: 0 }
        ],
        totalOffersCount: 0,
        scrapedAt: new Date(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
      },
      { upsert: true, new: true }
    );

    triggerGithubScraper(orig1Upper, destUpper, departureDate, returnDate).catch(() => {});
    triggerGithubScraper(orig2Upper, destUpper, departureDate, returnDate).catch(() => {});
  }

  // 2. Buscar ofertas em FlightCache vinculadas pelo searchHash
  const cachedDocs = await FlightCache.find({
    $or: [
      { searchHash },
      { origin: { $in: [orig1Upper, orig2Upper] }, destination: destUpper, departureDate, returnDate: returnDate || null }
    ]
  }).lean();

  const p1Array = [];
  const p2Array = [];

  cachedDocs.forEach(doc => {
    const isP2 = doc.person === 'p2' || doc.origin === orig2Upper;
    const targetArr = isP2 ? p2Array : p1Array;

    (doc.flights || []).forEach(flight => {
      targetArr.push({
        ...flight,
        origin: flight.origin || (isP2 ? orig2Upper : orig1Upper),
        destination: flight.destination || destUpper,
        departureDate: flight.departureDate || departureDate,
        returnDate: flight.returnDate || returnDate
      });
    });
  });

  const combinedResults = combineFlightsForCouple(p1Array, p2Array, toleranceMinutes, airlinesList, boolHideTransfers, stopsFilter, datesList, returnDatesList, timeFilters);

  const isCompleted = session.status === 'completed';
  const completedLegsCount = session.legs.filter(l => l.status === 'completed').length;

  return {
    results: combinedResults,
    status: session.status,
    isCompleted,
    completedCount: completedLegsCount,
    totalCount: session.legs.length,
    totalOffersFound: p1Array.length + p2Array.length,
    legDetails: session.legs
  };
}

function combineFlightsForCouple(p1Array, p2Array, toleranceMinutes, airlinesList = [], boolHideTransfers = false, stopsFilter = 'all', datesList = [], returnDatesList = [], timeFilters = {}, sortBy = 'sincronia_total') {
  const combinedResults = [];

  for (const f1 of p1Array) {
    for (const f2 of p2Array) {
      if (f1.departureDate === f2.departureDate && f1.returnDate === f2.returnDate) {
        const flightDepDate = f1.departureDate;
        const flightRetDate = f1.returnDate;

        if (datesList.length > 0 && !datesList.includes(flightDepDate)) continue;
        if (returnDatesList.length > 0 && flightRetDate && !returnDatesList.includes(flightRetDate)) continue;

        const code1 = f1.airline?.code;
        const code2 = f2.airline?.code;
        if (airlinesList.length > 0 && (!airlinesList.includes(code1) || !airlinesList.includes(code2))) continue;

        if (stopsFilter === 'direct') {
          if (f1.stopsCount > 0 || f2.stopsCount > 0 || (f1.returnStopsCount || 0) > 0 || (f2.returnStopsCount || 0) > 0) continue;
        } else if (stopsFilter === 'stops') {
          if (f1.stopsCount === 0 && f2.stopsCount === 0 && (f1.returnStopsCount || 0) === 0 && (f2.returnStopsCount || 0) === 0) continue;
        }

        if (boolHideTransfers) {
          if (f1.hasAirportTransfer || f1.returnHasAirportTransfer || f2.hasAirportTransfer || f2.returnHasAirportTransfer) continue;
        }

        const tf = timeFilters || {};
        if (!isTimeInWindow(f1.departureTime, tf.p1DepTimeMin, tf.p1DepTimeMax)) continue;
        if (!isTimeInWindow(f1.arrivalTime, tf.p1ArrTimeMin, tf.p1ArrTimeMax)) continue;
        if (!isTimeInWindow(f1.returnDepartureTime, tf.p1RetDepTimeMin, tf.p1RetDepTimeMax)) continue;
        if (!isTimeInWindow(f1.returnArrivalTime, tf.p1RetArrTimeMin, tf.p1RetArrTimeMax)) continue;

        if (!isTimeInWindow(f2.departureTime, tf.p2DepTimeMin, tf.p2DepTimeMax)) continue;
        if (!isTimeInWindow(f2.arrivalTime, tf.p2ArrTimeMin, tf.p2ArrTimeMax)) continue;
        if (!isTimeInWindow(f2.returnDepartureTime, tf.p2RetDepTimeMin, tf.p2RetDepTimeMax)) continue;
        if (!isTimeInWindow(f2.returnArrivalTime, tf.p2RetArrTimeMin, tf.p2RetArrTimeMax)) continue;

        const [h1, m1] = (f1.arrivalTime || '12:00').split(':').map(Number);
        const [h2, m2] = (f2.arrivalTime || '12:00').split(':').map(Number);
        const arrivalDeltaMinutes = Math.abs((h1 * 60 + m1) - (h2 * 60 + m2));

        if (toleranceMinutes !== Infinity) {
          let returnDepartureDelta = 0;
          let hasReturn = false;
          if (f1.returnDepartureTime && f2.returnDepartureTime) {
            const [rh1, rm1] = f1.returnDepartureTime.split(':').map(Number);
            const [rh2, rm2] = f2.returnDepartureTime.split(':').map(Number);
            returnDepartureDelta = Math.abs((rh1 * 60 + rm1) - (rh2 * 60 + rm2));
            hasReturn = true;
          }
          const averageDelta = hasReturn ? (arrivalDeltaMinutes + returnDepartureDelta) / 2 : arrivalDeltaMinutes;
          if (averageDelta > toleranceMinutes) continue;
        }

        const combinedPrice = (f1.totalPrice || 0) + (f2.totalPrice || 0);
        const hasPromo = f1.isMegaPromo || f2.isMegaPromo;
        const sharedStayMinutes = calculateSharedStayMinutes(f1, f2, f1.departureDate, f1.returnDate);
        const hours = Math.floor(sharedStayMinutes / 60);
        const mins = sharedStayMinutes % 60;
        const sharedStayFormatted = f1.returnDate ? `${hours}h ${mins}m` : 'N/A';

        combinedResults.push({
          id: `combined-${f1.id}-${f2.id}`,
          destination: f1.destination,
          departureDate: f1.departureDate,
          returnDate: f1.returnDate,
          person1: {
            origin: f1.origin,
            airline: f1.airline,
            departureTime: f1.departureTime,
            arrivalTime: f1.arrivalTime,
            returnDepartureTime: f1.returnDepartureTime,
            returnArrivalTime: f1.returnArrivalTime,
            returnDuration: f1.returnDuration,
            flightNumber: f1.flightNumber,
            airplane: f1.airplane,
            returnFlightNumber: f1.returnFlightNumber,
            returnAirplane: f1.returnAirplane,
            price: f1.totalPrice,
            isMegaPromo: f1.isMegaPromo,
            stopsCount: f1.stopsCount,
            stopsList: f1.stopsList || [],
            returnStopsCount: f1.returnStopsCount || 0,
            returnStopsList: f1.returnStopsList || [],
            hasAirportTransfer: f1.hasAirportTransfer,
            returnHasAirportTransfer: f1.returnHasAirportTransfer,
            bookingUrl: f1.bookingUrl
          },
          person2: {
            origin: f2.origin,
            airline: f2.airline,
            departureTime: f2.departureTime,
            arrivalTime: f2.arrivalTime,
            returnDepartureTime: f2.returnDepartureTime,
            returnArrivalTime: f2.returnArrivalTime,
            returnDuration: f2.returnDuration,
            flightNumber: f2.flightNumber,
            airplane: f2.airplane,
            returnFlightNumber: f2.returnFlightNumber,
            returnAirplane: f2.returnAirplane,
            price: f2.totalPrice,
            isMegaPromo: f2.isMegaPromo,
            stopsCount: f2.stopsCount,
            stopsList: f2.stopsList || [],
            returnStopsCount: f2.returnStopsCount || 0,
            returnStopsList: f2.returnStopsList || [],
            hasAirportTransfer: f2.hasAirportTransfer,
            returnHasAirportTransfer: f2.returnHasAirportTransfer,
            bookingUrl: f2.bookingUrl
          },
          combinedPrice,
          arrivalDeltaMinutes,
          isSynchronized: arrivalDeltaMinutes <= 60,
          hasPromo,
          sharedStayMinutes,
          sharedStayFormatted
        });
      }
    }
  }

  combinedResults.sort((a, b) => {
    if (sortBy === 'tempo_juntos') return (b.sharedStayMinutes || 0) - (a.sharedStayMinutes || 0);
    if (sortBy === 'price') return (a.combinedPrice || 0) - (b.combinedPrice || 0);
    if (sortBy === 'sincronia') return (a.arrivalDeltaMinutes || 0) - (b.arrivalDeltaMinutes || 0);
    return ((a.arrivalDeltaMinutes || 0) + (a.combinedPrice || 0) / 100) - ((b.arrivalDeltaMinutes || 0) + (b.combinedPrice || 0) / 100);
  });

  return combinedResults;
}
