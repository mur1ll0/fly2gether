import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { connectDB } from './config/db.js';
import Alert from './models/Alert.js';
import FlightCache from './models/FlightCache.js';
import { scrapeGoogleFlights } from './services/providers/googleFlightsScraper.js';

// Carregar variáveis de ambiente
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

function log(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[CronScraper LOG ${timestamp}] ${message}`);
}

/**
 * Retorna datas de finais de semana prolongados ou normais (próximos 8 fins de semana)
 */
function getWeekendDates() {
  const dates = [];
  const today = new Date();
  const weekendsCount = parseInt(process.env.SCRAPER_WEEKENDS_COUNT) || 8;
  
  let weekendsFound = 0;
  for (let i = 0; i < 365 && weekendsFound < weekendsCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayOfWeek = d.getUTCDay(); // 0: Dom, 5: Sex, 6: Sáb

    if (dayOfWeek === 5) { // Sexta
      const fri = d.toISOString().split('T')[0];
      const sun = new Date(d); sun.setDate(d.getDate() + 2);
      const sunStr = sun.toISOString().split('T')[0];
      
      dates.push({ departureDate: fri, returnDate: sunStr });
      weekendsFound++;
    }
  }
  return dates;
}

/**
 * Retorna amostras de datas de férias comuns dentro do período
 */
function getVacationDates(start, end, duration) {
  const dates = [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  if (totalDays < duration) return [];

  // Amostragem com intervalo de 3 dias
  for (let i = 0; i <= totalDays - duration; i += 3) {
    const dep = new Date(startDate);
    dep.setDate(startDate.getDate() + i);
    const ret = new Date(dep);
    ret.setDate(dep.getDate() + duration);

    dates.push({
      departureDate: dep.toISOString().split('T')[0],
      returnDate: ret.toISOString().split('T')[0]
    });
  }
  return dates;
}

/**
 * Retorna amostragem flexível de datas futuras (60 dias) de 3 em 3 dias
 */
function getFlexibleDates() {
  const dates = [];
  const today = new Date();
  const daysAhead = parseInt(process.env.DEFAULT_SEARCH_DAYS_AHEAD) || 60;
  const stepDays = parseInt(process.env.DEFAULT_SEARCH_STEP_DAYS) || 3;
  const duration = 4; // Duração padrão de estadia

  const totalSteps = Math.ceil(daysAhead / stepDays);
  for (let i = 0; i < totalSteps; i++) {
    const dep = new Date(today);
    dep.setDate(today.getDate() + 1 + i * stepDays); // Começa a partir de amanhã
    const ret = new Date(dep);
    ret.setDate(dep.getDate() + duration);

    dates.push({
      departureDate: dep.toISOString().split('T')[0],
      returnDate: ret.toISOString().split('T')[0]
    });
  }
  return dates;
}

/**
 * Adiciona uma rota + data na lista de tarefas únicas
 */
function queueTask(tasks, origin, destination, departureDate) {
  if (!departureDate || !origin || !destination) return;
  
  const key = `${origin.toUpperCase()}-${destination.toUpperCase()}-${departureDate}`;
  if (!tasks.has(key)) {
    tasks.set(key, {
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate
    });
  }
}

/**
 * Processo principal de varredura
 */
async function runScraperJob() {
  log('Iniciando o Job do Scraper do Google Flights...');
  
  // Estabelece conexão com o MongoDB Atlas
  const db = await connectDB();
  if (!db) {
    log('⚠️ MongoDB não conectado. Encerrando execução.');
    process.exit(1);
  }

  const tasksMap = new Map();

  // Caso 1: Foi fornecido argumentos de CLI para busca específica (ex: repository_dispatch)
  const argOrigin = process.argv[2];
  const argDest = process.argv[3];
  const argDepDate = process.argv[4];
  const argRetDate = process.argv[5];

  if (argOrigin && argDest && argDepDate) {
    log(`Modo Direto: Raspando rota ${argOrigin} ➔ ${argDest} | Ida: ${argDepDate} | Volta: ${argRetDate || 'N/A'}`);
    queueTask(tasksMap, argOrigin, argDest, argDepDate);
    if (argRetDate) {
      // Inverte para a volta
      queueTask(tasksMap, argDest, argOrigin, argRetDate);
    }
  } else {
    // Caso 2: Execução agendada normal (Lê todos os alertas ativos no banco)
    log('Modo Agendado: Lendo alertas ativos do MongoDB...');
    const activeAlerts = await Alert.find({ active: true }).lean();
    log(`Encontrados ${activeAlerts.length} alertas ativos no banco.`);

    for (const alert of activeAlerts) {
      const mode = alert.mode || 'normal';
      const origins = mode === 'flytogether' ? [alert.origin1, alert.origin2] : [alert.origin1];
      const dest = alert.destination;

      for (const orig of origins) {
        if (!orig || !dest) continue;

        // Se o alerta tiver datas específicas fixas
        if (alert.vacationStart && !alert.isVacation && !alert.onlyWeekends) {
          queueTask(tasksMap, orig, dest, alert.vacationStart);
          if (alert.vacationEnd) {
            queueTask(tasksMap, dest, orig, alert.vacationEnd);
          }
        } 
        // Se for monitoramento de finais de semana
        else if (alert.onlyWeekends) {
          const weekendPairs = getWeekendDates();
          for (const pair of weekendPairs) {
            queueTask(tasksMap, orig, dest, pair.departureDate);
            queueTask(tasksMap, dest, orig, pair.returnDate);
          }
        }
        // Se for monitoramento de janela de férias
        else if (alert.isVacation && alert.vacationStart && alert.vacationEnd) {
          const vacationPairs = getVacationDates(alert.vacationStart, alert.vacationEnd, 4);
          for (const pair of vacationPairs) {
            queueTask(tasksMap, orig, dest, pair.departureDate);
            queueTask(tasksMap, dest, orig, pair.returnDate);
          }
        }
        // Se for monitoramento flexível geral (busca aberta nos próximos 60 dias)
        else {
          const flexPairs = getFlexibleDates();
          for (const pair of flexPairs) {
            queueTask(tasksMap, orig, dest, pair.departureDate);
            queueTask(tasksMap, dest, orig, pair.returnDate);
          }
        }
      }
    }
  }

  const tasks = Array.from(tasksMap.values());
  log(`Total de tarefas de perna única (one-way) compiladas na fila: ${tasks.length}`);

  let successCount = 0;
  let skippedCount = 0;
  let failureCount = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    log(`[Progresso ${i+1}/${tasks.length}] Processando: ${task.origin} ➔ ${task.destination} em ${task.departureDate}`);

    try {
      // 1. Checa se o cache no banco de dados já possui registro recente (< 24h)
      const freshThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existingCache = await FlightCache.findOne({
        origin: task.origin,
        destination: task.destination,
        departureDate: task.departureDate,
        scrapedAt: { $gte: freshThreshold }
      });

      if (existingCache) {
        log(`-> Cache fresco encontrado no MongoDB (coletado em ${existingCache.scrapedAt.toISOString()}). Pulando raspagem.`);
        skippedCount++;
        continue;
      }

      // 2. Executa a raspagem de voos
      const flightsList = await scrapeGoogleFlights({
        origin: task.origin,
        destination: task.destination,
        departureDate: task.departureDate
      });

      // 3. Salva ou atualiza os resultados no banco
      if (flightsList && flightsList.length > 0) {
        await FlightCache.findOneAndUpdate(
          {
            origin: task.origin,
            destination: task.destination,
            departureDate: task.departureDate
          },
          {
            flights: flightsList,
            scrapedAt: new Date(),
            source: 'scraper'
          },
          { upsert: true, new: true }
        );
        log(`-> Gravado/Atualizado com sucesso no MongoDB com ${flightsList.length} ofertas.`);
        successCount++;
      } else {
        log(`-> ⚠️ Nenhum voo retornado pela raspagem.`);
        failureCount++;
      }

      // Atraso preventivo de 4 segundos entre execuções para evitar CAPTCHAs
      log('Aguardando 4 segundos de atraso de cortesia...');
      await new Promise(resolve => setTimeout(resolve, 4000));

    } catch (taskErr) {
      log(`-> ❌ Falha ao processar tarefa: ${taskErr.message}`);
      failureCount++;
    }
  }

  log(`Job concluído. Sucessos: ${successCount}, Pulados: ${skippedCount}, Falhas: ${failureCount}`);
}

// Auto-execução ao rodar diretamente via terminal
const isMain = process.argv[1] && (process.argv[1].endsWith('cron-scraper.js') || process.argv[1].endsWith('cron-scraper'));
if (isMain) {
  runScraperJob()
    .then(async () => {
      log('Finalizado com sucesso.');
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        log('Conexão com o banco fechada.');
      }
      process.exit(0);
    })
    .catch(async (err) => {
      log(`Falha crítica na execução: ${err.message}`);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      process.exit(1);
    });
}
