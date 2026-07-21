import { searchGoogleFlights } from './providers/googleFlightsProvider.js';
import { searchDuffelFlights } from './providers/duffelProvider.js';

// Lista de feriados nacionais do Brasil (2026 e 2027) para fins de emendas e finais de semana prolongados
const HOLIDAYS = [
  // 2026
  { date: '2026-01-01', name: 'Ano Novo' },
  { date: '2026-02-16', name: 'Carnaval (Segunda)' },
  { date: '2026-02-17', name: 'Carnaval (Terça)' },
  { date: '2026-04-03', name: 'Sexta-feira Santa' },
  { date: '2026-04-21', name: 'Tiradentes' },
  { date: '2026-05-01', name: 'Dia do Trabalho' },
  { date: '2026-06-04', name: 'Corpus Christi' },
  { date: '2026-09-07', name: 'Independência do Brasil' },
  { date: '2026-10-12', name: 'Nossa Senhora Aparecida' },
  { date: '2026-11-02', name: 'Finados' },
  { date: '2026-11-15', name: 'Proclamação da República' },
  { date: '2026-11-20', name: 'Dia da Consciência Negra' },
  { date: '2026-12-25', name: 'Natal' },
  // 2027
  { date: '2027-01-01', name: 'Ano Novo' },
  { date: '2027-02-08', name: 'Carnaval (Segunda)' },
  { date: '2027-02-09', name: 'Carnaval (Terça)' },
  { date: '2027-03-26', name: 'Sexta-feira Santa' },
  { date: '2027-04-21', name: 'Tiradentes' },
  { date: '2027-05-01', name: 'Dia do Trabalho' },
  { date: '2027-05-27', name: 'Corpus Christi' },
  { date: '2027-09-07', name: 'Independência do Brasil' },
  { date: '2027-10-12', name: 'Nossa Senhora Aparecida' },
  { date: '2027-11-02', name: 'Finados' },
  { date: '2027-11-15', name: 'Proclamação da República' },
  { date: '2027-11-20', name: 'Dia da Consciência Negra' },
  { date: '2027-12-25', name: 'Natal' }
];

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
  return HOLIDAYS.find(h => h.date === dateStr) || null;
}

/**
 * Retorna se a data é fim de semana (Sábado ou Domingo)
 */
function isWeekend(dateStr) {
  const day = new Date(dateStr).getUTCDay();
  return day === 0 || day === 6; // 0 = Domingo, 6 = Sábado
}

/**
 * Gera datas de finais de semana ou emendas de feriados
 */
