// models/User.js
const mongoose = require('mongoose');

// History Sub-Schema: Transaction Status Tracking ke liye update kiya gaya
const HistorySchema = new mongoose.Schema({
    providerName: String,
    price_TRX: Number, // User ko laga total cost (TRX mein)
    rentedEnergy: Number,
    rentalDuration: String,
    date: { type: Date, default: Date.now },
    // NEW FIELD: Transaction Status ko track karne ke liye
    status: { 
        type: String, 
        enum: ['Logged', 'Failed', 'Success'], // Sirf ye teen values hi allowed hain
        default: 'Logged' // Default value jab user 'Rent Now' par click karta hai
    }, 
});

const UserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    // History array mein ab naya 'status' field bhi hoga
    history: [HistorySchema] 
});

module.exports = mongoose.model('User', UserSchema);