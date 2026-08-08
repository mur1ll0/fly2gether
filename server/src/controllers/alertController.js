import Alert from '../models/Alert.js';
import { searchSingleFlights, searchCombinedFlights, isTimeInWindow } from '../services/flightEngine.js';
import { sendPriceAlertEmail } from '../services/emailService.js';

// Memory fallback para testes locais sem MongoDB
const memoryAlerts = [];

const TOLERANCE_VALUES = [15, 30, 45, 60, 120, 180, Infinity];

export async function createAlert(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Você precisa estar logado com a conta do Google para criar alertas.' });
    }

    const {
      mode = 'normal',
      origin1,
      origin1Name,
      origin2,
      origin2Name,
      destination,
      destinationName,
      departureDate,
      returnDate,
      maxBudgetCombined,
      onlyWeekends = false,
      isVacation = false,
      vacationStart,
      vacationEnd,
      durationDays = 4,
      sortBy,
      selectedAirlines,
      selectedDates,
      selectedReturnDates,
      timeFilters,
      stopsFilter,
      hideTransfers,
      toleranceIndex,
      notifyEmail
    } = req.body;

    const email = req.user.email || notifyEmail;
    if (!email) {
      return res.status(400).json({ error: 'Nenhum e-mail vinculado à conta para receber notificações.' });
    }

    if (!origin1 || !destination) {
      return res.status(400).json({ error: 'Origem e Destino são obrigatórios.' });
    }

    const newAlertData = {
      userId: req.user.id,
      mode,
      origin1,
      origin1Name,
      origin2: mode === 'flytogether' ? origin2 : null,
      origin2Name: mode === 'flytogether' ? origin2Name : null,
      destination,
      destinationName,
      departureDate,
      returnDate,
      maxBudgetCombined: Number(maxBudgetCombined) || 2000,
      onlyWeekends: Boolean(onlyWeekends),
      isVacation: Boolean(isVacation),
      vacationStart,
      vacationEnd,
      durationDays: Number(durationDays) || 4,
      sortBy: sortBy || (mode === 'flytogether' ? 'sincronia_total' : 'price'),
      selectedAirlines: Array.isArray(selectedAirlines) ? selectedAirlines : ['LA', 'G3', 'AD', 'TP', 'CM'],
      selectedDates: Array.isArray(selectedDates) ? selectedDates : [],
      selectedReturnDates: Array.isArray(selectedReturnDates) ? selectedReturnDates : [],
      timeFilters: timeFilters && typeof timeFilters === 'object' ? timeFilters : {},
      stopsFilter: stopsFilter || 'all',
      hideTransfers: Boolean(hideTransfers),
      toleranceIndex: toleranceIndex !== undefined ? Number(toleranceIndex) : 3,
      notifyEmail: email,
      active: true,
      createdAt: new Date()
    };

    let savedAlert = null;
    try {
      savedAlert = await Alert.create(newAlertData);
    } catch (dbErr) {
      console.warn('⚠️ Salvação do alerta no Mongoose falhou, salvando na memória:', dbErr.message);
      savedAlert = { _id: 'alert-' + Date.now(), ...newAlertData };
      memoryAlerts.push(savedAlert);
    }

    res.status(201).json({ message: 'Alerta de preço cadastrado e vinculado à sua conta com sucesso!', alert: savedAlert });
  } catch (error) {
    console.error('Erro ao criar alerta:', error.message);
    res.status(500).json({ error: 'Não foi possível criar o alerta.' });
  }
}

export async function getUserAlerts(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Sessão não autenticada. Faça login com o Google.' });
    }

    let alerts = [];
    try {
      alerts = await Alert.find({ userId: req.user.id }).sort({ createdAt: -1 });
    } catch (dbErr) {
      alerts = memoryAlerts.filter(a => String(a.userId) === String(req.user.id));
    }
    res.json(alerts);
  } catch (error) {
    console.error('Erro ao buscar alertas:', error.message);
    res.status(500).json({ error: 'Erro ao buscar alertas de preço.' });
  }
}

