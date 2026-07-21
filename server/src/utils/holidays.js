// Tabela de Feriados Nacionais do Brasil (2026 e 2027) e identificador de feriados prolongados
export const BRAZIL_HOLIDAYS = [
  // 2026
  { date: '2026-01-01', name: 'Confraternização Universal (Ano Novo)', dayOfWeek: 'Quinta-feira', isLongWeekend: true },
  { date: '2026-02-16', name: 'Carnaval (Segunda)', dayOfWeek: 'Segunda-feira', isLongWeekend: true },
  { date: '2026-02-17', name: 'Carnaval (Terça)', dayOfWeek: 'Terça-feira', isLongWeekend: true },
  { date: '2026-04-03', name: 'Sexta-feira Santa', dayOfWeek: 'Sexta-feira', isLongWeekend: true },
  { date: '2026-04-21', name: 'Tiradentes', dayOfWeek: 'Terça-feira', isLongWeekend: true },
  { date: '2026-05-01', name: 'Dia do Trabalhador', dayOfWeek: 'Sexta-feira', isLongWeekend: true },
  { date: '2026-06-04', name: 'Corpus Christi', dayOfWeek: 'Quinta-feira', isLongWeekend: true },
  { date: '2026-09-07', name: 'Independência do Brasil', dayOfWeek: 'Segunda-feira', isLongWeekend: true },
  { date: '2026-10-12', name: 'Nossa Senhora Aparecida', dayOfWeek: 'Segunda-feira', isLongWeekend: true },
  { date: '2026-11-02', name: 'Finados', dayOfWeek: 'Segunda-feira', isLongWeekend: true },
  { date: '2026-11-15', name: 'Proclamação da República', dayOfWeek: 'Domingo', isLongWeekend: false },
  { date: '2026-11-20', name: 'Dia da Consciência Negra', dayOfWeek: 'Sexta-feira', isLongWeekend: true },
  { date: '2026-12-25', name: 'Natal', dayOfWeek: 'Sexta-feira', isLongWeekend: true },

  // 2027
  { date: '2027-01-01', name: 'Confraternização Universal', dayOfWeek: 'Sexta-feira', isLongWeekend: true },
  { date: '2027-02-08', name: 'Carnaval', dayOfWeek: 'Segunda-feira', isLongWeekend: true },
  { date: '2027-03-26', name: 'Sexta-feira Santa', dayOfWeek: 'Sexta-feira', isLongWeekend: true },
  { date: '2027-04-21', name: 'Tiradentes', dayOfWeek: 'Quarta-feira', isLongWeekend: false },
  { date: '2027-05-01', name: 'Dia do Trabalhador', dayOfWeek: 'Sábado', isLongWeekend: false },
  { date: '2027-09-07', name: 'Independência do Brasil', dayOfWeek: 'Terça-feira', isLongWeekend: true },
  { date: '2027-10-12', name: 'Nossa Senhora Aparecida', dayOfWeek: 'Terça-feira', isLongWeekend: true },
  { date: '2027-11-02', name: 'Finados', dayOfWeek: 'Terça-feira', isLongWeekend: true },
  { date: '2027-11-15', name: 'Proclamação da República', dayOfWeek: 'Segunda-feira', isLongWeekend: true },
  { date: '2027-11-20', name: 'Dia da Consciência Negra', dayOfWeek: 'Sábado', isLongWeekend: false },
  { date: '2027-12-25', name: 'Natal', dayOfWeek: 'Sábado', isLongWeekend: false }
];

export function getHolidayInfo(dateString) {
  return BRAZIL_HOLIDAYS.find(h => h.date === dateString) || null;
}

export function isWeekendOrHolidayTravel(departureDateStr, returnDateStr) {
  const depDate = new Date(departureDateStr + 'T00:00:00');
  const retDate = returnDateStr ? new Date(returnDateStr + 'T00:00:00') : null;

  const depDay = depDate.getDay(); // 0=Sun, 5=Fri, 6=Sat
  const retDay = retDate ? retDate.getDay() : null;

  const depHoliday = getHolidayInfo(departureDateStr);
  const retHoliday = returnDateStr ? getHolidayInfo(returnDateStr) : null;

  // Check if departure is Friday (5) or Saturday (6) or Holiday
  const validDeparture = depDay === 5 || depDay === 6 || (depHoliday && depHoliday.isLongWeekend);

  // Check if return is Sunday (0) or Monday (1) or Holiday
  const validReturn = !retDate || retDay === 0 || retDay === 1 || (retHoliday && retHoliday.isLongWeekend);

  return {
    isWeekendOrHoliday: validDeparture && validReturn,
    holidayDetails: depHoliday || retHoliday || null
  };
}