function generateWeekendCandidateDates() {
  const candidates = [];
  const today = new Date();
  
  // Próximos 12 meses
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const holiday = getHolidayOnDate(dateStr);
    const dayOfWeek = d.getUTCDay(); // 0: Dom, 1: Seg, 2: Ter, 3: Qua, 4: Qui, 5: Sex, 6: Sáb

    // Caso 1: Feriado na Quinta-feira (Emenda na Sexta-feira)
    if (holiday && dayOfWeek === 4) {
      const fri = new Date(d); fri.setDate(d.getDate() + 1);
      const sat = new Date(d); sat.setDate(d.getDate() + 2);
      const sun = new Date(d); sun.setDate(d.getDate() + 3);
      
      candidates.push({
        departureDate: dateStr, // Partida no feriado (Quinta)
        returnDate: sun.toISOString().split('T')[0], // Retorno no Domingo
        isWeekendOrHoliday: true,
        holidayDetails: holiday
      });
    }

    // Caso 2: Feriado na Terça-feira (Emenda na Segunda-feira)
    if (holiday && dayOfWeek === 2) {
      const satPrev = new Date(d); satPrev.setDate(d.getDate() - 3);
      candidates.push({
        departureDate: satPrev.toISOString().split('T')[0], // Partida no Sábado anterior
        returnDate: dateStr, // Retorno no feriado (Terça)
        isWeekendOrHoliday: true,
        holidayDetails: holiday
      });
    }

    // Caso 3: Feriado na Sexta-feira ou Segunda-feira (Fim de semana prolongado)
    if (holiday && (dayOfWeek === 1 || dayOfWeek === 5)) {
      const dep = dayOfWeek === 5 ? dateStr : new Date(d).setDate(d.getDate() - 2);
      const ret = dayOfWeek === 1 ? dateStr : new Date(d).setDate(d.getDate() + 2);
      
      const depStr = typeof dep === 'string' ? dep : new Date(dep).toISOString().split('T')[0];
      const retStr = typeof ret === 'string' ? ret : new Date(ret).toISOString().split('T')[0];

      candidates.push({
        departureDate: depStr,
        returnDate: retStr,
        isWeekendOrHoliday: true,
        holidayDetails: holiday
      });
    }

    // Caso 4: Fim de semana padrão (Partida na Sexta/Sábado e Retorno no Domingo/Segunda)
    if (dayOfWeek === 5) { // Sexta
      const sat = new Date(d); sat.setDate(d.getDate() + 1);
      const sun = new Date(d); sun.setDate(d.getDate() + 2);
      const mon = new Date(d); mon.setDate(d.getDate() + 3);

      candidates.push({
        departureDate: dateStr, // Partida na Sexta
        returnDate: sun.toISOString().split('T')[0], // Retorno no Domingo
        isWeekendOrHoliday: true,
        holidayDetails: null
      });

      candidates.push({
        departureDate: sat.toISOString().split('T')[0], // Partida no Sábado
        returnDate: mon.toISOString().split('T')[0], // Retorno na Segunda
        isWeekendOrHoliday: true,
        holidayDetails: null
      });
    }
  }

  // Filtrar apenas candidatos futuros e remover duplicatas ordenando cronologicamente
  const unique = [];
  const seen = new Set();
  const todayStr = today.toISOString().split('T')[0];

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

