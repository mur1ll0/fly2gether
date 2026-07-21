import mongoose from 'mongoose';

const PriceHistorySchema = new mongoose.Schema({
  routeKey: { type: String, required: true }, // e.g. "GRU-FLN" or "GRU+SDU-FLN"
  airline: { type: String },
  price: { type: Number, required: true },
  isPromo: { type: Boolean, default: false },
  dateFound: { type: Date, default: Date.now }
});

export default mongoose.models.PriceHistory || mongoose.model('PriceHistory', PriceHistorySchema);
