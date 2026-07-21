import React from 'react';
import { Plane, Calendar, Flame, ArrowRight, Bell } from 'lucide-react';
import { formatToBrazillianDate } from '../utils/dateFormatter';
import Swal from 'sweetalert2';
import API from '../services/api';

export default function FlightCard({ flight, onCreateAlert }) {
  const isOutboundDirect = flight.stopsCount === 0 || !flight.stopsList?.length;
  const isInboundDirect = flight.returnStopsCount === 0 || !flight.returnStopsList?.length;

  const handleBooking = async () => {
    if (flight.bookingToken) {
      Swal.fire({
        title: 'Gerando Link de Reserva...',
        text: 'Estamos abrindo o Google Flights com a sua Ida e Volta pré-selecionadas.',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc',
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        const res = await API.get('/flights/booking-url', {
          params: {
            booking_token: flight.bookingToken,
            origin: flight.origin,
            destination: flight.destination,
            departure_date: flight.departureDate,
            return_date: flight.returnDate
          }
        });
        Swal.close();
        if (res.data?.bookingUrl) {
          window.open(res.data.bookingUrl, '_blank');
        } else {
          window.open(flight.bookingUrl, '_blank');
        }
      } catch (e) {
        console.error(e);
        Swal.close();
        window.open(flight.bookingUrl, '_blank');
      }
    } else {
      const fallbackUrl = flight.bookingUrl || `https://www.google.com/travel/flights?q=Voos%2520de%2520${flight.origin}%2520para%2520${flight.destination}`;
      window.open(fallbackUrl, '_blank');
    }
  };

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-brand-500/50 transition-all duration-300 relative group overflow-hidden bg-slate-900/80">
      {/* Promo Badge */}
      {flight.isMegaPromo && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-600 to-amber-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-bl-xl shadow-md flex items-center space-x-1">
          <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
          <span>🔥 MEGA PROMOÇÃO DA COMPANHIA AÉREA</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Airline & Route Info */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center space-x-3">
            {flight.airline.logo && flight.airline.logo.startsWith('http') ? (
              <img 
                src={flight.airline.logo} 
                alt={flight.airline.name} 
                className="w-10 h-10 object-contain rounded-xl bg-slate-950 p-1.5 border border-slate-800"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://www.gstatic.com/flights/airline_logos/70px/LA.png';
                }}
              />
            ) : (
              <span className="text-xl">{flight.airline.logo || '✈️'}</span>
            )}
            <div>
              <h4 className="text-sm font-bold text-slate-100">{flight.airline.name}</h4>
              <p className="text-xs text-slate-400 font-mono text-[10px]">Provedor: {flight.provider || 'Google Flights'}</p>
            </div>
            {flight.isWeekendOrHoliday && (
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded-full flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{flight.holidayDetails ? flight.holidayDetails.name : 'Fim de Semana'}</span>
              </span>
            )}
          </div>

          {/* Timeline Ida (Outbound) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-bold">
              <span>✈️ IDA: {formatToBrazillianDate(flight.departureDate)}</span>
              {(flight.flightNumber || flight.airplane) && (
                <span className="font-mono text-[10px] text-slate-500 font-normal">
                  {flight.flightNumber} {flight.airplane ? `• ${flight.airplane}` : ''}
                </span>
              )}
              <span className={isOutboundDirect ? 'text-emerald-400' : 'text-amber-400'}>
                {isOutboundDirect ? 'Voo Direto' : `${flight.stopsCount} escala(s)`}
              </span>
            </div>
            <div className="flex items-center space-x-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="text-center min-w-[70px]">
                <p className="text-base font-extrabold text-slate-100">{flight.departureTime}</p>
                <p className="text-xs font-bold text-brand-400 font-mono">{flight.origin}</p>
              </div>

              {/* Visual Timeline Row */}
              <div className="flex-1 flex flex-col items-center relative py-1">
                <span className="text-[10px] text-slate-500 font-medium mb-1">{flight.duration}</span>
                <div className="w-full flex items-center relative h-3">
                  <div className="h-[2px] w-full bg-slate-700/80 rounded-full absolute top-1/2 transform -translate-y-1/2"></div>
                  
                  {/* Escalas dinâmicas da ida com nós visuais - Apenas ponto amarelo com tooltip */}
                  {!isOutboundDirect && Array.isArray(flight.stopsList) && flight.stopsList.map((stop, sIdx, arr) => {
                    const percentage = ((sIdx + 1) / (arr.length + 1)) * 100;
                    return (
                      <div 
                        key={sIdx} 
                        style={{ left: `${percentage}%` }} 
                        className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10 group/stop"
                        title={`Conexão: ${stop.city} (${stop.iata}) \nAeroporto: ${stop.name}`}
                      >
                        <div 
                          className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-950 shadow cursor-help transition-all hover:scale-125 hover:bg-amber-300"
                        ></div>
                      </div>
                    );
                  })}

                  {isOutboundDirect && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-800 top-1/2 -translate-y-1/2"></div>
                  )}

                  <Plane className="w-3.5 h-3.5 text-brand-400 absolute right-0 top-1/2 transform -translate-y-1/2 rotate-90" />
                </div>
              </div>

              <div className="text-center min-w-[70px]">
                <p className="text-base font-extrabold text-slate-100">{flight.arrivalTime}</p>
                <p className="text-xs font-bold text-brand-400 font-mono">{flight.destination}</p>
              </div>
            </div>

            {/* Aviso visual de troca de aeroporto na Ida */}
            {flight.hasAirportTransfer && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-bold rounded-lg flex items-center space-x-1.5 justify-center mt-2 animate-pulse">
                <span>⚠️ Conexão de ida exige mudança de aeroporto com traslado terrestre por conta própria.</span>
              </div>
            )}
          </div>

          {/* Timeline Volta (Inbound) - Se houver retorno */}
          {flight.returnDate && (
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-bold">
                <span>🔄 VOLTA: {formatToBrazillianDate(flight.returnDate)}</span>
                {(flight.returnFlightNumber || flight.returnAirplane) && (
                  <span className="font-mono text-[10px] text-slate-500 font-normal">
                    {flight.returnFlightNumber} {flight.returnAirplane ? `• ${flight.returnAirplane}` : ''}
                  </span>
                )}
                <span className={isInboundDirect ? 'text-emerald-400' : 'text-amber-400'}>
                  {isInboundDirect ? 'Voo Direto' : `${flight.returnStopsCount || 1} escala(s)`}
                </span>
              </div>
              <div className="flex items-center space-x-4 bg-slate-950/45 p-3.5 rounded-xl border border-slate-800/60">
                <div className="text-center min-w-[70px]">
                  <p className="text-base font-extrabold text-slate-100">{flight.returnDepartureTime || '17:30'}</p>
                  <p className="text-xs font-bold text-brand-400 font-mono">{flight.destination}</p>
                </div>

                {/* Visual Timeline Row */}
                <div className="flex-1 flex flex-col items-center relative py-1">
                  <span className="text-[10px] text-slate-500 font-medium mb-1">{flight.returnDuration || '2h 30m'}</span>
                  <div className="w-full flex items-center relative h-3">
                    <div className="h-[2px] w-full bg-slate-700/80 rounded-full absolute top-1/2 transform -translate-y-1/2"></div>
                    
                    {/* Escalas dinâmicas da volta */}
                    {!isInboundDirect && Array.isArray(flight.returnStopsList) && flight.returnStopsList.map((stop, sIdx, arr) => {
                      const percentage = ((sIdx + 1) / (arr.length + 1)) * 100;
                      return (
                        <div 
                          key={sIdx} 
                          style={{ left: `${percentage}%` }} 
                          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10 group/stop"
                          title={`Conexão: ${stop.city} (${stop.iata}) \nAeroporto: ${stop.name}`}
                        >
                          <div 
                            className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-950 shadow cursor-help transition-all hover:scale-125 hover:bg-amber-300"
                          ></div>
                        </div>
                      );
                    })}

                    {isInboundDirect && (
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-800 top-1/2 -translate-y-1/2"></div>
                    )}

                    <Plane className="w-3.5 h-3.5 text-brand-400 absolute right-0 top-1/2 transform -translate-y-1/2 rotate-90" />
                  </div>
                </div>

                <div className="text-center min-w-[70px]">
                  <p className="text-base font-extrabold text-slate-100">{flight.returnArrivalTime || '20:00'}</p>
                  <p className="text-xs font-bold text-brand-400 font-mono">{flight.origin}</p>
                </div>
              </div>

              {/* Aviso visual de troca de aeroporto na Volta */}
              {flight.returnHasAirportTransfer && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-bold rounded-lg flex items-center space-x-1.5 justify-center mt-2 animate-pulse">
                  <span>⚠️ Conexão de volta exige mudança de aeroporto com traslado terrestre por conta própria.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Price & CTA */}
        <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
          <div className="text-left md:text-right">
            <p className="text-xs text-slate-400 uppercase font-medium">Preço Total Ida e Volta</p>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              R$ {flight.totalPrice.toLocaleString('pt-BR')}
            </p>
            {flight.inboundPrice > 0 && (
              <p className="text-[11px] text-slate-500 font-mono">
                Ida: R$ {flight.outboundPrice} | Volta: R$ {flight.inboundPrice}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 mt-2">
            {/* Alerta de Preço */}
            <button
              onClick={() => onCreateAlert(flight)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
              title="Criar alerta por e-mail para esta rota"
            >
              <Bell className="w-3.5 h-3.5 text-brand-400" />
              <span>Criar Alerta</span>
            </button>

            {/* Ver Voo no Google Flights */}
            <button
              onClick={handleBooking}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow flex items-center space-x-1 transition-all"
            >
              <span>Ver Voo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
