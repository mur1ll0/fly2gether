import React from 'react';
import { Users, Clock, Flame, Calendar, Bell, ArrowRight, Sparkles, CheckCircle2, Plane } from 'lucide-react';
import { formatToBrazillianDate } from '../utils/dateFormatter';

export default function CombinedFlightCard({ combined, onCreateAlert }) {
  const { person1, person2, destination, departureDate, returnDate, combinedPrice, arrivalDeltaMinutes, isSynchronized, hasPromo, isWeekendOrHoliday, holidayDetails } = combined;

  const handleBooking = () => {
    if (person1.bookingUrl && person2.bookingUrl) {
      window.open(person1.bookingUrl, '_blank');
      window.open(person2.bookingUrl, '_blank');
    } else {
      window.open(`https://www.google.com/travel/flights?q=Voos%20de%20${person1.origin}%20para%20${destination}`, '_blank');
      window.open(`https://www.google.com/travel/flights?q=Voos%20de%20${person2.origin}%20para%20${destination}`, '_blank');
    }
  };

  const isP1OutboundDirect = person1.stopsCount === 0 || !person1.stopsList?.length;
  const isP1InboundDirect = person1.returnStopsCount === 0 || !person1.returnStopsList?.length;

  const isP2OutboundDirect = person2.stopsCount === 0 || !person2.stopsList?.length;
  const isP2InboundDirect = person2.returnStopsCount === 0 || !person2.returnStopsList?.length;

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-all duration-300 relative group overflow-hidden bg-slate-900/90 shadow-xl">
      {/* Header Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>ENCONTRO EM {destination}</span>
          </span>

          {isSynchronized && (
            <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sincronia Perfeita (Diferença de {arrivalDeltaMinutes} min no aeroporto)</span>
            </span>
          )}

          {isWeekendOrHoliday && (
            <span className="px-2.5 py-1 text-xs font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded-lg flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{holidayDetails ? holidayDetails.name : 'Viagem de Fim de Semana'}</span>
            </span>
          )}
        </div>

        {hasPromo && (
          <span className="px-3 py-1 text-xs font-extrabold bg-gradient-to-r from-rose-600 to-amber-500 text-white rounded-lg shadow-md flex items-center space-x-1">
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span>🔥 MEGA PROMOÇÃO DETECTADA</span>
          </span>
        )}
      </div>

      {/* Side-by-side Flight Details with Timelines (Ida e Volta) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
        
        {/* Pessoa 1 */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                <span>Pessoa 1 ({person1.origin})</span>
              </span>
              <span className="text-sm font-bold text-slate-200 flex items-center space-x-1.5">
                {person1.airline.logo && person1.airline.logo.startsWith('http') ? (
                  <img 
                    src={person1.airline.logo} 
                    alt={person1.airline.name} 
                    className="w-6 h-6 object-contain rounded-md bg-slate-950 p-1 border border-slate-800"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://www.gstatic.com/flights/airline_logos/70px/LA.png';
                    }}
                  />
                ) : (
                  <span>{person1.airline.logo}</span>
                )}
                <span>{person1.airline.name}</span>
              </span>
            </div>
            
            {/* Timeline Ida (Outbound) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span>✈️ IDA ({formatToBrazillianDate(departureDate)})</span>
                {(person1.flightNumber || person1.airplane) && (
                  <span className="font-mono text-[9px] text-slate-500 font-normal">
                    {person1.flightNumber} {person1.airplane ? `• ${person1.airplane}` : ''}
                  </span>
                )}
                <span className={isP1OutboundDirect ? 'text-emerald-400' : 'text-amber-400'}>
                  {isP1OutboundDirect ? 'Direto' : `${person1.stopsCount} escala(s)`}
                </span>
              </div>
              <div className="flex items-center space-x-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <div className="text-center min-w-[50px]">
                  <p className="text-sm font-extrabold text-slate-100">{person1.departureTime}</p>
                  <p className="text-[10px] font-bold text-brand-400 font-mono">{person1.origin}</p>
                </div>

                <div className="flex-1 flex flex-col items-center relative py-1">
                  <div className="w-full flex items-center relative h-3">
                    <div className="h-[1.5px] w-full bg-slate-700 rounded-full absolute top-1/2 transform -translate-y-1/2"></div>
                    
                    {!isP1OutboundDirect && Array.isArray(person1.stopsList) && person1.stopsList.map((stop, sIdx, arr) => {
                      const percentage = ((sIdx + 1) / (arr.length + 1)) * 100;
                      return (
                        <div 
                          key={sIdx} 
                          style={{ left: `${percentage}%` }} 
                          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10"
                          title={`Conexão Ida: ${stop.city} (${stop.iata}) \nAeroporto: ${stop.name}`}
                        >
                          <div className="w-2 h-2 rounded-full bg-amber-400 border border-slate-950 shadow cursor-help transition-transform hover:scale-125"></div>
                        </div>
                      );
                    })}

                    {isP1OutboundDirect && (
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-slate-800 top-1/2 -translate-y-1/2"></div>
                    )}
                    <Plane className="w-3 h-3 text-brand-400 absolute right-0 top-1/2 transform -translate-y-1/2 rotate-90" />
                  </div>
                </div>

                <div className="text-center min-w-[50px]">
                  <p className="text-sm font-extrabold text-slate-100">{person1.arrivalTime}</p>
                  <p className="text-[10px] font-bold text-brand-400 font-mono">{destination}</p>
                </div>
              </div>
            </div>

            {/* Timeline Volta (Inbound) */}
            {returnDate && (
              <div className="space-y-1 mt-3">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                  <span>🔄 VOLTA ({formatToBrazillianDate(returnDate)})</span>
                  {(person1.returnFlightNumber || person1.returnAirplane) && (
                    <span className="font-mono text-[9px] text-slate-500 font-normal">
                      {person1.returnFlightNumber} {person1.returnAirplane ? `• ${person1.returnAirplane}` : ''}
                    </span>
                  )}
                  <span className={isP1InboundDirect ? 'text-emerald-400' : 'text-amber-400'}>
                    {isP1InboundDirect ? 'Direto' : `${person1.returnStopsCount || 1} escala(s)`}
                  </span>
                </div>
                <div className="flex items-center space-x-3 bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                  <div className="text-center min-w-[50px]">
                    <p className="text-sm font-extrabold text-slate-100">{person1.returnDepartureTime || '17:30'}</p>
                    <p className="text-[10px] font-bold text-brand-400 font-mono">{destination}</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center relative py-1">
                    <div className="w-full flex items-center relative h-3">
                      <div className="h-[1.5px] w-full bg-slate-700 rounded-full absolute top-1/2 transform -translate-y-1/2"></div>
                      
                      {!isP1InboundDirect && Array.isArray(person1.returnStopsList) && person1.returnStopsList.map((stop, sIdx, arr) => {
                        const percentage = ((sIdx + 1) / (arr.length + 1)) * 100;
                        return (
                          <div 
                            key={sIdx} 
                            style={{ left: `${percentage}%` }} 
                            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10"
                            title={`Conexão Volta: ${stop.city} (${stop.iata}) \nAeroporto: ${stop.name}`}
                          >
                            <div className="w-2 h-2 rounded-full bg-amber-400 border border-slate-950 shadow cursor-help transition-transform hover:scale-125"></div>
                          </div>
                        );
                      })}

                      {isP1InboundDirect && (
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-slate-800 top-1/2 -translate-y-1/2"></div>
                      )}
                      <Plane className="w-3 h-3 text-brand-400 absolute right-0 top-1/2 transform -translate-y-1/2 rotate-90" />
                    </div>
                  </div>

                  <div className="text-center min-w-[50px]">
                    <p className="text-sm font-extrabold text-slate-100">{person1.returnArrivalTime || '20:00'}</p>
                    <p className="text-[10px] font-bold text-brand-400 font-mono">{person1.origin}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex justify-between items-center text-xs">
            <span className="text-[11px] text-slate-400 font-sans truncate">
              Voo de Ida: {person1.stopsDetails || 'Direto'}
            </span>
            <span className="font-bold text-emerald-400 font-mono">R$ {person1.price}</span>
          </div>
        </div>

        {/* Pessoa 2 */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                <span>Pessoa 2 ({person2.origin})</span>
              </span>
              <span className="text-sm font-bold text-slate-200 flex items-center space-x-1.5">
                {person2.airline.logo && person2.airline.logo.startsWith('http') ? (
                  <img 
                    src={person2.airline.logo} 
                    alt={person2.airline.name} 
                    className="w-6 h-6 object-contain rounded-md bg-slate-950 p-1 border border-slate-800"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://www.gstatic.com/flights/airline_logos/70px/LA.png';
                    }}
                  />
                ) : (
                  <span>{person2.airline.logo}</span>
                )}
                <span>{person2.airline.name}</span>
              </span>
            </div>

            {/* Timeline Ida (Outbound) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span>✈️ IDA ({formatToBrazillianDate(departureDate)})</span>
                {(person2.flightNumber || person2.airplane) && (
                  <span className="font-mono text-[9px] text-slate-500 font-normal">
                    {person2.flightNumber} {person2.airplane ? `• ${person2.airplane}` : ''}
                  </span>
                )}
                <span className={isP2OutboundDirect ? 'text-emerald-400' : 'text-amber-400'}>
                  {isP2OutboundDirect ? 'Direto' : `${person2.stopsCount} escala(s)`}
                </span>
              </div>
              <div className="flex items-center space-x-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <div className="text-center min-w-[50px]">
                  <p className="text-sm font-extrabold text-slate-100">{person2.departureTime}</p>
                  <p className="text-[10px] font-bold text-purple-400 font-mono">{person2.origin}</p>
                </div>

                <div className="flex-1 flex flex-col items-center relative py-1">
                  <div className="w-full flex items-center relative h-3">
                    <div className="h-[1.5px] w-full bg-slate-700 rounded-full absolute top-1/2 transform -translate-y-1/2"></div>
                    
                    {!isP2OutboundDirect && Array.isArray(person2.stopsList) && person2.stopsList.map((stop, sIdx, arr) => {
                      const percentage = ((sIdx + 1) / (arr.length + 1)) * 100;
                      return (
                        <div 
                          key={sIdx} 
                          style={{ left: `${percentage}%` }} 
                          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10"
                          title={`Conexão Ida: ${stop.city} (${stop.iata}) \nAeroporto: ${stop.name}`}
                        >
                          <div className="w-2 h-2 rounded-full bg-amber-400 border border-slate-950 shadow cursor-help transition-transform hover:scale-125"></div>
                        </div>
                      );
                    })}

                    {isP2OutboundDirect && (
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-slate-800 top-1/2 -translate-y-1/2"></div>
                    )}
                    <Plane className="w-3 h-3 text-purple-400 absolute right-0 top-1/2 transform -translate-y-1/2 rotate-90" />
                  </div>
                </div>

                <div className="text-center min-w-[50px]">
                  <p className="text-sm font-extrabold text-slate-100">{person2.arrivalTime}</p>
                  <p className="text-[10px] font-bold text-purple-400 font-mono">{destination}</p>
                </div>
              </div>
            </div>

            {/* Timeline Volta (Inbound) */}
            {returnDate && (
              <div className="space-y-1 mt-3">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                  <span>🔄 VOLTA ({formatToBrazillianDate(returnDate)})</span>
                  {(person2.returnFlightNumber || person2.returnAirplane) && (
                    <span className="font-mono text-[9px] text-slate-500 font-normal">
                      {person2.returnFlightNumber} {person2.returnAirplane ? `• ${person2.returnAirplane}` : ''}
                    </span>
                  )}
                  <span className={isP2InboundDirect ? 'text-emerald-400' : 'text-amber-400'}>
                    {isP2InboundDirect ? 'Direto' : `${person2.returnStopsCount || 1} escala(s)`}
                  </span>
                </div>
                <div className="flex items-center space-x-3 bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                  <div className="text-center min-w-[50px]">
                    <p className="text-sm font-extrabold text-slate-100">{person2.returnDepartureTime || '17:30'}</p>
                    <p className="text-[10px] font-bold text-purple-400 font-mono">{destination}</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center relative py-1">
                    <div className="w-full flex items-center relative h-3">
                      <div className="h-[1.5px] w-full bg-slate-700 rounded-full absolute top-1/2 transform -translate-y-1/2"></div>
                      
                      {!isP2InboundDirect && Array.isArray(person2.returnStopsList) && person2.returnStopsList.map((stop, sIdx, arr) => {
                        const percentage = ((sIdx + 1) / (arr.length + 1)) * 100;
                        return (
                          <div 
                            key={sIdx} 
                            style={{ left: `${percentage}%` }} 
                            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10"
                            title={`Conexão Volta: ${stop.city} (${stop.iata}) \nAeroporto: ${stop.name}`}
                          >
                            <div className="w-2 h-2 rounded-full bg-amber-400 border border-slate-950 shadow cursor-help transition-transform hover:scale-125"></div>
                          </div>
                        );
                      })}

                      {isP2InboundDirect && (
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-slate-800 top-1/2 -translate-y-1/2"></div>
                      )}
                      <Plane className="w-3 h-3 text-purple-400 absolute right-0 top-1/2 transform -translate-y-1/2 rotate-90" />
                    </div>
                  </div>

                  <div className="text-center min-w-[50px]">
                    <p className="text-sm font-extrabold text-slate-100">{person2.returnArrivalTime || '20:00'}</p>
                    <p className="text-[10px] font-bold text-purple-400 font-mono">{person2.origin}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex justify-between items-center text-xs">
            <span className="text-[11px] text-slate-400 font-sans truncate">
              Voo de Ida: {person2.stopsDetails || 'Direto'}
            </span>
            <span className="font-bold text-emerald-400 font-mono">R$ {person2.price}</span>
          </div>
        </div>

      </div>

      {/* Bottom Footer: Dates, Combined Price & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
        <div className="text-xs text-slate-400 space-y-1 text-center sm:text-left">
          <p>📅 Período: <strong className="text-slate-200">{formatToBrazillianDate(departureDate)}</strong> {returnDate ? `até ${formatToBrazillianDate(returnDate)}` : ''}</p>
          <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500 font-mono">
            <span>⏱️ Diferença no aeroporto: {arrivalDeltaMinutes} minutos</span>
            {combined.sharedStayFormatted && combined.sharedStayFormatted !== 'N/A' && (
              <span className="text-purple-400 font-bold">❤️ Tempo Juntos: {combined.sharedStayFormatted}</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Combinado</p>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
              R$ {combinedPrice.toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onCreateAlert(combined)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
              title="Monitorar este voo combinado por e-mail"
            >
              <Bell className="w-4 h-4 text-purple-400" />
              <span className="hidden xs:inline">Alertar</span>
            </button>

            <button
              onClick={handleBooking}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-accent flex items-center space-x-1.5 transition-all"
            >
              <span>Ver Opções</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
