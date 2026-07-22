import mongoose from 'mongoose';

const AlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ['normal', 'flytogether'], default: 'normal' },
  origin1: { type: String, required: true }, // IATA code or city
  origin1Name: { type: String },
  origin2: { type: String }, // For Fly Together mode
  origin2Name: { type: String },
  destination: { type: String, required: true }, // IATA code
  destinationName: { type: String },
  departureDate: { type: String }, // YYYY-MM-DD
  returnDate: { type: String }, // YYYY-MM-DD
  durationDays: { type: Number, default: 4 },
  maxBudgetCombined: { type: Number }, // Max acceptable price
  onlyWeekends: { type: Boolean, default: false },
  isVacation: { type: Boolean, default: false },
  vacationStart: { type: String }, // YYYY-MM-DD
  vacationEnd: { type: String }, // YYYY-MM-DD
  sortBy: { type: String, default: 'sincronia_total' }, // 'sincronia_total', 'tempo_juntos', 'price', 'duration', 'departureTime', 'sincronia'
  selectedAirlines: { type: [String], default: ['LA', 'G3', 'AD', 'TP', 'CM'] },
  stopsFilter: { type: String, default: 'all' }, // 'all', 'direct', 'stops'
  hideTransfers: { type: Boolean, default: false },
  toleranceIndex: { type: Number, default: 3 },
  notifyEmail: { type: String, required: true },
  active: { type: Boolean, default: true },
  lastPriceFound: { type: Number },
  lastCheckedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Alert || mongoose.model('Alert', AlertSchema);
