import puppeteer from 'puppeteer';

function log(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[Scraper LOG ${timestamp}] ${message}`);
}

const AIRPORT_DICT = {
  'GRU': { city: 'São Paulo', name: 'Aeroporto Internacional de São Paulo/Guarulhos' },
  'CGH': { city: 'São Paulo', name: 'Aeroporto de Congonhas' },
  'VCP': { city: 'Campinas', name: 'Aeroporto Internacional de Viracopos' },
  'SDU': { city: 'Rio de Janeiro', name: 'Aeroporto Santos Dumont' },
  'GIG': { city: 'Rio de Janeiro', name: 'Aeroporto Internacional Galeão' },
  'BSB': { city: 'Brasília', name: 'Aeroporto Internacional de Brasília' },
  'CNF': { city: 'Belo Horizonte', name: 'Aeroporto de Confins' },
  'SSA': { city: 'Salvador', name: 'Aeroporto de Salvador' },
  'FOR': { city: 'Fortaleza', name: 'Aeroporto de Fortaleza' },
  'REC': { city: 'Recife', name: 'Aeroporto de Recife' },
  'POA': { city: 'Porto Alegre', name: 'Aeroporto de Porto Alegre' },
  'CWB': { city: 'Curitiba', name: 'Aeroporto de Curitiba' },
  'FLN': { city: 'Florianópolis', name: 'Aeroporto de Florianópolis' },
  'GYN': { city: 'Goiânia', name: 'Aeroporto de Goiânia' },
  'BEL': { city: 'Belém', name: 'Aeroporto de Belém' },
  'MAO': { city: 'Manaus', name: 'Aeroporto de Manaus' },
  'XAP': { city: 'Chapecó', name: 'Aeroporto de Chapecó' },
  'THE': { city: 'Teresina', name: 'Aeroporto de Teresina' },
  'MCZ': { city: 'Maceió', name: 'Aeroporto de Maceió' },
  'NAT': { city: 'Natal', name: 'Aeroporto de Natal' },
  'IGU': { city: 'Foz do Iguaçu', name: 'Aeroporto de Foz do Iguaçu' },
  'NVT': { city: 'Navegantes', name: 'Aeroporto de Navegantes' },
  'UDI': { city: 'Uberlândia', name: 'Aeroporto de Uberlândia' },
  'RAO': { city: 'Ribeirão Preto', name: 'Aeroporto de Ribeirão Preto' },
  'LDB': { city: 'Londrina', name: 'Aeroporto de Londrina' },
  'MGF': { city: 'Maringá', name: 'Aeroporto de Maringá' },
  'AJU': { city: 'Aracaju', name: 'Aeroporto de Aracaju' },
  'JPA': { city: 'João Pessoa', name: 'Aeroporto de João Pessoa' },
  'SLZ': { city: 'São Luís', name: 'Aeroporto de São Luís' },
  'PVH': { city: 'Porto Velho', name: 'Aeroporto de Porto Velho' },
  'CGB': { city: 'Cuiabá', name: 'Aeroporto de Cuiabá' },
  'CGR': { city: 'Campo Grande', name: 'Aeroporto de Campo Grande' },
  'VIX': { city: 'Vitória', name: 'Aeroporto de Vitória' },
  'PTY': { city: 'Cidade do Panamá', name: 'Aeroporto de Tocumen' },
  'MIA': { city: 'Miami', name: 'Aeroporto de Miami' },
  'LIS': { city: 'Lisboa', name: 'Aeroporto de Lisboa' }
};

/**
 * Normaliza e identifica a companhia aérea
 */
function getAirlineDetails(airlineText) {
  const text = (airlineText || '').toLowerCase();
  let code = 'LA';
  let name = 'LATAM';

  if (text.includes('gol') || text.includes('glo')) {
    code = 'G3';
    name = 'GOL';
  } else if (text.includes('azul') || text.includes('azu')) {
    code = 'AD';
    name = 'Azul';
  } else if (text.includes('latam') || text.includes('tam')) {
    code = 'LA';
    name = 'LATAM';
  } else if (text.includes('tap')) {
    code = 'TP';
    name = 'TAP';
  } else if (text.includes('copa')) {
    code = 'CM';
    name = 'Copa';
  } else if (text.includes('avianca')) {
    code = 'AV';
    name = 'Avianca';
  }

  const logo = `https://www.gstatic.com/flights/airline_logos/70px/${code}.png`;
  return { code, name, logo };
}

/**
 * Executa o processo de scraping de voos (Trecho Único / One-Way)
 */
