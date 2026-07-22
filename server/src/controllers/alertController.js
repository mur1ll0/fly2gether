import Alert from '../models/Alert.js';
import { searchSingleFlights, searchCombinedFlights } from '../services/flightEngine.js';
import { sendPriceAlertEmail } from '../services/emailService.js';

// Memory fallback for demo without MongoDB connection
const memoryAlerts = [];

export async function createAlert(req, res) {
  try {
    const {
      mode = 'normal',
      origin1,
      origin2,
      destination,
      maxBudgetCombined,
      onlyWeekends = false,
      isVacation = false,
      vacationStart,
      vacationEnd,
      notifyEmail
    } = req.body;

    const email = notifyEmail || (req.user ? req.user.email : null);
    if (!email) {
      return res.status(400).json({ error: 'Informe um e-mail válido para receber notificações.' });
    }

    if (!origin1 || !destination) {
      return res.status(400).json({ error: 'Origem e Destino são obrigatórios.' });
    }

    const newAlertData = {
      userId: req.user ? req.user.id : null,
      mode,
      origin1,
      origin2: mode === 'flytogether' ? origin2 : null,
      destination,
      maxBudgetCombined: Number(maxBudgetCombined) || 2000,
      onlyWeekends: Boolean(onlyWeekends),
      isVacation: Boolean(isVacation),
      vacationStart,
      vacationEnd,
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

    res.status(201).json({ message: 'Alerta de preço cadastrado com sucesso!', alert: savedAlert });
  } catch (error) {
    console.error('Erro ao criar alerta:', error.message);
    res.status(500).json({ error: 'Não foi possível criar o alerta.' });
  }
}

export async function getUserAlerts(req, res) {
  try {
    let alerts = [];
    try {
      if (req.user) {
        alerts = await Alert.find({ userId: req.user.id }).sort({ createdAt: -1 });
      } else {
        alerts = memoryAlerts;
      }
    } catch (dbErr) {
      alerts = memoryAlerts;
    }
    res.json(alerts);
  } catch (error) {
    console.error('Erro ao buscar alertas:', error.message);
    res.status(500).json({ error: 'Erro ao buscar alertas de preço.' });
  }
}

export async function deleteAlert(req, res) {
  try {
    const { id } = req.params;
    try {
      await Alert.findByIdAndDelete(id);
    } catch (dbErr) {
      const idx = memoryAlerts.findIndex(a => a._id === id);
      if (idx !== -1) memoryAlerts.splice(idx, 1);
    }
    res.json({ message: 'Alerta removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar alerta:', error.message);
    res.status(500).json({ error: 'Erro ao deletar alerta.' });
  }
}

export async function checkAlertsNow() {
  console.log('🔄 Executando verificação de alertas de preço monitorados...');
  let alerts = [];
  try {
    alerts = await Alert.find({ active: true });
  } catch (dbErr) {
    alerts = memoryAlerts.filter(a => a.active);
  }

  for (const alert of alerts) {
    try {
      if (alert.mode === 'flytogether') {
        const results = await searchCombinedFlights({
          origin1: alert.origin1,
          origin2: alert.origin2,
          destination: alert.destination,
          onlyWeekends: alert.onlyWeekends,
          isVacation: alert.isVacation,
          vacationStart: alert.vacationStart,
          vacationEnd: alert.vacationEnd
        });

        if (Array.isArray(results) && results.length > 0) {
          const best = results[0];
          if (!alert.maxBudgetCombined || best.combinedPrice <= alert.maxBudgetCombined || best.hasPromo) {
            await sendPriceAlertEmail({
              recipientEmail: alert.notifyEmail,
              userName: 'Viajante Fly2Gether',
              alertDetails: alert,
              flightMatch: best
            });
          }
        }
      } else {
        const results = await searchSingleFlights({
          origin: alert.origin1,
          destination: alert.destination,
          onlyWeekends: alert.onlyWeekends,
          isVacation: alert.isVacation,
          vacationStart: alert.vacationStart,
          vacationEnd: alert.vacationEnd
        });

        if (Array.isArray(results) && results.length > 0) {
          const best = results[0];
          if (!alert.maxBudgetCombined || best.totalPrice <= alert.maxBudgetCombined || best.isMegaPromo) {
            await sendPriceAlertEmail({
              recipientEmail: alert.notifyEmail,
              userName: 'Viajante Fly2Gether',
              alertDetails: alert,
              flightMatch: best
            });
          }
        }
      }
    } catch (alertErr) {
      console.error(`Erro ao checar alerta ${alert._id}:`, alertErr.message);
    }
  }
}
