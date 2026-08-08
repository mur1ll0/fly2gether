import mongoose from 'mongoose';

const FlightCacheSchema = new mongoose.Schema({
  searchHash: { type: String, index: true }, // Foreign key para SearchSession
  origin: { type: String, required: true, uppercase: true, trim: true },
  destination: { type: String, required: true, uppercase: true, trim: true },
  departureDate: { type: String, required: true }, // Format: YYYY-MM-DD
  returnDate: { type: String, default: null }, // Format: YYYY-MM-DD
  person: { type: String, enum: ['p1', 'p2'], default: 'p1' },
  flights: { type: Array, required: true },
  scrapedAt: { type: Date, default: Date.now },
  source: { type: String, enum: ['api', 'scraper'], default: 'scraper' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' }
});

// Index to optimize lookups por rota
FlightCacheSchema.index({ origin: 1, destination: 1, departureDate: 1, returnDate: 1 });

// TTL index: automaticamente expira e exclui registros após 2 horas (7200 segundos)
FlightCacheSchema.index({ scrapedAt: 1 }, { expireAfterSeconds: 7200 });

export default mongoose.models.FlightCache || mongoose.model('FlightCache', FlightCacheSchema);
