import React, { useMemo } from 'react';
import { Calendar, Palmtree, Sparkles, ArrowRight, Info, Flame } from 'lucide-react';

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

function getBrazilianHolidays(startYear = new Date().getFullYear(), endYear = new Date().getFullYear() + 2) {
  const holidays = [];
  for (let y = startYear; y <= endYear; y++) {
    holidays.push({ date: `${y}-01-01`, name: 'Ano Novo' });
    holidays.push({ date: `${y}-04-21`, name: 'Tiradentes' });
    holidays.push({ date: `${y}-05-01`, name: 'Dia do Trabalho' });
    holidays.push({ date: `${y}-09-07`, name: 'Independência do Brasil' });
    holidays.push({ date: `${y}-10-12`, name: 'Nossa Senhora Aparecida' });
    holidays.push({ date: `${y}-11-02`, name: 'Finados' });
    holidays.push({ date: `${y}-11-15`, name: 'Proclamação da República' });
    holidays.push({ date: `${y}-11-20`, name: 'Dia da Consciência Negra' });
    holidays.push({ date: `${y}-12-25`, name: 'Natal' });

    const easter = getEasterDate(y);
    const goodFriday = new Date(easter); goodFriday.setUTCDate(easter.getUTCDate() - 2);
    holidays.push({ date: formatDateStr(goodFriday), name: 'Sexta-feira Santa' });

    const carnivalMon = new Date(easter); carnivalMon.setUTCDate(easter.getUTCDate() - 48);
    holidays.push({ date: formatDateStr(carnivalMon), name: 'Carnaval (Segunda)' });

    const carnivalTue = new Date(easter); carnivalTue.setUTCDate(easter.getUTCDate() - 47);
    holidays.push({ date: formatDateStr(carnivalTue), name: 'Carnaval (Terça)' });

    const corpusChristi = new Date(easter); corpusChristi.setUTCDate(easter.getUTCDate() + 60);
    holidays.push({ date: formatDateStr(corpusChristi), name: 'Corpus Christi' });
  }
  return holidays;
}

function getHolidayOnDate(dateStr) {
  const year = parseInt(dateStr.split('-')[0], 10);
  const holidays = getBrazilianHolidays(year - 1, year + 1);
  return holidays.find(h => h.date === dateStr) || null;
}

function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

