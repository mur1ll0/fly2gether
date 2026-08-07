import mongoose from 'mongoose';

const LegSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departureDate: { type: String, required: true },
  returnDate: { type: String, default: null },
  person: { type: String, enum: ['p1', 'p2'], default: 'p1' },
  status: { type: String, enum: ['pending', 'scraping', 'completed', 'failed'], default: 'pending' },
  offersCount: { type: Number, default: 0 }
}, { _id: false });

const SearchSessionSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // searchHash
  searchHash: { type: String, required: true, index: true },
  mode: { type: String, enum: ['normal', 'flytogether'], default: 'normal' },
  origin1: { type: String, required: true },
  origin2: { type: String, default: null },
  destination: { type: String, required: true },
  departureDate: { type: String, required: true },
  returnDate: { type: String, default: null },
  status: { type: String, enum: ['pending', 'scraping', 'completed', 'failed'], default: 'pending' },
  legs: [LegSchema],
  totalOffersCount: { type: Number, default: 0 },
  scrapedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), index: { expireAfterSeconds: 0 } }
});

const SearchSession = mongoose.models.SearchSession || mongoose.model('SearchSession', SearchSessionSchema);

export default SearchSession;