// 1. MODO 1: Busca de Voos Únicos (Simples)
export async function searchSingleFlights({
  origin,
  destination,
  departureDate,
  returnDate,
  onlyWeekends = false,
  isVacation = false,
  vacationStart,
  vacationEnd,
  durationDays = 4
}) {
  const hasLiveApiKey = Boolean(process.env.SERPAPI_KEY || process.env.DUFFEL_API_TOKEN);
  const providerPreference = process.env.FLIGHT_PROVIDER || 'googleflights'; // 'googleflights' | 'duffel'

  // Geração de datas inteligência (flexibilidade)
  let candidateDates = [];
  if (!departureDate) {
    if (isVacation && vacationStart && vacationEnd) {
      candidateDates = generateVacationCandidateDates(vacationStart, vacationEnd, durationDays);
    } else if (onlyWeekends) {
      candidateDates = generateWeekendCandidateDates().slice(0, 4); // Pegar os próximos 4 finais de semana
    } else {
      // Amostragem padrão flexível: 6 datas de partida de 2 em 2 dias a partir de hoje
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      for (let i = 0; i < 6; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + 1 + i * 2);
        const depStr = d.toISOString().split('T')[0];

        let retStr = null;
        if (returnDate) {
          const r = new Date(d);
          r.setDate(d.getDate() + durationDays);
          retStr = r.toISOString().split('T')[0];
        }

        candidateDates.push({
          departureDate: depStr,
          returnDate: retStr,
          isWeekendOrHoliday: false,
          holidayDetails: null
        });
      }
    }
  } else {
    candidateDates = [{
      departureDate,
      returnDate: returnDate || null,
      isWeekendOrHoliday: onlyWeekends ? (isWeekend(departureDate) && (!returnDate || isWeekend(returnDate))) : false,
      holidayDetails: getHolidayOnDate(departureDate)
    }];
  }

  const results = [];

  // Executar buscas em paralelo para otimizar velocidade
  const searchPromises = candidateDates.map(async (pair) => {
    let liveOffers = null;

    if (hasLiveApiKey) {
      if (providerPreference === 'googleflights' || process.env.SERPAPI_KEY) {
        liveOffers = await searchGoogleFlights({
          origin,
          destination,
          departureDate: pair.departureDate,
          returnDate: pair.returnDate
        });
      }

      if (!liveOffers && (providerPreference === 'duffel' || process.env.DUFFEL_API_TOKEN)) {
        liveOffers = await searchDuffelFlights({
          origin,
          destination,
          departureDate: pair.departureDate,
          returnDate: pair.returnDate
        });
      }
    }

    if (liveOffers && liveOffers.length > 0) {
      return liveOffers.map(flight => ({
        ...flight,
        isWeekendOrHoliday: pair.isWeekendOrHoliday,
        holidayDetails: pair.holidayDetails
      }));
    } else {
      // Fallback: Simulador de contingência inteligente
      const basePrice = getRouteBasePrice(origin, destination);
      const mockOffers = [];
      
      for (const airline of AIRLINES) {
        const dayHash = (new Date(pair.departureDate).getDate() * 17 + airline.code.charCodeAt(0)) % 40;
        const isMegaPromo = dayHash < 10;
        const discount = isMegaPromo ? 0.35 : 0;

        const priceOutbound = Math.round((basePrice * (0.85 + (dayHash / 100))) * (1 - discount));
        const priceInbound = pair.returnDate ? Math.round((basePrice * (0.80 + (dayHash / 120))) * (1 - discount)) : 0;
        const totalPrice = priceOutbound + priceInbound;

        const depHour = 7 + (dayHash % 14);
        const arrHour = (depHour + 2) % 24;
        const retDepHour = 16 + (dayHash % 6);
        const retArrHour = (retDepHour + 2) % 24;

        // Gerar conexões realistas de simulador para origens pequenas (como XAP)
        const isXAP = origin.toUpperCase() === 'XAP';
        const stopsDetails = isXAP ? '1 escala em Campinas (VCP)' : 'Direto';
        const stopsCount = isXAP ? 1 : 0;
        const stopsList = isXAP ? [{ city: 'Campinas', iata: 'VCP', name: 'Aeroporto Internacional de Viracopos' }] : [];

        const fNumber = `${airline.code} ${3000 + (dayHash % 6000)}`;
        const retFNumber = pair.returnDate ? `${airline.code} ${4000 + (dayHash % 6000)}` : null;
        const airplaneModel = isXAP ? 'Boeing 737-800' : 'Airbus A320neo';

        const formatTime = (h, m) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        mockOffers.push({
          id: `mock-${origin}-${destination}-${airline.code}-${pair.departureDate}`,
          airline: {
            code: airline.code,
            name: airline.name,
            logo: `https://www.gstatic.com/flights/airline_logos/70px/${airline.code}.png`
          },
          origin,
          destination,
          departureDate: pair.departureDate,
          returnDate: pair.returnDate,
          departureTime: formatTime(depHour, 15),
          arrivalTime: formatTime(arrHour, 45),
          returnDepartureTime: pair.returnDate ? formatTime(retDepHour, 10) : null,
          returnArrivalTime: pair.returnDate ? formatTime(retArrHour, 40) : null,
          duration: isXAP ? '4h 15m' : '2h 30m',
          returnDuration: isXAP ? '4h 15m' : '2h 30m',
          flightNumber: fNumber,
          airplane: airplaneModel,
          returnFlightNumber: retFNumber,
          returnAirplane: pair.returnDate ? airplaneModel : null,
          outboundPrice: priceOutbound,
          inboundPrice: priceInbound,
          totalPrice,
          isMegaPromo,
          promoTag: isMegaPromo ? '🔥 Mega Promoção LATAM/GOL/Azul (-35%)' : null,
          isWeekendOrHoliday: pair.isWeekendOrHoliday,
          holidayDetails: pair.holidayDetails,
          stopsCount,
          stopsDetails,
          stopsList,
          returnStopsCount: stopsCount,
          returnStopsList: stopsList,
          departureToken: pair.returnDate ? `mock-token-${origin}-${destination}-${airline.code}-${pair.departureDate}` : null,
          bookingUrl: `https://www.google.com/travel/flights?q=Voos%20de%20${origin}%20para%20${destination}`,
          provider: 'Simulador Fly2Gether'
        });
      }
      return mockOffers;
    }
  });

  const resolvedBatches = await Promise.all(searchPromises);
  resolvedBatches.forEach(batch => {
    if (batch) results.push(...batch);
  });

  results.sort((a, b) => {
    if (a.isMegaPromo && !b.isMegaPromo) return -1;
    if (!a.isMegaPromo && b.isMegaPromo) return 1;
    if (onlyWeekends && a.isWeekendOrHoliday && !b.isWeekendOrHoliday) return -1;
    return a.totalPrice - b.totalPrice;
  });

  return results;
}

