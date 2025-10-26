// models/Price.js
const mongoose = require('mongoose');

const PriceSchema = new mongoose.Schema({
    providerName: { type: String, required: true }, // जैसे TronSave
    price_TRX_per_65k: { type: Number, required: true }, // 65k Energy की कीमत TRX में
    rentalDuration: { type: String, required: true }, // जैसे '1 Day' या '1 Hour'
    reliabilityScore: { type: Number, default: 0 }, // 0 से 5 तक
    sourceUrl: { type: String }, // Provider की वेबसाइट का URL
    fetchedAt: { type: Date, default: Date.now } // डेटा कब लिया गया
});

module.exports = mongoose.model('Price', PriceSchema);