export default function SmartDatePreview({
  onlyWeekends,
  isVacation,
  vacationStart,
  vacationEnd,
  durationDays
}) {
  // Gera combinações inteligentes para exibição visual no frontend
  const smartSchedule = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Finais de semana comuns limitados aos próximos 60 dias (2 meses)
    const twoMonthsAhead = new Date(today);
    twoMonthsAhead.setDate(today.getDate() + 60);
    const maxNormalDateStr = twoMonthsAhead.toISOString().split('T')[0];

    const holidayCandidates = [];
    const regularWeekendCandidates = [];
    const seen = new Set();

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const holiday = getHolidayOnDate(dateStr);
      const dayOfWeek = d.getUTCDay(); // 0: Dom, 1: Seg, 2: Ter, 3: Qua, 4: Qui, 5: Sex, 6: Sáb

      // Feriado na Segunda-feira (ex: 7/Set, 12/Out, 2/Nov)
      if (holiday && dayOfWeek === 1) {
        const friPrev = new Date(d); friPrev.setDate(d.getDate() - 3);
        const satPrev = new Date(d); satPrev.setDate(d.getDate() - 2);

        const keyA = `${friPrev.toISOString().split('T')[0]}_${dateStr}`;
        if (!seen.has(keyA) && friPrev.toISOString().split('T')[0] >= todayStr) {
          seen.add(keyA);
          holidayCandidates.push({
            dep: friPrev.toISOString().split('T')[0],
            ret: dateStr,
            depDay: 'Sexta-feira',
            retDay: 'Segunda (feriado)',
            holidayName: holiday.name
          });
        }

        const keyB = `${satPrev.toISOString().split('T')[0]}_${dateStr}`;
        if (!seen.has(keyB) && satPrev.toISOString().split('T')[0] >= todayStr) {
          seen.add(keyB);
          holidayCandidates.push({
            dep: satPrev.toISOString().split('T')[0],
            ret: dateStr,
            depDay: 'Sábado',
            retDay: 'Segunda (feriado)',
            holidayName: holiday.name
          });
        }
      }

      // Feriado na Sexta-feira (ex: 20/Nov, 25/Dez)
      if (holiday && dayOfWeek === 5) {
        const thuPrev = new Date(d); thuPrev.setDate(d.getDate() - 1);
        const sunNext = new Date(d); sunNext.setDate(d.getDate() + 2);

        const keyA = `${thuPrev.toISOString().split('T')[0]}_${sunNext.toISOString().split('T')[0]}`;
        if (!seen.has(keyA) && thuPrev.toISOString().split('T')[0] >= todayStr) {
          seen.add(keyA);
          holidayCandidates.push({
            dep: thuPrev.toISOString().split('T')[0],
            ret: sunNext.toISOString().split('T')[0],
            depDay: 'Quinta (Véspera)',
            retDay: 'Domingo',
            holidayName: holiday.name
          });
        }

        const keyB = `${dateStr}_${sunNext.toISOString().split('T')[0]}`;
        if (!seen.has(keyB) && dateStr >= todayStr) {
          seen.add(keyB);
          holidayCandidates.push({
            dep: dateStr,
            ret: sunNext.toISOString().split('T')[0],
            depDay: 'Sexta (feriado)',
            retDay: 'Domingo',
            holidayName: holiday.name
          });
        }
      }

      // Feriado na Quinta-feira (Emenda)
      if (holiday && dayOfWeek === 4) {
        const sunNext = new Date(d); sunNext.setDate(d.getDate() + 3);
        const key = `${dateStr}_${sunNext.toISOString().split('T')[0]}`;
        if (!seen.has(key) && dateStr >= todayStr) {
          seen.add(key);
          holidayCandidates.push({
            dep: dateStr,
            ret: sunNext.toISOString().split('T')[0],
            depDay: 'Quinta (feriado)',
            retDay: 'Domingo',
            holidayName: holiday.name
          });
        }
      }

      // Finais de Semana Normais nos próximos 2 meses (60 dias)
      if (dayOfWeek === 5 && dateStr <= maxNormalDateStr && !holiday) {
        const sun = new Date(d); sun.setDate(d.getDate() + 2);
        const key = `${dateStr}_${sun.toISOString().split('T')[0]}`;
        if (!seen.has(key) && dateStr >= todayStr) {
          seen.add(key);
          regularWeekendCandidates.push({
            dep: dateStr,
            ret: sun.toISOString().split('T')[0],
            depDay: 'Sexta',
            retDay: 'Domingo'
          });
        }
      }
    }

    return { holidayCandidates, regularWeekendCandidates };
  }, []);

  // Gera amostras da janela de férias
  const vacationSamples = useMemo(() => {
    if (!isVacation || !vacationStart || !vacationEnd) return [];
    const startDate = new Date(vacationStart);
    const endDate = new Date(vacationEnd);
    const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    if (totalDays < durationDays) return [];

    const samples = [];
    for (let i = 0; i <= totalDays - durationDays; i += 3) {
      const dep = new Date(startDate);
      dep.setDate(startDate.getDate() + i);
      const ret = new Date(dep);
      ret.setDate(dep.getDate() + durationDays);

      samples.push({
        dep: dep.toISOString().split('T')[0],
        ret: ret.toISOString().split('T')[0]
      });
    }
    return samples;
  }, [isVacation, vacationStart, vacationEnd, durationDays]);

  if (!onlyWeekends && !isVacation) return null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-brand-500/40 backdrop-blur-md animate-fadeIn">
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
          Combinações Inteligentes Ativadas (Sem data fixa selecionada)
        </h4>
      </div>

      {onlyWeekends && (
        <div className="space-y-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-300 text-xs font-semibold flex items-center space-x-2">
            <span>🌙 <strong>Busca Inteligente a Noite:</strong> Todas as partidas de ida para Finais de Semana e Feriados buscam saídas à noite (a partir das 19h) na véspera ou na sexta-feira.</span>
          </div>

          {/* Feriados Prolongados e Emendas */}
          {smartSchedule.holidayCandidates.length > 0 && (
            <div>
              <div className="flex items-center space-x-1.5 mb-2">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Feriados Nacionais Próximos (Ida Quinta/Sexta ➔ Volta no Feriado ou Domingo):
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {smartSchedule.holidayCandidates.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900/90 border border-amber-500/30 text-xs">
                    <div className="font-bold text-amber-400 flex items-center justify-between mb-1">
                      <span>{item.holidayName}</span>
                    </div>
                    <div className="text-slate-300 flex items-center justify-between">
                      <span>{formatDateShort(item.dep)} ({item.depDay})</span>
                      <ArrowRight className="w-3 h-3 text-slate-500 mx-1" />
                      <span>{formatDateShort(item.ret)} ({item.retDay})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Finais de Semana Normais nos próximos 2 meses */}
          {smartSchedule.regularWeekendCandidates.length > 0 && (
            <div>
              <div className="flex items-center space-x-1.5 mb-2 mt-3">
                <Calendar className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Finais de Semana nos Próximos 2 Meses (Sexta ➔ Domingo):
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {smartSchedule.regularWeekendCandidates.map((item, idx) => (
                  <div key={idx} className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center space-x-1.5">
                    <span>{formatDateShort(item.dep)} (Sex)</span>
                    <ArrowRight className="w-3 h-3 text-brand-400" />
                    <span>{formatDateShort(item.ret)} (Dom)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 mt-2 flex items-center space-x-1 italic">
            <Info className="w-3 h-3 text-brand-400 flex-shrink-0" />
            <span>A busca automática considerará exclusivamente voos nessas janelas inteligentes.</span>
          </p>
        </div>
      )}

      {isVacation && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center space-x-1.5 mb-2">
            <Palmtree className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-purple-200">
              Janela Flexível de Férias ({durationDays} dias entre {formatDateBR(vacationStart)} e {formatDateBR(vacationEnd)}):
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {vacationSamples.map((sample, idx) => (
              <div key={idx} className="px-2 py-1 rounded bg-purple-950/60 border border-purple-800/40 text-xs text-purple-200 flex items-center space-x-1">
                <span>{formatDateShort(sample.dep)}</span>
                <ArrowRight className="w-3 h-3 text-purple-400" />
                <span>{formatDateShort(sample.ret)}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-purple-300/80 mt-1 italic">
            Encontrará a combinação de menor custo e melhor sincronismo dentro da janela informada.
          </p>
        </div>
      )}
    </div>
  );
}
