import axios from 'axios';

let amadeusToken = null;
let tokenExpiresAt = 0;

export async function getAmadeusAccessToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null; // Retorna null se não houver chaves configuradas no .env
  }

  // Reusar token se ainda estiver válido
  if (amadeusToken && Date.now() < tokenExpiresAt) {
    return amadeusToken;
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    amadeusToken = response.data.access_token;
    tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;
    console.log('✅ Token de acesso da Amadeus API obtido com sucesso!');
    return amadeusToken;
  } catch (error) {
    console.error('❌ Erro ao autenticar na Amadeus API:', error.response?.data || error.message);
    return null;
  }
}

export async function fetchAmadeusFlightOffers({ origin, destination, departureDate, returnDate }) {
  const token = await getAmadeusAccessToken();
  if (!token) return null;

  try {
    const response = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        originLocationCode: origin.toUpperCase(),
        destinationLocationCode: destination.toUpperCase(),
        departureDate,
        returnDate: returnDate || undefined,
        adults: 1,
        max: 10
      }
    });
    return response.data?.data || null;
  } catch (error) {
    console.error('❌ Erro ao consultar voos na Amadeus API:', error.response?.data || error.message);
    return null;
  }
}
