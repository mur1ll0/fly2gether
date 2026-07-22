import axios from 'axios';

/**
 * Dispara uma execução do scraper de voos no GitHub Actions via repository_dispatch
 */
export async function triggerGithubScraper(origin = null, destination = null, departureDate = null, returnDate = null) {
  const token = process.env.GITHUB_PAT;
  const repo = process.env.GITHUB_REPO; // Format: "owner/repo"

  if (!token || !repo) {
    console.warn('⚠️ GITHUB_PAT ou GITHUB_REPO não configurado no .env. O disparo para o GitHub foi ignorado.');
    return false;
  }

  try {
    const url = `https://api.github.com/repos/${repo}/dispatches`;
    const depStr = departureDate || 'N/A';
    const retStr = returnDate || 'N/A';
    const origStr = origin ? origin.toUpperCase() : 'ALL';
    const destStr = destination ? destination.toUpperCase() : 'ALL';
    console.log(`🌐 [GitHub Dispatch] Disparando Actions para: ${origStr} ➔ ${destStr} | Ida: ${depStr} | Volta: ${retStr}`);

    await axios.post(
      url,
      {
        event_type: 'scrape-route',
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

    console.log('✅ [GitHub Dispatch] GitHub Actions acionado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ [GitHub Dispatch] Erro ao disparar o GitHub Actions:', error.response?.data || error.message);
    return false;
  }
}
