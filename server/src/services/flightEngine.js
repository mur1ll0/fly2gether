import { isWeekendOrHolidayTravel, getHolidayInfo } from '../utils/holidays.js';
import { searchGoogleFlights } from './providers/googleFlightsProvider.js';
import { searchDuffelFlights } from './providers/duffelProvider.js';

// Base de preços aproximados por distância de rota (em BRL)
const BASE_DISTANCES = {
  'GRU-FLN': 280, 'SDU-FLN': 320, 'BSB-FLN': 450,
  'GRU-SSA': 420, 'SDU-SSA': 380, 'BSB-SSA': 350,
  'GRU-REC': 550, 'SDU-REC': 580, 'BSB-REC': 490,
  'GRU-MIA': 2400, 'SDU-MIA': 2600, 'BSB-MIA': 2300,
  'GRU-LIS': 3200, 'SDU-LIS': 3400, 'BSB-LIS': 3100
};

const AIRLINES = [
  { code: 'LA', name: 'LATAM Airlines', logo: '🔴', color: 'red' },
  { code: 'G3', name: 'GOL Linhas Aéreas', logo: '🟠', color: 'orange' },
  { code: 'AD', name: 'Azul Linhas Aéreas', logo: '🔵', color: 'blue' }
];

function getRouteBasePrice(origin, destination) {
  const key = `${origin.toUpperCase()}-${destination.toUpperCase()}`;
  const revKey = `${destination.toUpperCase()}-${origin.toUpperCase()}`;
  return BASE_DISTANCES[key] || BASE_DISTANCES[revKey] || 390;
}

function formatTime(hour, minute) {
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return `${h}:${m}`;
}

function generateCandidateDates(startDateStr, endDateStr, onlyWeekends, durationDays = 3) {
  const dates = [];
  const base = startDateStr ? new Date(startDateStr + 'T00:00:00') : new Date();

  if (!startDateStr && base < new Date()) {
    base.setDate(base.getDate() + 7);
  }

  const limitDays = endDateStr ? Math.min(60, Math.floor((new Date(endDateStr) - base) / (1000 * 60 * 60 * 24))) : 45;

  for (let i = 0; i <= limitDays; i++) {
    const dep = new Date(base);
    dep.setDate(dep.getDate() + i);

    const ret = new Date(dep);
    ret.setDate(ret.getDate() + durationDays);

    const depStr = dep.toISOString().split('T')[0];
    const retStr = ret.toISOString().split('T')[0];

    const check = isWeekendOrHolidayTravel(depStr, retStr);

    if (!onlyWeekends || check.isWeekendOrHoliday) {
      dates.push({
        departureDate: depStr,
        returnDate: retStr,
        isWeekendOrHoliday: check.isWeekendOrHoliday,
        holidayDetails: check.holidayDetails
      });
    }

    if (dates.length >= 12) break;
  }

  return dates;
}

// 1. MODO 1: Busca de Voos Simples (1 Origem -> 1 Destino)
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
  let datePairs = [];

  if (isVacation && vacationStart && vacationEnd) {
    datePairs = generateCandidateDates(vacationStart, vacationEnd, onlyWeekends, durationDays);
  } else if (departureDate) {
    datePairs = [{
      departureDate,
      returnDate: returnDate || null,
      isWeekendOrHoliday: isWeekendOrHolidayTravel(departureDate, returnDate).isWeekendOrHoliday,
      holidayDetails: getHolidayInfo(departureDate)
    }];
  } else {
    datePairs = generateCandidateDates(null, null, onlyWeekends, durationDays);
  }

  const providerPreference = process.env.FLIGHT_PROVIDER || 'googleflights';
  const results = [];

  for (const pair of datePairs) {
    let liveOffers = null;

    // Tentar provedores ao vivo se a chave estiver configurada
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

    // Se houver resposta da API ao vivo, adicionar com metadados de feriados
    if (liveOffers && liveOffers.length > 0) {
      liveOffers.forEach(flight => {
        results.push({
          ...flight,
          isWeekendOrHoliday: pair.isWeekendOrHoliday,
          holidayDetails: pair.holidayDetails
        });
      });
    } else {
      // Fallback: Engine Inteligente Local de Contingência
      const basePrice = getRouteBasePrice(origin, destination);
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

        results.push({
          id: `flight-${origin}-${destination}-${airline.code}-${pair.departureDate}`,
          airline,
          origin,
          destination,
          departureDate: pair.departureDate,
          returnDate: pair.returnDate,
          departureTime: formatTime(depHour, 15),
          arrivalTime: formatTime(arrHour, 45),
          returnDepartureTime: pair.returnDate ? formatTime(retDepHour, 10) : null,
          returnArrivalTime: pair.returnDate ? formatTime(retArrHour, 40) : null,
          duration: '2h 30m',
          outboundPrice: priceOutbound,
          inboundPrice: priceInbound,
          totalPrice,
          isMegaPromo,
          promoTag: isMegaPromo ? '🔥 Mega Promoção LATAM/GOL/Azul (-35%)' : null,
          isWeekendOrHoliday: pair.isWeekendOrHoliday,
          holidayDetails: pair.holidayDetails
        });
      }
    }
  }

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
  const person1Flights = await searchSingleFlights({
    origin: origin1,
    destination,
    departureDate,
    returnDate,
    onlyWeekends,
    isVacation,
    vacationStart,
    vacationEnd,
    durationDays
  });

  const person2Flights = await searchSingleFlights({
    origin: origin2,
    destination,
    departureDate,
    returnDate,
    onlyWeekends,
    isVacation,
    vacationStart,
    vacationEnd,
    durationDays
  });

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
            price: f1.totalPrice,
            isMegaPromo: f1.isMegaPromo
          },
          person2: {
            origin: origin2,
            airline: f2.airline,
            departureTime: f2.departureTime,
            arrivalTime: f2.arrivalTime,
            price: f2.totalPrice,
            isMegaPromo: f2.isMegaPromo
          },
          combinedPrice,
          arrivalDeltaMinutes,
          isSynchronized,
          hasPromo,
          isWeekendOrHoliday: f1.isWeekendOrHoliday,
          holidayDetails: f1.holidayDetails,
          matchScore: Math.round(100 - (arrivalDeltaMinutes / 2) - (combinedPrice / 50))
        });
      }
    }
  }

  combinedResults.sort((a, b) => {
    if (a.hasPromo && !b.hasPromo) return -1;
    if (!a.hasPromo && b.hasPromo) return 1;
    if (a.isSynchronized && !b.isSynchronized) return -1;
    return a.combinedPrice - b.combinedPrice;
  });

  return combinedResults;
}