// 2. MODO 2: Fly Together (Voos Combinados: Origem 1 + Origem 2 -> Mesmo Destino)
export async function searchCombinedFlights({
  origin1,
  origin2,
  destination,
  departureDate,
  returnDate,
  onlyWeekends = false,
  isVacation = false,
  vacationStart,
  vacationEnd,
  durationDays = 4
}) {
  const [person1Flights, person2Flights] = await Promise.all([
    searchSingleFlights({
      origin: origin1,
      destination,
      departureDate,
      returnDate,
      onlyWeekends,
      isVacation,
      vacationStart,
      vacationEnd,
      durationDays
    }),
    searchSingleFlights({
      origin: origin2,
      destination,
      departureDate,
      returnDate,
      onlyWeekends,
      isVacation,
      vacationStart,
      vacationEnd,
      durationDays
    })
  ]);

  const combinedResults = [];

  for (const f1 of person1Flights) {
    for (const f2 of person2Flights) {
      if (f1.departureDate === f2.departureDate && f1.returnDate === f2.returnDate) {
        const combinedPrice = f1.totalPrice + f2.totalPrice;

        const [h1, m1] = f1.arrivalTime.split(':').map(Number);
        const [h2, m2] = f2.arrivalTime.split(':').map(Number);
        const arrivalDeltaMinutes = Math.abs((h1 * 60 + m1) - (h2 * 60 + m2));

        const isSynchronized = arrivalDeltaMinutes <= 60;
        const hasPromo = f1.isMegaPromo || f2.isMegaPromo;

        // Calcular tempo compartilhado juntos no destino (em minutos)
        const sharedStayMinutes = calculateSharedStayMinutes(f1, f2, f1.departureDate, f1.returnDate);
        const hours = Math.floor(sharedStayMinutes / 60);
        const mins = sharedStayMinutes % 60;
        const sharedStayFormatted = f1.returnDate ? `${hours}h ${mins}m` : 'N/A';

        combinedResults.push({
          id: `combined-${f1.id}-${f2.id}`,
          destination,
          departureDate: f1.departureDate,
          returnDate: f1.returnDate,
          person1: {
            origin: origin1,
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
            stopsDetails: f1.stopsDetails,
            stopsCount: f1.stopsCount,
            stopsList: f1.stopsList || [],
            returnStopsCount: f1.returnStopsCount || 0,
            returnStopsList: f1.returnStopsList || [],
            hasAirportTransfer: f1.hasAirportTransfer,
            bookingUrl: f1.bookingUrl
          },
          person2: {
            origin: origin2,
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
            stopsDetails: f2.stopsDetails,
            stopsCount: f2.stopsCount,
            stopsList: f2.stopsList || [],
            returnStopsCount: f2.returnStopsCount || 0,
            returnStopsList: f2.returnStopsList || [],
            hasAirportTransfer: f2.hasAirportTransfer,
            bookingUrl: f2.bookingUrl
          },
          combinedPrice,
          arrivalDeltaMinutes,
          isSynchronized,
          hasPromo,
          sharedStayMinutes,
          sharedStayFormatted,
          isWeekendOrHoliday: f1.isWeekendOrHoliday,
          holidayDetails: f1.holidayDetails,
          matchScore: Math.round(100 - (arrivalDeltaMinutes / 2) - (combinedPrice / 50))
        });
      }
    }
  }

  // Ordenação Padrão Fly Together: Maximo de tempo juntos no destino, e em seguida menor preço combinado
  combinedResults.sort((a, b) => {
    if (b.sharedStayMinutes !== a.sharedStayMinutes) {
      return b.sharedStayMinutes - a.sharedStayMinutes;
    }
    return a.combinedPrice - b.combinedPrice;
  });

  return combinedResults;
}
