import axios from 'axios';
import { AIRPORTS } from '../data/airports.js';

// Cache para evitar requisições repetidas
const airportCache = new Map();

function normalizeText(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Busca de aeroportos globais via API online e base expandida
 */
export async function searchGlobalAirports(query) {
  const q = (query || '').trim().toLowerCase();

  if (!q) {
    return AIRPORTS.slice(0, 15);
  }

  if (airportCache.has(q)) {
    return airportCache.get(q);
  }

  const normalizedQ = normalizeText(q);

  // 1. Filtrar localmente na nossa base expandida
  const localMatches = AIRPORTS.filter(item => {
    return (
      normalizeText(item.iata).includes(normalizedQ) ||
      normalizeText(item.city).includes(normalizedQ) ||
      normalizeText(item.name).includes(normalizedQ) ||
      normalizeText(item.country).includes(normalizedQ)
    );
  });

  // Se já temos correspondência suficiente na base local expandida, retornar
  if (localMatches.length >= 5) {
    airportCache.set(q, localMatches.slice(0, 20));
    return localMatches.slice(0, 20);
  }

  // 2. Consultar API pública online de aeroportos (Air-Labs / AirportDB)
  try {
    const response = await axios.get(`https://airlabs.co/api/v9/cities?suggest=${encodeURIComponent(q)}&api_key=free`, {
      timeout: 3000
    });
    
    const apiCities = response.data?.response || [];
    const onlineMatches = apiCities.map(city => ({
      iata: city.code || city.city_code || q.toUpperCase(),
      name: `Aeroporto de ${city.name}`,
      city: city.name,
      state: city.state_code || '',
      country: city.country_code || 'Internacional'
    }));

    const combined = [...localMatches, ...onlineMatches];
    
    // Remover duplicatas de IATA
    const uniqueMap = new Map();
    combined.forEach(item => {
      if (!uniqueMap.has(item.iata)) {
        uniqueMap.set(item.iata, item);
      }
    });

    const finalResults = Array.from(uniqueMap.values()).slice(0, 25);
    airportCache.set(q, finalResults);
    return finalResults;
  } catch (error) {
    // Se a API externa falhar ou demorar, retorna a lista local
    return localMatches.slice(0, 20);
  }
}
