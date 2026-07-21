import { searchSingleFlights, searchCombinedFlights } from '../services/flightEngine.js';

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
      durationDays
    } = req.query;

    const boolWeekends = onlyWeekends === 'true' || onlyWeekends === true;
    const boolVacation = isVacation === 'true' || isVacation === true;
    const parsedDuration = parseInt(durationDays) || 4;

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
        durationDays: parsedDuration
      });

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
        durationDays: parsedDuration
      });

      return res.json({ mode: 'normal', total: results.length, results });
    }
  } catch (error) {
    console.error('Erro na busca de voos:', error.message);
    res.status(500).json({ error: 'Ocorreu um erro ao processar a busca de voos.' });
  }
}
