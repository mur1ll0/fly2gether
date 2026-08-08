import axios from 'axios';

// Trava por chave em memória para evitar disparos em rajada num intervalo menor que 30 segundos
const activeDispatches = new Map();

/**
 * Dispara a execução no GitHub Actions para processar as pernas pendentes no MongoDB
 */
export async function triggerGithubScraper(origin = null, destination = null, departureDate = null, returnDate = null, searchHash = null) {
  const token = process.env.GITHUB_PAT || process.env.GH_PAT || process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || process.env.GH_REPO || 'mur1ll0/fly2gether';

  console.log('[CONFIG] 🔍 Verificando credenciais e disponibilidade do robô de busca...');

  if (!token || !repo) {
    console.warn('[CONFIG] ⚠️ GITHUB_PAT ou GITHUB_REPO não configurado. O disparo para o robô foi ignorado.');
    return false;
  }

  const dispatchKey = searchHash || `${origin || 'BATCH'}_${destination || ''}_${departureDate || ''}_${returnDate || ''}`;
  const now = Date.now();
  const lastTime = activeDispatches.get(dispatchKey) || 0;

  // Evita disparar rajadas duplicadas do mesmo lote em menos de 30 segundos
  if (now - lastTime < 30000) {
    console.log(`[CONFIG] ℹ️ Disparo recente (< 30s) para o lote [${dispatchKey}]. Reutilizando robô em andamento.`);
    return true;
  }

  activeDispatches.set(dispatchKey, now);

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
