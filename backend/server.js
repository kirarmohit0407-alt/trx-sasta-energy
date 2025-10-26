// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');

// Route Imports
const authRoutes = require('./routes/auth');
const historyRoutes = require('./routes/history');
const comparisonRoutes = require('./routes/comparison');

// Auth Middleware
const auth = require('./middleware/auth');

// Utilities
const { fetchAndSavePrices } = require('./utils/aggregator');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware Setup ---

// 1. CRITICAL: JSON Parser
app.use(express.json()); 

// 2. CORS setup for Production/Development
const ALLOWED_ORIGIN = process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL  // Live Frontend URL
    : 'http://localhost:3000';  // Local Frontend

// 💡 FINAL CORS FIX: Explicitly setting methods and headers for preflight requests
app.use(cors({
    origin: ALLOWED_ORIGIN,
    // Methods ki list jinhe aap support karte hain
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    // Headers ki list jinhe aap support karte hain (JWT token ke liye zaroori)
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], 
    // Credentials ko allow karna zaroori nahi hai, lekin preflight ke liye ye settings zaroori hain.
}));

// --- Environment Variable Checks ---
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error('CRITICAL ERROR: MONGO_URI or JWT_SECRET not found in environment variables.');
    process.exit(1);
}

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected Successfully!');
        if (process.env.NODE_ENV !== 'production') {
            console.log('Running initial price fetch on server start (Development mode)...');
            fetchAndSavePrices();
        }
    })
    .catch((err) => {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    });

// --- Scheduled TRX Price Aggregation (Every 10 minutes) ---
cron.schedule('*/10 * * * *', () => {
    console.log('Running scheduled TRX price aggregation...');
    fetchAndSavePrices();
});

// --- Modular Routes ---

// Public Auth routes
app.use('/api/auth', authRoutes);

// Protected routes (JWT required)
app.use('/api', auth, historyRoutes);
app.use('/api', auth, comparisonRoutes);

// --- Root Health Check ---
app.get('/', (req, res) => {
    res.send('TRX Sasta Energy Backend Running!');
});

// --- Server Start ---
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
