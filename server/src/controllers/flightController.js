import axios from 'axios';
import { searchSingleFlights, searchCombinedFlights } from '../services/flightEngine.js';
import { searchGoogleFlights, getGoogleFlightsBookingUrl } from '../services/providers/googleFlightsProvider.js';

export async function handleSearchFlights(req, res) {
  try {
    const {
      mode = 'normal',
      origin,
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
      useLiveApi
    } = req.query;

    const boolWeekends = onlyWeekends === 'true' || onlyWeekends === true;
    const boolVacation = isVacation === 'true' || isVacation === true;
    const parsedDuration = parseInt(durationDays) || 4;
    const boolLive = useLiveApi === 'true' || useLiveApi === true;

    if (mode === 'flytogether') {
      const orig1 = origin1 || origin;
      if (!orig1 || !origin2 || !destination) {
        return res.status(400).json({ error: 'Para o modo Voos Combinados (Fly Together), informe Origem 1, Origem 2 e Destino.' });
      }

      const results = await searchCombinedFlights({
        origin1: orig1,
        origin2,
        destination,
        departureDate,
        returnDate,
        onlyWeekends: boolWeekends,
        isVacation: boolVacation,
        vacationStart,
        vacationEnd,
        durationDays: parsedDuration,
        useLiveApi: boolLive
      });

      if (results && results.status === 'scraping') {
        return res.json(results);
      }

      return res.json({ mode: 'flytogether', total: results.length, results });
    } else {
      if (!origin || !destination) {
        return res.status(400).json({ error: 'Informe Aeroporto de Origem e Destino.' });
      }

      const results = await searchSingleFlights({
        origin,
        destination,
        departureDate,
        returnDate,
        onlyWeekends: boolWeekends,
        isVacation: boolVacation,
        vacationStart,
        vacationEnd,
        durationDays: parsedDuration,
        useLiveApi: boolLive
      });

      if (results && results.status === 'scraping') {
        return res.json(results);
      }

      return res.json({ mode: 'normal', total: results.length, results });
    }
  } catch (error) {
    console.error('Erro na busca de voos:', error.message);
    res.status(500).json({ error: 'Ocorreu um erro ao processar a busca de voos.' });
  }
}

export async function handleSerpApiUsage(req, res) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return res.json({ enabled: false, searches_per_month: 0, this_month_usage: 0, total_searches_left: 0 });
  }

  try {
    const response = await axios.get('https://serpapi.com/account', {
      params: { api_key: apiKey },
      timeout: 4000
    });
    
    const data = response.data || {};
    res.json({
      enabled: true,
      searches_per_month: data.searches_per_month || 100,
      this_month_usage: data.this_month_usage || 0,
      total_searches_left: data.total_searches_left || 0,
      plan_name: data.plan_name || 'Free'
    });
  } catch (error) {
    console.error('Erro ao consultar cota da SerpAPI:', error.message);
    res.json({ enabled: true, error: 'Não foi possível consultar a cota no momento.' });
  }
}

export async function handleGetReturnFlights(req, res) {
  try {
    const { departure_token, origin, destination, departure_date, return_date } = req.query;
    if (!departure_token) {
      return res.status(400).json({ error: 'O parâmetro departure_token é obrigatório.' });
    }

    // Se for um token simulado (do fallback do simulador)
    if (departure_token.startsWith('mock-token-')) {
      const parts = departure_token.split('-');
      const originAirport = parts[2] || 'THE';
      const destAirport = parts[3] || 'GRU';
      const airlineCode = parts[4] || 'LA';
      
      const mockReturns = [
        {
          id: `mock-return-1-${Date.now()}`,
          airline: {
            code: airlineCode,
            name: airlineCode === 'LA' ? 'LATAM Airlines' : airlineCode === 'G3' ? 'GOL Linhas Aéreas' : 'Azul Linhas Aéreas',
            logo: `https://www.gstatic.com/flights/airline_logos/70px/${airlineCode}.png`
          },
          origin: destAirport, // Para a volta, origem e destino invertem
          destination: originAirport,
          departureDate: return_date || '2026-10-05',
          departureTime: '14:20',
          arrivalTime: '16:50',
          duration: '2h 30m',
          stopsCount: 0,
          stopsList: [],
          hasAirportTransfer: false,
          flightNumber: `${airlineCode} 4125`,
          airplane: 'Airbus A320neo',
          totalPrice: 420,
          isMegaPromo: false,
          bookingToken: `mock-booking-${airlineCode}-1`,
          provider: 'Simulador Fly2Gether'
        },
        {
          id: `mock-return-2-${Date.now()}`,
          airline: {
            code: airlineCode,
            name: airlineCode === 'LA' ? 'LATAM Airlines' : airlineCode === 'G3' ? 'GOL Linhas Aéreas' : 'Azul Linhas Aéreas',
            logo: `https://www.gstatic.com/flights/airline_logos/70px/${airlineCode}.png`
          },
          origin: destAirport,
          destination: originAirport,
          departureDate: return_date || '2026-10-05',
          departureTime: '19:15',
          arrivalTime: '21:45',
          duration: '2h 30m',
          stopsCount: 0,
          stopsList: [],
          hasAirportTransfer: false,
          flightNumber: `${airlineCode} 4230`,
          airplane: 'Boeing 737-800',
          totalPrice: 510,
          isMegaPromo: true,
          bookingToken: `mock-booking-${airlineCode}-2`,
          provider: 'Simulador Fly2Gether'
        }
      ];
      return res.json({ results: mockReturns });
    }

    const results = await searchGoogleFlights({ 
      departureToken: departure_token,
      origin,
      destination,
      departureDate: departure_date,
      returnDate: return_date
    });
    return res.json({ results });
  } catch (error) {
    console.error('Erro ao obter voos de volta:', error.message);
    res.status(500).json({ error: 'Erro ao buscar voos de volta.' });
  }
}

export async function handleGetBookingUrl(req, res) {
  try {
    const { booking_token, origin, destination, departure_date, return_date } = req.query;
    if (!booking_token) {
      return res.status(400).json({ error: 'O parâmetro booking_token é obrigatório.' });
    }

    // Se for token simulado
    if (booking_token.startsWith('mock-booking-') || booking_token.includes('mock')) {
      return res.json({ bookingUrl: `https://www.google.com/travel/flights?q=Voos%20de%20${origin}%20para%20${destination}` });
    }

    const url = await getGoogleFlightsBookingUrl({
      origin,
      destination,
      departureDate: departure_date,
      returnDate: return_date,
      bookingToken: booking_token
    });

    if (url) {
      return res.json({ bookingUrl: url });
    } else {
      // Fallback padrão se falhar
      return res.json({ bookingUrl: `https://www.google.com/travel/flights?q=Voos%20de%20${origin}%20para%20${destination}` });
    }
  } catch (error) {
    console.error('Erro ao obter booking url:', error.message);
    res.status(500).json({ error: 'Erro ao buscar deep link do voo.' });
  }
}
