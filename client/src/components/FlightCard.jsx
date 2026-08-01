import React from 'react';
import { Plane, Calendar, Flame, ArrowRight, Bell, Bus } from 'lucide-react';
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
        const response = await API.get('/flights/deep-link', {
          params: { bookingToken: flight.bookingToken }
        });
        
        if (response.data?.url) {
          window.open(response.data.url, '_blank');
          Swal.close();
          return;
        }
      } catch (err) {
        console.warn('Falha ao gerar link dinâmico via API Token:', err.message);
      }
    }

    if (flight.bookingUrl) {
      window.open(flight.bookingUrl, '_blank');
    } else {
      const query = `Voos de ${flight.origin} para ${flight.destination} em ${flight.departureDate}`;
      window.open(`https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`, '_blank');
    }
  };

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all duration-300 relative group overflow-hidden bg-slate-900/80 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Airline & Times */}
        <div className="flex-1 space-y-4">
          
          {/* Timeline Ida (Outbound) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
              <span className="flex items-center space-x-2">
                {flight.airline.logo && flight.airline.logo.startsWith('http') ? (
                  <img 
                    src={flight.airline.logo} 
                    alt={flight.airline.name} 
                    className="w-5 h-5 object-contain rounded bg-slate-950 p-0.5 border border-slate-800"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://www.gstatic.com/flights/airline_logos/70px/LA.png';
                    }}
                  />
                ) : (
                  <span>{flight.airline.logo}</span>
                )}
                <span>{flight.airline.name}</span>
                {(flight.flightNumber || flight.airplane) && (
                  <span className="font-mono text-xs text-slate-500 font-normal ml-2">
                    {flight.flightNumber} {flight.airplane ? `• ${flight.airplane}` : ''}
                  </span>
                )}
              </span>
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
                <span className="text-xs text-slate-400 font-medium mb-1">{flight.duration}</span>
                <div className="w-full flex items-center relative h-3">
                  <div className={`h-[2px] w-full rounded-full absolute top-1/2 transform -translate-y-1/2 ${flight.hasAirportTransfer ? 'bg-gradient-to-r from-slate-700 via-amber-500 to-slate-700' : 'bg-slate-700/80'}`}></div>
                  
                  {/* Escalas dinâmicas da ida - Se houver troca de aeroporto exibe ícone de ônibus com tooltip */}
                  {!isOutboundDirect && Array.isArray(flight.stopsList) && flight.stopsList.map((stop, sIdx, arr) => {
                    const percentage = ((sIdx + 1) / (arr.length + 1)) * 100;
                    const isTransfer = flight.hasAirportTransfer;
                    return (
                      <div 
                        key={sIdx} 
                        style={{ left: `${percentage}%` }} 
                        className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10 group/stop"
                        title={isTransfer 
                          ? `🚌 Traslado Terrestre (Troca de Aeroporto)\nConexão: ${stop.city} (${stop.iata})\nAeroporto: ${stop.name}\nRequer transporte por conta própria entre aeroportos.`
                          : `Conexão: ${stop.city} (${stop.iata})\nAeroporto: ${stop.name}`}
                      >
                        {isTransfer ? (
                          <div className="p-1 rounded-full bg-amber-500 border-2 border-slate-950 shadow-lg text-slate-950 flex items-center justify-center transition-all hover:scale-125 hover:bg-amber-400 animate-pulse">
                            <Bus className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-950 shadow cursor-help transition-all hover:scale-125 hover:bg-amber-300"></div>
                        )}
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
          </div>

          {/* Timeline Volta (Inbound) - Se houver retorno */}
          {flight.returnDate && (
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                <span>🔄 VOLTA: {formatToBrazillianDate(flight.returnDate)}</span>
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
                  <span className="text-xs text-slate-500 font-medium mb-1">{flight.returnDuration || '2h 30m'}</span>
                  <div className="w-full flex items-center relative h-3">
                    <div className={`h-[2px] w-full rounded-full absolute top-1/2 transform -translate-y-1/2 ${flight.returnHasAirportTransfer ? 'bg-gradient-to-r from-slate-700 via-amber-500 to-slate-700' : 'bg-slate-700/80'}`}></div>
                    
                    {/* Escalas dinâmicas da volta */}
                    {!isInboundDirect && Array.isArray(flight.returnStopsList) && flight.returnStopsList.map((stop, sIdx, arr) => {
                      const percentage = ((sIdx + 1) / (arr.length + 1)) * 100;
                      const isTransfer = flight.returnHasAirportTransfer;
                      return (
                        <div 
                          key={sIdx} 
                          style={{ left: `${percentage}%` }} 
                          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10 group/stop"
                          title={isTransfer 
                            ? `🚌 Traslado Terrestre (Troca de Aeroporto)\nConexão: ${stop.city} (${stop.iata})\nAeroporto: ${stop.name}\nRequer transporte por conta própria entre aeroportos.`
                            : `Conexão: ${stop.city} (${stop.iata})\nAeroporto: ${stop.name}`}
                        >
                          {isTransfer ? (
                            <div className="p-1 rounded-full bg-amber-500 border-2 border-slate-950 shadow-lg text-slate-950 flex items-center justify-center transition-all hover:scale-125 hover:bg-amber-400 animate-pulse">
                              <Bus className="w-3 h-3 stroke-[2.5]" />
                            </div>
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-950 shadow cursor-help transition-all hover:scale-125 hover:bg-amber-300"></div>
                          )}
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
              <p className="text-xs text-slate-500 font-mono">
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