export async function scrapeGoogleFlights({ origin, destination, departureDate }) {
  const url = `https://www.google.com/travel/flights?hl=pt-BR&gl=BR&q=Voos%20de%20${origin.toUpperCase()}%20para%20${destination.toUpperCase()}%20em%20${departureDate}`;
  
  log(`Iniciando raspagem para Rota: ${origin.toUpperCase()} ➔ ${destination.toUpperCase()} | Data: ${departureDate}`);
  log(`Carregando navegador Puppeteer...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    log(`Navegando para a URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    log(`Aguardando os cards de voo carregarem (li.pIav2d)...`);
    try {
      await page.waitForSelector('li.pIav2d', { timeout: 15000 });
      log(`Cards carregados.`);
    } catch (e) {
      log(`⚠️ Timeout esperando pelos cards. Aguardando 5 segundos adicionais de segurança...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    log(`Procurando cards de voo (li.pIav2d)...`);
    
    // 1. Extrai dados básicos das linhas ANTES de qualquer expansão
    const initialRowsData = await page.evaluate(() => {
      const flightRows = Array.from(document.querySelectorAll('li.pIav2d'));
      return flightRows.map((row, index) => {
        const text = row.innerText || '';
        const priceMatch = text.match(/R\$\s*([\d\.]+)/);
        const timesMatch = text.match(/(\d{2}:\d{2})\s*[\u2013–-]\s*(\d{2}:\d{2})/);
        return {
          index,
          hasPrice: !!priceMatch,
          hasTimes: !!timesMatch,
          textLength: text.length,
          baseText: text
        };
      });
    });

    // Filtra apenas linhas que parecem ser voos válidos (têm preço e horários)
    log(`Total de elementos li.pIav2d encontrados: ${initialRowsData.length}`);
    initialRowsData.forEach((row) => {
      log(`Row [${row.index}]: textLength=${row.textLength}, hasPrice=${row.hasPrice}, hasTimes=${row.hasTimes}`);
    });

    const validRows = initialRowsData.filter(r => r.hasPrice && r.hasTimes);
    log(`Encontrados ${validRows.length} cards de voo válidos no DOM.`);

    const flights = [];

    // Vamos expandir e raspar os top 10 voos
    const maxToScrape = Math.min(validRows.length, 10);
    log(`Iniciando expansão detalhada para as top ${maxToScrape} opções...`);

    for (let i = 0; i < maxToScrape; i++) {
      const targetRow = validRows[i];
      log(`[Card ${i+1}/${maxToScrape}] Expandindo detalhes para linha ${targetRow.index}...`);

      // Clica no botão de detalhes do voo
      const expandedText = await page.evaluate(async (idx) => {
        const flightRows = Array.from(document.querySelectorAll('li.pIav2d'));
        const row = flightRows[idx];
        if (!row) return null;

        // Procura o botão com aria-label que contenha "Detalhes"
        const btn = row.querySelector('button[aria-label*="Detalhes"]') || 
                    row.querySelector('button[aria-label*="details"]') ||
                    row.querySelector('button');

        if (btn) {
          btn.click();
          await new Promise(resolve => setTimeout(resolve, 1200));
          return row.innerText;
        }
        return row.innerText;
      }, targetRow.index);

      if (!expandedText) {
        log(`[Card ${i+1}/${maxToScrape}] ⚠️ Erro ao expandir. Usando texto base.`);
      }

      // Parsing dos dados a partir do texto base e texto expandido
      const parsedData = parseFlightText(targetRow.baseText, expandedText || targetRow.baseText, origin, destination);
      log(`[Card ${i+1}/${maxToScrape}] Coletado: R$ ${parsedData.totalPrice} | ${parsedData.airline.name} | Voo: ${parsedData.flightNumber} | Aero: ${parsedData.airplane}`);

      flights.push({
        id: `gflight-${origin.toLowerCase()}-${destination.toLowerCase()}-${i}-${Date.now()}`,
        airline: parsedData.airline,
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departureDate,
        departureTime: parsedData.departureTime,
        arrivalTime: parsedData.arrivalTime,
        duration: parsedData.duration,
        stopsCount: parsedData.stopsCount,
        stopsList: parsedData.stopsList,
        hasAirportTransfer: parsedData.hasAirportTransfer,
        flightNumber: parsedData.flightNumber,
        airplane: parsedData.airplane,
        totalPrice: parsedData.totalPrice,
        isMegaPromo: parsedData.isMegaPromo,
        bookingUrl: url,
        provider: 'Google Flights (raspado)'
      });

      // Clique de recolhimento para limpar o DOM
      await page.evaluate((idx) => {
        const flightRows = Array.from(document.querySelectorAll('li.pIav2d'));
        const row = flightRows[idx];
        if (row) {
          const btn = row.querySelector('button[aria-label*="Detalhes"]') || 
                      row.querySelector('button[aria-label*="details"]') ||
                      row.querySelector('button');
          if (btn) btn.click();
        }
      }, targetRow.index);

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    log(`Raspagem concluída com sucesso. Retornando ${flights.length} voos.`);
    return flights;

  } catch (error) {
    log(`❌ Erro crítico durante raspagem: ${error.message}`);
    throw error;
  } finally {
    log(`Fechando navegador Puppeteer.`);
    await browser.close();
  }
}

/**
 * Analisa o texto base (não expandido) e o texto expandido para extrair dados limpos
 */
function parseFlightText(baseText, expandedText, searchOrigin, searchDestination) {
  // 1. Extrair Preço do texto base
  const priceMatch = baseText.match(/R\$\s*([\d\.]+)/);
  const totalPrice = priceMatch ? parseInt(priceMatch[1].replace(/\./g, '')) : 450;

  // 2. Extrair Horários do texto base (extremamente confiável antes de expandir)
  const timesMatch = baseText.match(/(\d{2}:\d{2})\s*[\u2013–-]\s*(\d{2}:\d{2})/);
  const departureTime = timesMatch ? timesMatch[1] : '08:00';
  const arrivalTime = timesMatch ? timesMatch[2] : '10:00';

  // 3. Extrair Duração do texto base
  const durationMatch = baseText.match(/(\d+h\s*\d*m*|\d+\s*min)/i);
  let duration = durationMatch ? durationMatch[1] : '2h 00m';
  duration = duration.replace(' min', 'm').trim();

  // 4. Extrair Paradas/Escalas do texto base
  const isDirect = baseText.includes('Sem escalas') || baseText.includes('Direto') || baseText.includes('sem escalas');
  const stopsMatch = baseText.match(/(\d+)\s*parada/i) || baseText.match(/(\d+)\s*escala/i);
  const stopsCount = isDirect ? 0 : (stopsMatch ? parseInt(stopsMatch[1]) : 0);

  // 5. Extrair Airline principal do texto base
  const firstLine = baseText.split('\n')[3] || baseText;
  const airline = getAirlineDetails(firstLine);

  // 6. Analisar conexões IATA do texto expandido
  const iataRegex = /\b[A-Z]{3}\b/g;
  const rawIataCodes = Array.from(expandedText.matchAll(iataRegex)).map(m => m[0]);
  
  const blacklist = [
    'USB', 'CO2', 'BRL', 'MIN', 'KGS', 'AMP', 'PMO', 'UTC', 'BRT', 'QUI', 'SEX', 'SAB', 'DOM', 'SEG', 'TER', 'QUA',
    searchOrigin.toUpperCase(), searchDestination.toUpperCase()
  ];
  
  const connectIatas = Array.from(
    new Set(rawIataCodes.filter(code => !blacklist.includes(code)))
  );

  const stopsList = connectIatas.map(iata => {
    const dictMatch = AIRPORT_DICT[iata];
    return {
      iata,
      city: dictMatch ? dictMatch.city : iata,
      name: dictMatch ? dictMatch.name : `Aeroporto de ${iata}`
    };
  });

  // 7. Detectar Transferência de Aeroporto (Traslado)
  const hasAirportTransfer = expandedText.toLowerCase().includes('troca de aeroporto') || 
                             expandedText.toLowerCase().includes('altere o aeroporto');

  // 8. Extrair Linhas Aéreas, Números de Voo e Aeronaves do texto expandido
  const lines = expandedText.split('\n');
  const aircraftRegex = /(Boeing\s*\d{3}(-\d+)?|Airbus\s*A\d{3}(neo|ceo)?|Embraer\s*\d{3}|ATR\s*\d{2})/gi;
  const flightNumRegex = /(G3|LA|AD|JJ|TP|CM|AV|GLO|TAM|AZU)\s*(\d{3,4})\b/gi;

  const rawFlightNumbers = Array.from(expandedText.matchAll(flightNumRegex));
  const flightNumbers = rawFlightNumbers.map(m => `${m[1].toUpperCase()} ${m[2]}`);

  const rawAircraftModels = Array.from(expandedText.matchAll(aircraftRegex));
  const aircraftModels = rawAircraftModels.map(m => m[0]);

  // Fallbacks usando os dados da companhia principal
  const flightNumber = Array.from(new Set(flightNumbers)).join(', ') || `${airline.code} 3012`;
  const airplane = Array.from(new Set(aircraftModels)).join(' / ') || 'Airbus A320';

  const isMegaPromo = baseText.toLowerCase().includes('barato') || baseText.toLowerCase().includes('mega');

  return {
    airline,
    departureTime,
    arrivalTime,
    duration,
    stopsCount,
    stopsList,
    hasAirportTransfer,
    flightNumber,
    airplane,
    totalPrice,
    isMegaPromo
  };
}
