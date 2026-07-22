import axios from 'axios';

/**
 * Dispara uma execução do scraper de voos no GitHub Actions via repository_dispatch
 */
export async function triggerGithubScraper(origin, destination, departureDate, returnDate = null) {
  const token = process.env.GITHUB_PAT;
  const repo = process.env.GITHUB_REPO; // Format: "owner/repo"

  if (!token || !repo) {
    console.warn('⚠️ GITHUB_PAT ou GITHUB_REPO não configurado no .env. O disparo para o GitHub foi ignorado.');
    return false;
  }

  try {
    const url = `https://api.github.com/repos/${repo}/dispatches`;
    console.log(`🌐 [GitHub Dispatch] Disparando Actions para: ${origin.toUpperCase()} ➔ ${destination.toUpperCase()} | Ida: ${departureDate} | Volta: ${returnDate || 'N/A'}`);

    await axios.post(
      url,
      {
        event_type: 'scrape-route',
        client_payload: {
          origin: origin.toUpperCase(),
          destination: destination.toUpperCase(),
          departureDate,
          returnDate
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
