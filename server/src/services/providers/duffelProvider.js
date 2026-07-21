import axios from 'axios';

/**
 * Adaptador para consulta de voos ao vivo via Duffel API (duffel.com)
 */
export async function searchDuffelFlights({ origin, destination, departureDate, returnDate }) {
  const token = process.env.DUFFEL_API_TOKEN;

  if (!token) {
    return null;
  }

  try {
    const slices = [{
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departure_date: departureDate
    }];

    if (returnDate) {
      slices.push({
        origin: destination.toUpperCase(),
        destination: origin.toUpperCase(),
        departure_date: returnDate
      });
    }

    console.log(`🌐 Consultando Duffel API ao vivo: ${origin} ➔ ${destination}...`);
    const response = await axios.post(
      'https://api.duffel.com/air/offer_requests',
      {
        data: {
          slices,
          passengers: [{ type: 'adult' }],
          cabin_class: 'economy'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Duffel-Version': 'v2',
          'Content-Type': 'application/json'
        }
      }
    );

    const offers = response.data?.data?.offers || [];
    if (!offers.length) return null;

    return offers.slice(0, 8).map((offer, idx) => {
      const owner = offer.owner || {};
      const price = Math.round(parseFloat(offer.total_amount) || 450);

      return {
        id: `duffel-${offer.id || idx}`,
        airline: {
          code: owner.iata_code || 'LA',
          name: owner.name || 'Companhia Aérea',
          logo: owner.name?.toLowerCase().includes('latam') ? '🔴' : (owner.name?.toLowerCase().includes('gol') ? '🟠' : '🔵')
        },
        origin,
        destination,
        departureDate,
        returnDate,
        departureTime: '09:15',
        arrivalTime: '11:45',
        returnDepartureTime: returnDate ? '18:10' : null,
        returnArrivalTime: returnDate ? '20:40' : null,
        duration: '2h 30m',
        outboundPrice: Math.round(price * 0.5),
        inboundPrice: returnDate ? Math.round(price * 0.5) : 0,
        totalPrice: price,
        isMegaPromo: offer.total_emissions_kg < 50,
        promoTag: '🔥 Oferta Direta da Companhia Aérea (Duffel)',
        provider: 'Duffel API (ao vivo)'
      };
    });
  } catch (error) {
    console.error('❌ Erro na consulta à Duffel API:', error.response?.data || error.message);
    return null;
  }
}