export async function deleteAlert(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Sessão não autenticada.' });
    }

    const { id } = req.params;
    try {
      await Alert.findOneAndDelete({ _id: id, userId: req.user.id });
    } catch (dbErr) {
      const idx = memoryAlerts.findIndex(a => a._id === id && String(a.userId) === String(req.user.id));
      if (idx !== -1) memoryAlerts.splice(idx, 1);
    }
    res.json({ message: 'Alerta removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar alerta:', error.message);
    res.status(500).json({ error: 'Erro ao deletar alerta.' });
  }
}

export async function checkAlertsNow() {
  console.log('🔄 Executando verificação de alertas de preço monitorados com filtros...');
  let alerts = [];
  try {
    alerts = await Alert.find({ active: true });
  } catch (dbErr) {
    alerts = memoryAlerts.filter(a => a.active);
  }

  for (const alert of alerts) {
    try {
      let results = [];
      if (alert.mode === 'flytogether') {
        results = await searchCombinedFlights({
          origin1: alert.origin1,
          origin2: alert.origin2,
          destination: alert.destination,
          departureDate: alert.departureDate,
          returnDate: alert.returnDate,
          onlyWeekends: alert.onlyWeekends,
          isVacation: alert.isVacation,
          vacationStart: alert.vacationStart,
          vacationEnd: alert.vacationEnd,
          durationDays: alert.durationDays,
          selectedDates: alert.selectedDates,
          selectedReturnDates: alert.selectedReturnDates,
          timeFilters: alert.timeFilters
        });
      } else {
        results = await searchSingleFlights({
          origin: alert.origin1,
          destination: alert.destination,
          departureDate: alert.departureDate,
          returnDate: alert.returnDate,
          onlyWeekends: alert.onlyWeekends,
          isVacation: alert.isVacation,
          vacationStart: alert.vacationStart,
          vacationEnd: alert.vacationEnd,
          durationDays: alert.durationDays,
          selectedDates: alert.selectedDates,
          selectedReturnDates: alert.selectedReturnDates,
          timeFilters: alert.timeFilters
        });
      }

      if (Array.isArray(results) && results.length > 0) {
        const selectedAirlines = alert.selectedAirlines && alert.selectedAirlines.length > 0 ? alert.selectedAirlines : null;
        const stopsFilter = alert.stopsFilter || 'all';
        const hideTransfers = alert.hideTransfers || false;
        const toleranceIndex = alert.toleranceIndex !== undefined ? alert.toleranceIndex : 3;
        const toleranceLimit = TOLERANCE_VALUES[toleranceIndex] ?? Infinity;

        // 1. Filtrar resultados conforme as configurações do alerta
        const filtered = results.filter(item => {
          // Filtro de Companhias Aéreas
          if (selectedAirlines) {
            if (alert.mode === 'flytogether') {
              const code1 = item.person1?.airline?.code;
              const code2 = item.person2?.airline?.code;
              if (!selectedAirlines.includes(code1) || !selectedAirlines.includes(code2)) return false;
            } else {
              const code = item.airline?.code;
              if (!selectedAirlines.includes(code)) return false;
            }
          }

          // Filtro de Escalas
          if (stopsFilter === 'direct') {
            if (alert.mode === 'flytogether') {
              if (
                item.person1?.stopsCount > 0 ||
                item.person2?.stopsCount > 0 ||
                (item.person1?.returnStopsCount || 0) > 0 ||
                (item.person2?.returnStopsCount || 0) > 0
              ) return false;
            } else {
              if (item.stopsCount > 0 || (item.returnStopsCount || 0) > 0) return false;
            }
          } else if (stopsFilter === 'stops') {
            if (alert.mode === 'flytogether') {
              if (
                item.person1?.stopsCount === 0 &&
                item.person2?.stopsCount === 0 &&
                (item.person1?.returnStopsCount || 0) === 0 &&
                (item.person2?.returnStopsCount || 0) === 0
              ) return false;
            } else {
              if (item.stopsCount === 0 && (item.returnStopsCount || 0) === 0) return false;
            }
          }

          // Filtro de Troca de Aeroporto
          if (hideTransfers) {
            if (alert.mode === 'flytogether') {
              if (
                item.person1?.hasAirportTransfer ||
                item.person1?.returnHasAirportTransfer ||
                item.person2?.hasAirportTransfer ||
                item.person2?.returnHasAirportTransfer
              ) return false;
            } else {
              if (item.hasAirportTransfer || item.returnHasAirportTransfer) return false;
            }
          }

          // Filtro de Datas de Ida e Volta Selecionadas
          if (alert.selectedDates && alert.selectedDates.length > 0) {
            const depDate = item.departureDate || item.person1?.departureDate;
            if (depDate && !alert.selectedDates.includes(depDate)) return false;
          }
          if (alert.selectedReturnDates && alert.selectedReturnDates.length > 0) {
            const retDate = item.returnDate || item.person1?.returnDate;
            if (retDate && !alert.selectedReturnDates.includes(retDate)) return false;
          }

          // Filtro de Janela de Horários
          const tf = alert.timeFilters || {};
          if (alert.mode === 'flytogether') {
            if (item.person1) {
              if (!isTimeInWindow(item.person1.departureTime, tf.p1DepTimeMin, tf.p1DepTimeMax)) return false;
              if (!isTimeInWindow(item.person1.arrivalTime, tf.p1ArrTimeMin, tf.p1ArrTimeMax)) return false;
              if (!isTimeInWindow(item.person1.returnDepartureTime, tf.p1RetDepTimeMin, tf.p1RetDepTimeMax)) return false;
              if (!isTimeInWindow(item.person1.returnArrivalTime, tf.p1RetArrTimeMin, tf.p1RetArrTimeMax)) return false;
            }
            if (item.person2) {
              if (!isTimeInWindow(item.person2.departureTime, tf.p2DepTimeMin, tf.p2DepTimeMax)) return false;
              if (!isTimeInWindow(item.person2.arrivalTime, tf.p2ArrTimeMin, tf.p2ArrTimeMax)) return false;
              if (!isTimeInWindow(item.person2.returnDepartureTime, tf.p2RetDepTimeMin, tf.p2RetDepTimeMax)) return false;
              if (!isTimeInWindow(item.person2.returnArrivalTime, tf.p2RetArrTimeMin, tf.p2RetArrTimeMax)) return false;
            }
          } else {
            if (!isTimeInWindow(item.departureTime, tf.p1DepTimeMin, tf.p1DepTimeMax)) return false;
            if (!isTimeInWindow(item.arrivalTime, tf.p1ArrTimeMin, tf.p1ArrTimeMax)) return false;
            if (!isTimeInWindow(item.returnDepartureTime, tf.p1RetDepTimeMin, tf.p1RetDepTimeMax)) return false;
            if (!isTimeInWindow(item.returnArrivalTime, tf.p1RetArrTimeMin, tf.p1RetArrTimeMax)) return false;
          }

          // Filtro de Tolerância de Horários no modo Fly Together
          if (alert.mode === 'flytogether' && toleranceLimit !== Infinity) {
            let returnDepartureDelta = 0;
            let hasReturn = false;
            if (item.person1?.returnDepartureTime && item.person2?.returnDepartureTime) {
              const [h1, m1] = item.person1.returnDepartureTime.split(':').map(Number);
              const [h2, m2] = item.person2.returnDepartureTime.split(':').map(Number);
              returnDepartureDelta = Math.abs((h1 * 60 + m1) - (h2 * 60 + m2));
              hasReturn = true;
            }
            const averageDelta = hasReturn ? (item.arrivalDeltaMinutes + returnDepartureDelta) / 2 : item.arrivalDeltaMinutes;
            if (averageDelta > toleranceLimit) return false;
          }

          return true;
        });

        // 2. Ordenar resultados filtrados conforme a preferência salva no alerta
        const sortBy = alert.sortBy || (alert.mode === 'flytogether' ? 'sincronia_total' : 'price');
        filtered.sort((a, b) => {
          if (sortBy === 'sincronia_total' && alert.mode === 'flytogether') {
            const getReturnDelta = (item) => {
              if (item.person1?.returnDepartureTime && item.person2?.returnDepartureTime) {
                const [h1, m1] = item.person1.returnDepartureTime.split(':').map(Number);
                const [h2, m2] = item.person2.returnDepartureTime.split(':').map(Number);
                return Math.abs((h1 * 60 + m1) - (h2 * 60 + m2));
              }
              return 0;
            };
            const totalDeltaA = a.arrivalDeltaMinutes + getReturnDelta(a);
            const totalDeltaB = b.arrivalDeltaMinutes + getReturnDelta(b);

            if (toleranceLimit !== Infinity) {
              if (a.combinedPrice !== b.combinedPrice) return a.combinedPrice - b.combinedPrice;
              return totalDeltaA - totalDeltaB;
            } else {
              if (totalDeltaA !== totalDeltaB) return totalDeltaA - totalDeltaB;
              return a.combinedPrice - b.combinedPrice;
            }
          } else if (sortBy === 'tempo_juntos' && alert.mode === 'flytogether') {
            if (b.sharedStayMinutes !== a.sharedStayMinutes) return b.sharedStayMinutes - a.sharedStayMinutes;
            return a.combinedPrice - b.combinedPrice;
          } else if (sortBy === 'price') {
            const priceA = alert.mode === 'flytogether' ? a.combinedPrice : a.totalPrice;
            const priceB = alert.mode === 'flytogether' ? b.combinedPrice : b.totalPrice;
            return priceA - priceB;
          } else if (sortBy === 'sincronia' && alert.mode === 'flytogether') {
            if (toleranceLimit !== Infinity) {
              if (a.combinedPrice !== b.combinedPrice) return a.combinedPrice - b.combinedPrice;
              return a.arrivalDeltaMinutes - b.arrivalDeltaMinutes;
            } else {
              return a.arrivalDeltaMinutes - b.arrivalDeltaMinutes;
            }
          } else if (sortBy === 'departureTime') {
            const timeA = alert.mode === 'flytogether' ? a.person1?.departureTime : a.departureTime;
            const timeB = alert.mode === 'flytogether' ? b.person1?.departureTime : b.departureTime;
            return (timeA || '').localeCompare(timeB || '');
          } else if (sortBy === 'duration') {
            const durA = alert.mode === 'flytogether' ? a.arrivalDeltaMinutes : parseInt(a.duration || '0');
            const durB = alert.mode === 'flytogether' ? b.arrivalDeltaMinutes : parseInt(b.duration || '0');
            return durA - durB;
          }
          return 0;
        });

        // 3. Verificar o melhor resultado pós-filtros e pós-ordenação
        if (filtered.length > 0) {
          const best = filtered[0];
          const bestPrice = alert.mode === 'flytogether' ? best.combinedPrice : best.totalPrice;
          const isPromo = best.hasPromo || best.isMegaPromo;

          if (!alert.maxBudgetCombined || bestPrice <= alert.maxBudgetCombined || isPromo) {
            await sendPriceAlertEmail({
              recipientEmail: alert.notifyEmail,
              userName: 'Viajante Fly2Gether',
              alertDetails: alert,
              flightMatch: best
            });

            if (alert._id) {
              try {
                await Alert.findByIdAndUpdate(alert._id, {
                  lastPriceFound: bestPrice,
                  lastCheckedAt: new Date()
                });
              } catch (e) {}
            }
          }
        }
      }
    } catch (alertErr) {
      console.error(`Erro ao checar alerta ${alert._id}:`, alertErr.message);
    }
  }
}
