import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';

// Trava por chave em memória para evitar disparos em rajada num intervalo menor que 15 segundos
const activeDispatches = new Map();

/**
 * Dispara a execução no GitHub Actions ou Localmente para processar as pernas pendentes no MongoDB
 */
export async function triggerGithubScraper(origin = null, destination = null, departureDate = null, returnDate = null, searchHash = null) {
  const isLocalScraper = process.env.RUN_SCRAPER_LOCALLY === 'true';
  const dispatchKey = searchHash || `${origin || 'BATCH'}_${destination || ''}_${departureDate || ''}_${returnDate || ''}`;
  const now = Date.now();
  const lastTime = activeDispatches.get(dispatchKey) || 0;

  // Evita disparar rajadas duplicadas do mesmo lote em menos de 2 minutos (120s)
  if (now - lastTime < 120000) {
    console.log(`[CONFIG] ℹ️ Disparo recente (< 2m) para o lote [${dispatchKey}]. Reutilizando robô em andamento.`);
    return true;
  }

  activeDispatches.set(dispatchKey, now);

  // Se RUN_SCRAPER_LOCALLY === 'true', roda o cron-scraper localmente em background
  if (isLocalScraper) {
    console.log(`[CONFIG] 🚀 RUN_SCRAPER_LOCALLY=true. Executando scraper localmente em segundo plano...`);
    try {
      const scriptPath = path.resolve(process.cwd(), 'src/cron-scraper.js');
      const args = [scriptPath];
      if (origin && destination && departureDate) {
        args.push(origin, destination, departureDate);
        if (returnDate) args.push(returnDate);
      }

      const child = spawn(process.execPath, args, {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      console.log(`[CONFIG] ✅ Robô de raspagem local iniciado em background (PID: ${child.pid}).`);
      return true;
    } catch (localErr) {
      activeDispatches.delete(dispatchKey);
      console.error('[CONFIG] ❌ Erro ao disparar robô local:', localErr.message);
      return false;
    }
  }

  const token = process.env.GITHUB_PAT || process.env.GH_PAT || process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || process.env.GH_REPO || 'mur1ll0/fly2gether';

  console.log('[CONFIG] 🔍 Verificando credenciais e disponibilidade do robô de busca...');

  if (!token || !repo) {
    console.warn('[CONFIG] ⚠️ GITHUB_PAT ou GITHUB_REPO não configurado. O disparo para o robô foi ignorado.');
    return false;
  }

  try {
    const url = `https://api.github.com/repos/${repo}/dispatches`;
    const origStr = origin ? origin.toUpperCase() : 'BATCH';
    const destStr = destination ? destination.toUpperCase() : 'BATCH';
    console.log(`[CONFIG] 🌐 Conectando à nuvem para iniciar raspagem da rota: ${origStr} ➔ ${destStr}...`);

    const response = await axios.post(
      url,
      {
        event_type: 'scrape-batch',
        client_payload: {
          origin: origin ? origin.toUpperCase() : '',
          destination: destination ? destination.toUpperCase() : '',
          departureDate: departureDate || '',
          returnDate: returnDate || '',
          searchHash: searchHash || ''
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'Fly2Gether-App'
        },
        timeout: 8000
      }
    );

    activeDispatches.set(dispatchKey, Date.now());

    console.log(`[CONFIG] ✅ Conexão com GitHub Actions estabelecida com sucesso! Workflow de raspagem iniciado para ${origStr} ➔ ${destStr}. (Status API: ${response.status})`);
    return true;
  } catch (error) {
    activeDispatches.delete(dispatchKey); // Limpa para permitir nova tentativa em caso de falha HTTP
    console.error('[CONFIG] ❌ Falha na comunicação com a API do GitHub:', error.response?.data || error.message);
    return false;
  }
}
