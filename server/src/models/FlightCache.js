import mongoose from 'mongoose';

const FlightCacheSchema = new mongoose.Schema({
  origin: { type: String, required: true, uppercase: true, trim: true },
  destination: { type: String, required: true, uppercase: true, trim: true },
  departureDate: { type: String, required: true }, // Format: YYYY-MM-DD
  returnDate: { type: String }, // Format: YYYY-MM-DD (optional)
  flights: { type: Array, required: true },
  scrapedAt: { type: Date, default: Date.now },
  source: { type: String, enum: ['api', 'scraper'], default: 'scraper' },
  status: { type: String, enum: ['pending', 'completed'], default: 'completed' }
});

// Index to optimize lookups
FlightCacheSchema.index({ origin: 1, destination: 1, departureDate: 1, returnDate: 1 });

export default mongoose.models.FlightCache || mongoose.model('FlightCache', FlightCacheSchema);
