import axios from 'axios';

/**
 * Limpa e padroniza nomes de cidades e aeroportos para exibição amigável
 */
function getCleanCityName(name, id) {
  if (!name) return 'Conexão';
  let clean = name;

  // Remover termos comuns de aeroporto
  clean = clean.replace(/Aeroporto Internacional de /i, '');
  clean = clean.replace(/Aeroporto Internacional /i, '');
  clean = clean.replace(/Aeroporto de /i, '');
  clean = clean.replace(/Aeroporto /i, '');

  // Separar por hífen ou travessão (ex: "Brasília - Presidente Juscelino Kubitschek" -> "Brasília")
  if (clean.includes(' - ')) {
    clean = clean.split(' - ')[0];
  }
  if (clean.includes('–')) {
    clean = clean.split('–')[0];
  }
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts[0].length > 2 && parts[1]?.length > 8) {
      clean = parts[0];
    }
  }

  // Se contiver a sigla do IATA, remover
  clean = clean.replace(new RegExp(`\\s*\\(?${id}\\)?`, 'i'), '');

  // Tradução rápida de alguns aeroportos conhecidos
  const lower = clean.toLowerCase().trim();
  if (lower.includes('guarulhos') || lower.includes('congonhas')) return 'São Paulo';
  if (lower.includes('galeão') || lower.includes('santos dumont')) return 'Rio de Janeiro';
  if (lower.includes('viracopos')) return 'Campinas';
  if (lower.includes('confins')) return 'Belo Horizonte';

  return clean.trim();
}

/**
 * Consulta um trecho único de voo (One-Way)
 */
async function searchOneWayGoogleFlights({ origin, destination, departureDate, apiKey }) {
  try {
    const params = {
      engine: 'google_flights',
      departure_id: origin.toUpperCase(),
      arrival_id: destination.toUpperCase(),
      outbound_date: departureDate,
      type: '2', // One-way
      currency: 'BRL',
      gl: 'br',
      hl: 'pt',
      api_key: apiKey
    };

    console.log(`🌐 Consultando Google Flights ao vivo (Trecho Único): ${origin} ➔ ${destination} (Ida: ${departureDate})...`);
    const response = await axios.get('https://serpapi.com/search.json', { params });
    
    const bestFlights = response.data?.best_flights || [];
    const otherFlights = response.data?.other_flights || [];
    const allOffers = [...bestFlights, ...otherFlights];

    if (!allOffers || allOffers.length === 0) {
      return [];
    }

    const priceInsights = response.data?.price_insights || {};
    const lowestPrice = priceInsights.lowest_price || 0;
    
    const googleFlightsUrl = response.data?.search_metadata?.google_flights_url || 
      `https://www.google.com/travel/flights?hl=pt&gl=br&q=Voos%2520de%2520${origin.toUpperCase()}%20para%20${destination.toUpperCase()}%20em%20${departureDate}`;

    return allOffers.map((item, index) => {
      const flightsList = item.flights || [];
      const firstLeg = flightsList[0] || {};
      const lastLeg = flightsList[flightsList.length - 1] || {};

      const departureTime = firstLeg.departure_airport?.time || '08:00';
      const arrivalTime = lastLeg.arrival_airport?.time || '10:30';

      const stopsList = flightsList.slice(0, -1).map(leg => {
        const portId = leg.arrival_airport?.id || 'IATA';
        const rawName = leg.arrival_airport?.name || 'Aeroporto';
        return {
          city: getCleanCityName(rawName, portId),
          iata: portId,
          name: rawName
        };
      });

      // Detecção de troca de aeroporto (traslado) na conexão
      let hasAirportTransfer = false;
      for (let i = 0; i < flightsList.length - 1; i++) {
        if (flightsList[i].arrival_airport?.id !== flightsList[i+1].departure_airport?.id) {
          hasAirportTransfer = true;
        }
      }

      const totalDurationMin = flightsList.reduce((sum, leg) => sum + (leg.duration || 0), 0);
      const durationFormatted = `${Math.floor(totalDurationMin / 60)}h ${totalDurationMin % 60}m`;
      const flightNumber = flightsList.map(leg => leg.flight_number || leg.flight_id).filter(Boolean).join(', ') || 'LA3012';
      const airplane = flightsList.map(leg => leg.airplane || 'Airbus A320').filter(Boolean).join(' / ') || 'Airbus A320';

      const airlineName = firstLeg.airline || 'Companhia Aérea';
      const nameLower = airlineName.toLowerCase();
      
      let airlineCode = 'LA';
      if (nameLower.includes('gol')) {
        airlineCode = 'G3';
      } else if (nameLower.includes('azul')) {
        airlineCode = 'AD';
      } else if (nameLower.includes('latam')) {
        airlineCode = 'LA';
      } else if (nameLower.includes('tap')) {
        airlineCode = 'TP';
      } else if (nameLower.includes('copa')) {
        airlineCode = 'CM';
      } else if (nameLower.includes('avianca')) {
        airlineCode = 'AV';
      }

      const logoSymbol = firstLeg.airline_logo || `https://www.gstatic.com/flights/airline_logos/70px/${airlineCode}.png`;
      const totalPrice = item.price || 450;
      const extensionsStr = (item.extensions || []).join(' ').toLowerCase();
      const isMegaPromo = extensionsStr.includes('barato') || 
                         extensionsStr.includes('cheaper') || 
                         (lowestPrice > 0 && totalPrice <= lowestPrice * 1.05) ||
                         item.type === 'Cheapest';

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
        departureTime: departureTime.includes(' ') ? departureTime.split(' ')[1] : departureTime,
        arrivalTime: arrivalTime.includes(' ') ? arrivalTime.split(' ')[1] : arrivalTime,
        duration: durationFormatted,
        stopsCount: stopsList.length,
        stopsList,
        hasAirportTransfer,
        flightNumber,
        airplane,
        totalPrice,
        isMegaPromo,
        bookingUrl: googleFlightsUrl,
        provider: 'Google Flights (ao vivo)'
      };
    });
  } catch (error) {
    console.error(`❌ Erro no trecho único ${origin} ➔ ${destination}:`, error.message);
    return [];
  }
}

