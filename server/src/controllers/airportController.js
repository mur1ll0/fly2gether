import { AIRPORTS } from '../data/airports.js';

export function searchAirports(req, res) {
  const query = (req.query.q || '').trim().toLowerCase();

  if (!query) {
    // Return top popular airports if no query provided
    return res.json(AIRPORTS.slice(0, 15));
  }

  const results = AIRPORTS.filter(airport => {
    return (
      airport.iata.toLowerCase().includes(query) ||
      airport.city.toLowerCase().includes(query) ||
      airport.name.toLowerCase().includes(query) ||
      airport.country.toLowerCase().includes(query)
    );
  }).slice(0, 20);

  res.json(results);
}
