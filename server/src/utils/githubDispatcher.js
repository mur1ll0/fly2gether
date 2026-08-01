import axios from 'axios';

// Trava em memória para evitar disparar dispatches em rajada num intervalo menor que 10 segundos
let lastDispatchTimestamp = 0;

/**
 * Dispara UMA ÚNICA execução em lote (1 Runner) no GitHub Actions para processar todas as pernas pendentes no MongoDB
 */
export async function triggerGithubScraper(origin = null, destination = null, departureDate = null, returnDate = null) {
  const token = process.env.GITHUB_PAT;
  const repo = process.env.GITHUB_REPO; // Format: "owner/repo"

  if (!token || !repo) {
    console.warn('⚠️ GITHUB_PAT ou GITHUB_REPO não configurado no .env. O disparo para o GitHub foi ignorado.');
    return false;
  }

  // Se um disparo foi feito nos últimos 10 segundos para esta instância, reutiliza o runner que já está rodando
  const now = Date.now();
  if (now - lastDispatchTimestamp < 10000) {
    console.log('ℹ️ [GitHub Dispatch] Um Runner já foi ativado recentemente (< 10s). Reutilizando a execução na nuvem.');
    return true;
  }
  lastDispatchTimestamp = now;

  try {
    const url = `https://api.github.com/repos/${repo}/dispatches`;
    const origStr = origin ? origin.toUpperCase() : 'BATCH';
    const destStr = destination ? destination.toUpperCase() : 'BATCH';
    console.log(`🌐 [GitHub Dispatch] Disparando 1 Runner Único no GitHub Actions para processar pernas de: ${origStr} ➔ ${destStr}`);

    await axios.post(
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

    console.log('✅ [GitHub Dispatch] 1 Runner em lote do GitHub Actions ativado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ [GitHub Dispatch] Erro ao disparar o GitHub Actions:', error.response?.data || error.message);
    return false;
  }
}
