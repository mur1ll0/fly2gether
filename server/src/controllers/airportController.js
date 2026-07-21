import { searchGlobalAirports } from '../services/airportService.js';

export async function searchAirports(req, res) {
  try {
    const query = req.query.q || '';
    const results = await searchGlobalAirports(query);
    res.json(results);
  } catch (error) {
    console.error('Erro na busca de aeroportos:', error.message);
    res.status(500).json({ error: 'Erro ao buscar aeroportos.' });
  }
}
