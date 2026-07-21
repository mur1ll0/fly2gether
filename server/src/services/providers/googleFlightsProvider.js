import axios from 'axios';

/**
 * Adaptador para consulta de dados de voos ao vivo do Google Flights via SerpAPI
 */
export async function searchGoogleFlights({ origin, destination, departureDate, returnDate }) {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    console.warn('⚠️ SERPAPI_KEY não encontrada no .env. Usando provedor de contingência.');
    return null;
  }

  try {
    const params = {
      engine: 'google_flights',
      departure_id: origin.toUpperCase(),
      arrival_id: destination.toUpperCase(),
      outbound_date: departureDate,
      return_date: returnDate || undefined,
      currency: 'BRL',
      hl: 'pt',
      api_key: apiKey
    };

    console.log(`🌐 Consultando Google Flights ao vivo: ${origin} ➔ ${destination} (${departureDate})...`);
    const response = await axios.get('https://serpapi.com/search.json', { params });
    const bestFlights = response.data?.best_flights || response.data?.other_flights || [];

    if (!bestFlights || bestFlights.length === 0) {
      return null;
    }

    const formatted = bestFlights.map((item, index) => {
      const firstLeg = item.flights?.[0] || {};
      const lastLeg = item.flights?.[item.flights.length - 1] || {};

      const airlineName = firstLeg.airline || 'Companhia Aérea';
      const airlineCode = firstLeg.airline_logo?.includes('LA') ? 'LA' : (firstLeg.airline_logo?.includes('G3') ? 'G3' : 'AD');
      const logoSymbol = airlineName.toLowerCase().includes('latam') ? '🔴' : (airlineName.toLowerCase().includes('gol') ? '🟠' : '🔵');

      const price = item.price || 450;
      const isMegaPromo = Boolean(item.type === 'Cheapest' || item.price_level === 'LOW');

      return {
        id: `gflight-${origin}-${destination}-${index}-${Date.now()}`,
        airline: {
          code: airlineCode,
          name: airlineName,
          logo: logoSymbol
        },
        origin,
        destination,
        departureDate,
        returnDate,
        departureTime: firstLeg.departure_token?.departure_time || firstLeg.departure_time || '08:00',
        arrivalTime: lastLeg.arrival_token?.arrival_time || lastLeg.arrival_time || '10:30',
        returnDepartureTime: returnDate ? '17:00' : null,
        returnArrivalTime: returnDate ? '19:30' : null,
        duration: item.total_duration ? `${Math.floor(item.total_duration / 60)}h ${item.total_duration % 60}m` : '2h 30m',
        outboundPrice: Math.round(price * 0.5),
        inboundPrice: returnDate ? Math.round(price * 0.5) : 0,
        totalPrice: price,
        isMegaPromo,
        promoTag: isMegaPromo ? '🔥 Tarifa Promocional Detectada no Google Flights' : null,
        provider: 'Google Flights (ao vivo)'
      };
    });

    return formatted;
  } catch (error) {
    console.error('❌ Erro na consulta ao Google Flights (SerpAPI):', error.response?.data || error.message);
    return null;
  }
}