/**
 * Adaptador para consulta de dados de voos ao vivo do Google Flights via SerpAPI
 */
export async function searchGoogleFlights({ origin, destination, departureDate, returnDate, departureToken }) {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    console.warn('⚠️ SERPAPI_KEY não encontrada no .env.');
    return null;
  }

  try {
    const params = {
      engine: 'google_flights',
      api_key: apiKey,
      currency: 'BRL',
      gl: 'br',
      hl: 'pt'
    };

    if (departureToken) {
      params.departure_token = departureToken;
      params.departure_id = origin?.toUpperCase();
      params.arrival_id = destination?.toUpperCase();
      params.outbound_date = departureDate;
      params.return_date = returnDate;
      params.type = '1';
      console.log(`🌐 Consultando voos de volta via SerpAPI usando o departure_token...`);
    } else {
      params.departure_id = origin?.toUpperCase();
      params.arrival_id = destination?.toUpperCase();
      params.outbound_date = departureDate;
      if (returnDate) {
        params.return_date = returnDate;
        params.type = '1'; // Round trip (retorna voos com departure_token)
      } else {
        params.type = '2'; // One way
      }
    }

    const response = await axios.get('https://serpapi.com/search.json', { params });
    
    // Se for consulta de volta usando departure_token
    if (departureToken) {
      const bestFlights = response.data?.best_flights || response.data?.return_flights || [];
      const otherFlights = response.data?.other_flights || [];
      const allOffers = [...bestFlights, ...otherFlights];

      return allOffers.map((item, index) => {
        const flightsList = item.flights || [];
        const firstLeg = flightsList[0] || {};
        const lastLeg = flightsList[flightsList.length - 1] || {};

        const departureTime = firstLeg.departure_airport?.time || '08:00';
        const arrivalTime = lastLeg.arrival_airport?.time || '10:30';

        const stopsList = flightsList.slice(0, -1).map(leg => {
          const portId = leg.arrival_airport?.id || 'IATA';
          const rawName = leg.arrival_airport?.name || 'Aeroporto';
          return {
            city: getCleanCityName(rawName, portId),
            iata: portId,
            name: rawName
          };
        });

        let hasAirportTransfer = false;
        for (let i = 0; i < flightsList.length - 1; i++) {
          if (flightsList[i].arrival_airport?.id !== flightsList[i+1].departure_airport?.id) {
            hasAirportTransfer = true;
          }
        }

        const totalDurationMin = flightsList.reduce((sum, leg) => sum + (leg.duration || 0), 0);
        const durationFormatted = `${Math.floor(totalDurationMin / 60)}h ${totalDurationMin % 60}m`;
        const flightNumber = flightsList.map(leg => leg.flight_number || leg.flight_id).filter(Boolean).join(', ') || 'LA3012';
        const airplane = flightsList.map(leg => leg.airplane || 'Airbus A320').filter(Boolean).join(' / ') || 'Airbus A320';

        const airlineName = firstLeg.airline || 'Companhia Aérea';
        const nameLower = airlineName.toLowerCase();
        
        let airlineCode = 'LA';
        if (nameLower.includes('gol')) {
          airlineCode = 'G3';
        } else if (nameLower.includes('azul')) {
          airlineCode = 'AD';
        } else if (nameLower.includes('latam')) {
          airlineCode = 'LA';
        }

        const logoSymbol = firstLeg.airline_logo || `https://www.gstatic.com/flights/airline_logos/70px/${airlineCode}.png`;
        const totalPrice = item.price || 450;

        return {
          id: `gflight-return-${index}-${Date.now()}`,
          airline: {
            code: airlineCode,
            name: airlineName,
            logo: logoSymbol
          },
          origin: firstLeg.departure_airport?.id || origin,
          destination: lastLeg.arrival_airport?.id || destination,
          departureDate: firstLeg.departure_airport?.time ? firstLeg.departure_airport.time.split(' ')[0] : departureDate,
          departureTime: departureTime.includes(' ') ? departureTime.split(' ')[1] : departureTime,
          arrivalTime: arrivalTime.includes(' ') ? arrivalTime.split(' ')[1] : arrivalTime,
          duration: durationFormatted,
          stopsCount: stopsList.length,
          stopsList,
          hasAirportTransfer,
          flightNumber,
          airplane,
          totalPrice,
          bookingToken: item.booking_token || null,
          bookingUrl: response.data?.search_metadata?.google_flights_url || `https://www.google.com/travel/flights?hl=pt&gl=br&q=Voos%20de%2520${origin}%20para%2520${destination}`,
          provider: 'Google Flights (ao vivo)'
        };
      });
    }

    const bestFlights = response.data?.best_flights || [];
    const otherFlights = response.data?.other_flights || [];
    const outboundOffers = [...bestFlights, ...otherFlights];

    if (!outboundOffers || outboundOffers.length === 0) {
      return [];
    }

    const priceInsights = response.data?.price_insights || {};
    const lowestPrice = priceInsights.lowest_price || 0;
    const googleFlightsUrl = response.data?.search_metadata?.google_flights_url || 
      `https://www.google.com/travel/flights?hl=pt&gl=br&q=Voos%2520de%2520${origin?.toUpperCase()}%20para%20${destination?.toUpperCase()}`;

    // Se for ida e volta, buscamos automaticamente as voltas associadas à melhor ida em lote para montar o par
    if (returnDate) {
      console.log(`🌐 Buscando voos de retorno associados à melhor ida de forma combinada no servidor...`);
      const topOutbound = outboundOffers[0]; // A melhor ida encontrada

      if (topOutbound && topOutbound.departure_token) {
        const returnParams = {
          engine: 'google_flights',
          departure_id: origin.toUpperCase(),
          arrival_id: destination.toUpperCase(),
          outbound_date: departureDate,
          return_date: returnDate,
          type: '1',
          departure_token: topOutbound.departure_token,
          currency: 'BRL',
          gl: 'br',
          hl: 'pt',
          api_key: apiKey
        };

        const returnResponse = await axios.get('https://serpapi.com/search.json', { params: returnParams });
        const returnOffers = [
          ...(returnResponse.data?.best_flights || returnResponse.data?.return_flights || []),
          ...(returnResponse.data?.other_flights || [])
        ];

        // Retorna as combinações combinadas de ida e volta juntas para exibição do card unificado
        return returnOffers.map((retItem, index) => {
          const outLegs = topOutbound.flights || [];
          const retLegs = retItem.flights || [];

          const firstOut = outLegs[0] || {};
          const lastOut = outLegs[outLegs.length - 1] || {};
          const firstRet = retLegs[0] || {};
          const lastRet = retLegs[retLegs.length - 1] || {};

          const departureTime = firstOut.departure_airport?.time || '08:00';
          const arrivalTime = lastOut.arrival_airport?.time || '10:30';
          const returnDepartureTime = firstRet.departure_airport?.time || '17:30';
          const returnArrivalTime = lastRet.arrival_airport?.time || '20:00';

          const stopsList = outLegs.slice(0, -1).map(leg => {
            const portId = leg.arrival_airport?.id || 'IATA';
            const rawName = leg.arrival_airport?.name || 'Aeroporto';
            return {
              city: getCleanCityName(rawName, portId),
              iata: portId,
              name: rawName
            };
          });

          const returnStopsList = retLegs.slice(0, -1).map(leg => {
            const portId = leg.arrival_airport?.id || 'IATA';
            const rawName = leg.arrival_airport?.name || 'Aeroporto';
            return {
              city: getCleanCityName(rawName, portId),
              iata: portId,
              name: rawName
            };
          });

          let hasAirportTransfer = false;
          for (let i = 0; i < outLegs.length - 1; i++) {
            if (outLegs[i].arrival_airport?.id !== outLegs[i+1].departure_airport?.id) {
              hasAirportTransfer = true;
            }
          }

          let returnHasAirportTransfer = false;
          for (let i = 0; i < retLegs.length - 1; i++) {
            if (retLegs[i].arrival_airport?.id !== retLegs[i+1].departure_airport?.id) {
              returnHasAirportTransfer = true;
            }
          }

          const outDurationMin = outLegs.reduce((sum, leg) => sum + (leg.duration || 0), 0);
          const outDurationFormatted = `${Math.floor(outDurationMin / 60)}h ${outDurationMin % 60}m`;
          const retDurationMin = retLegs.reduce((sum, leg) => sum + (leg.duration || 0), 0);
          const retDurationFormatted = `${Math.floor(retDurationMin / 60)}h ${retDurationMin % 60}m`;

          const flightNumber = outLegs.map(leg => leg.flight_number || leg.flight_id).filter(Boolean).join(', ') || 'G3 1234';
          const returnFlightNumber = retLegs.map(leg => leg.flight_number || leg.flight_id).filter(Boolean).join(', ') || 'G3 5678';
          const airplane = outLegs.map(leg => leg.airplane || 'Airbus A320').filter(Boolean).join(' / ') || 'Airbus A320';
          const returnAirplane = retLegs.map(leg => leg.airplane || 'Airbus A320').filter(Boolean).join(' / ') || 'Airbus A320';

          const airlineName = firstOut.airline || 'Companhia Aérea';
          const nameLower = airlineName.toLowerCase();
          
          let airlineCode = 'LA';
          if (nameLower.includes('gol')) {
            airlineCode = 'G3';
          } else if (nameLower.includes('azul')) {
            airlineCode = 'AD';
          } else if (nameLower.includes('latam')) {
            airlineCode = 'LA';
          }

          const logoSymbol = firstOut.airline_logo || `https://www.gstatic.com/flights/airline_logos/70px/${airlineCode}.png`;
          const totalPrice = retItem.price || 450;
          const extensionsStr = (retItem.extensions || []).join(' ').toLowerCase();
          const isMegaPromo = extensionsStr.includes('barato') || 
                             extensionsStr.includes('cheaper') || 
                             (lowestPrice > 0 && totalPrice <= lowestPrice * 1.05) ||
                             retItem.type === 'Cheapest';

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

            // Ida (Outbound)
            departureTime: departureTime.includes(' ') ? departureTime.split(' ')[1] : departureTime,
            arrivalTime: arrivalTime.includes(' ') ? arrivalTime.split(' ')[1] : arrivalTime,
            duration: outDurationFormatted,
            stopsCount: stopsList.length,
            stopsList,
            hasAirportTransfer,
            flightNumber,
            airplane,

            // Volta (Inbound)
            returnDepartureTime: returnDepartureTime.includes(' ') ? returnDepartureTime.split(' ')[1] : returnDepartureTime,
            returnArrivalTime: returnArrivalTime.includes(' ') ? returnArrivalTime.split(' ')[1] : returnArrivalTime,
            returnDuration: retDurationFormatted,
            returnStopsCount: returnStopsList.length,
            returnStopsList,
            returnHasAirportTransfer,
            returnFlightNumber,
            returnAirplane,

            outboundPrice: Math.round(totalPrice * 0.5),
            inboundPrice: Math.round(totalPrice * 0.5),
            totalPrice,
            isMegaPromo,
            bookingToken: retItem.booking_token || null,
            bookingUrl: response.data?.search_metadata?.google_flights_url || `https://www.google.com/travel/flights?hl=pt&gl=br&q=Voos%20de%2520${origin}%20para%2520${destination}`,
            provider: 'Google Flights (ao vivo)'
          };
        });
      }
    }

    // Caso seja apenas Ida
    return outboundOffers.map((item, index) => {
      const flightsList = item.flights || [];
      const firstLeg = flightsList[0] || {};
      const lastLeg = flightsList[flightsList.length - 1] || {};

      const departureTime = firstLeg.departure_airport?.time || '08:00';
      const arrivalTime = lastLeg.arrival_airport?.time || '10:30';

      const stopsList = flightsList.slice(0, -1).map(leg => {
        const portId = leg.arrival_airport?.id || 'IATA';
        const rawName = leg.arrival_airport?.name || 'Aeroporto';
        return {
          city: getCleanCityName(rawName, portId),
          iata: portId,
          name: rawName
        };
      });

      let hasAirportTransfer = false;
      for (let i = 0; i < flightsList.length - 1; i++) {
        if (flightsList[i].arrival_airport?.id !== flightsList[i+1].departure_airport?.id) {
          hasAirportTransfer = true;
        }
      }

      const totalDurationMin = flightsList.reduce((sum, leg) => sum + (leg.duration || 0), 0);
      const durationFormatted = `${Math.floor(totalDurationMin / 60)}h ${totalDurationMin % 60}m`;
      const flightNumber = flightsList.map(leg => leg.flight_number || leg.flight_id).filter(Boolean).join(', ') || 'LA3012';
      const airplane = flightsList.map(leg => leg.airplane || 'Airbus A320').filter(Boolean).join(' / ') || 'Airbus A320';

      const airlineName = firstLeg.airline || 'Companhia Aérea';
      const nameLower = airlineName.toLowerCase();
      
      let airlineCode = 'LA';
      if (nameLower.includes('gol')) {
        airlineCode = 'G3';
      } else if (nameLower.includes('azul')) {
        airlineCode = 'AD';
      } else if (nameLower.includes('latam')) {
        airlineCode = 'LA';
      }

      const logoSymbol = firstLeg.airline_logo || `https://www.gstatic.com/flights/airline_logos/70px/${airlineCode}.png`;
      const totalPrice = item.price || 450;
      const extensionsStr = (item.extensions || []).join(' ').toLowerCase();
      const isMegaPromo = extensionsStr.includes('barato') || 
                         extensionsStr.includes('cheaper') || 
                         (lowestPrice > 0 && totalPrice <= lowestPrice * 1.05) ||
                         item.type === 'Cheapest';

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
        departureTime: departureTime.includes(' ') ? departureTime.split(' ')[1] : departureTime,
        arrivalTime: arrivalTime.includes(' ') ? arrivalTime.split(' ')[1] : arrivalTime,
        duration: durationFormatted,
        stopsCount: stopsList.length,
        stopsList,
        hasAirportTransfer,
        flightNumber,
        airplane,
        totalPrice,
        isMegaPromo,
        bookingUrl: googleFlightsUrl,
        provider: 'Google Flights (ao vivo)'
      };
    });

  } catch (error) {
    console.error('❌ Erro na consulta do Google Flights via SerpAPI:', error.message);
    return [];
  }
}

/**
 * Consulta a URL final do voo selecionado (Ida + Volta) contendo o deep link do checkout
 */
export async function getGoogleFlightsBookingUrl({ origin, destination, departureDate, returnDate, bookingToken }) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return null;

  try {
    const params = {
      engine: 'google_flights',
      departure_id: origin.toUpperCase(),
      arrival_id: destination.toUpperCase(),
      outbound_date: departureDate,
      return_date: returnDate,
      type: '1',
      booking_token: bookingToken,
      currency: 'BRL',
      gl: 'br',
      hl: 'pt',
      api_key: apiKey
    };

    console.log(`🌐 Buscando deep link de reserva no SerpAPI usando booking_token...`);
    const response = await axios.get('https://serpapi.com/search.json', { params });
    const bookingOptions = response.data?.booking_options || [];
    
    const firstOption = bookingOptions.find(opt => opt.booking_request?.url);
    if (firstOption) {
      return firstOption.booking_request.url;
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao obter URL de reserva via SerpAPI:', error.message);
    return null;
  }
}
