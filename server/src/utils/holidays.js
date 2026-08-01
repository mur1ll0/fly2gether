// Gerador Dinâmico de Feriados Nacionais do Brasil (com cálculo astronômico da Páscoa Meeus/Butcher)

function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateStr(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Gera a lista de feriados nacionais brasileiros dinamicamente para um intervalo de anos
 */
export function getBrazilianHolidays(startYear = new Date().getFullYear(), endYear = new Date().getFullYear() + 2) {
  const holidays = [];

  for (let y = startYear; y <= endYear; y++) {
    // 1. Feriados Fixos
    holidays.push({ date: `${y}-01-01`, name: 'Ano Novo', isLongWeekend: true });
    holidays.push({ date: `${y}-04-21`, name: 'Tiradentes', isLongWeekend: true });
    holidays.push({ date: `${y}-05-01`, name: 'Dia do Trabalho', isLongWeekend: true });
    holidays.push({ date: `${y}-09-07`, name: 'Independência do Brasil', isLongWeekend: true });
    holidays.push({ date: `${y}-10-12`, name: 'Nossa Senhora Aparecida', isLongWeekend: true });
    holidays.push({ date: `${y}-11-02`, name: 'Finados', isLongWeekend: true });
    holidays.push({ date: `${y}-11-15`, name: 'Proclamação da República', isLongWeekend: true });
    holidays.push({ date: `${y}-11-20`, name: 'Dia da Consciência Negra', isLongWeekend: true });
    holidays.push({ date: `${y}-12-25`, name: 'Natal', isLongWeekend: true });

    // 2. Feriados Móveis baseados na Páscoa
    const easter = getEasterDate(y);

    const goodFriday = new Date(easter); goodFriday.setUTCDate(easter.getUTCDate() - 2);
    holidays.push({ date: formatDateStr(goodFriday), name: 'Sexta-feira Santa', isLongWeekend: true });

    const carnivalMon = new Date(easter); carnivalMon.setUTCDate(easter.getUTCDate() - 48);
    holidays.push({ date: formatDateStr(carnivalMon), name: 'Carnaval (Segunda)', isLongWeekend: true });

    const carnivalTue = new Date(easter); carnivalTue.setUTCDate(easter.getUTCDate() - 47);
    holidays.push({ date: formatDateStr(carnivalTue), name: 'Carnaval (Terça)', isLongWeekend: true });

    const corpusChristi = new Date(easter); corpusChristi.setUTCDate(easter.getUTCDate() + 60);
    holidays.push({ date: formatDateStr(corpusChristi), name: 'Corpus Christi', isLongWeekend: true });
  }

  return holidays;
}

export const BRAZIL_HOLIDAYS = getBrazilianHolidays();

export function getHolidayInfo(dateString) {
  const year = parseInt(dateString.split('-')[0], 10);
  const list = getBrazilianHolidays(year - 1, year + 1);
  return list.find(h => h.date === dateString) || null;
}

export function isWeekendOrHolidayTravel(departureDateStr, returnDateStr) {
  const depDate = new Date(departureDateStr + 'T00:00:00');
  const retDate = returnDateStr ? new Date(returnDateStr + 'T00:00:00') : null;

  const depDay = depDate.getDay();
  const retDay = retDate ? retDate.getDay() : null;

  const depHoliday = getHolidayInfo(departureDateStr);
  const retHoliday = returnDateStr ? getHolidayInfo(returnDateStr) : null;

  const validDeparture = depDay === 5 || depDay === 6 || (depHoliday && depHoliday.isLongWeekend);
  const validReturn = !retDate || retDay === 0 || retDay === 1 || (retHoliday && retHoliday.isLongWeekend);

  return {
    isWeekendOrHoliday: validDeparture && validReturn,
    holidayDetails: depHoliday || retHoliday || null
  };
}
