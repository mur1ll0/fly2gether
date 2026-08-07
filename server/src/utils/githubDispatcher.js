import axios from 'axios';

// Trava em memória para evitar disparar dispatches em rajada num intervalo menor que 10 segundos
let lastDispatchTimestamp = 0;

/**
 * Dispara UMA ÚNICA execução em lote (1 Runner) no GitHub Actions para processar todas as pernas pendentes no MongoDB
 */
export async function triggerGithubScraper(origin = null, destination = null, departureDate = null, returnDate = null) {
  const token = process.env.GITHUB_PAT || process.env.GH_PAT || process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || process.env.GH_REPO || 'mur1ll0/fly2gether';

  console.log('[CONFIG] 🔍 Verificando credenciais e disponibilidade do robô de busca...');

  if (!token || !repo) {
    console.warn('[CONFIG] ⚠️ GITHUB_PAT ou GITHUB_REPO não configurado. O disparo para o robô foi ignorado.');
    return false;
  }

  // Se um disparo foi feito nos últimos 4 minutos (240s), reutiliza o runner que já está rodando na nuvem
  const now = Date.now();
  if (now - lastDispatchTimestamp < 240000) {
    console.log('[CONFIG] ℹ️ Um robô de busca já foi ativado recentemente (< 4 min). Reutilizando a execução ativa na nuvem.');
    return true;
  }
  // Marca o timestamp síncrono imediatamente para bloquear chamadas simultâneas no mesmo ciclo
  lastDispatchTimestamp = now;

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
          returnDate: returnDate || ''
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'Fly2Gether-App'
        },
        timeout: 5000
      }
    );

    // Atualiza a trava de memória somente APÓS sucesso HTTP 2xx (status 204)
    lastDispatchTimestamp = Date.now();

    console.log(`[CONFIG] ✅ Conexão com GitHub Actions estabelecida com sucesso! Workflow de raspagem iniciado para ${origStr} ➔ ${destStr}. (Status API: ${response.status})`);
    return true;
  } catch (error) {
    console.error('[CONFIG] ❌ Falha na comunicação com o GitHub API:', error.response?.data || error.message);
    return false;
  }
}

