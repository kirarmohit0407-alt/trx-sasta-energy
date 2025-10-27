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

// 1. CRITICAL: JSON Parser (Must be first)
app.use(express.json()); 

// 2. 💡 FINAL FIX: Robust CORS with Dynamic Origin Handling
const VERCEL_DOMAIN_REGEX = /https:\/\/trx-sasta-energy-.*\.vercel\.app$/;

app.use(cors({
    origin: (origin, callback) => {
        // Allow Vercel subdomains, localhost, and direct API calls (when origin is undefined)
        if (!origin || origin === 'http://localhost:3000' || VERCEL_DOMAIN_REGEX.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy blocks access from origin: ${origin}`), false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    credentials: true
}));

// 💡 FIX 2: Manually handle OPTIONS requests (CRITICAL for Render/Vercel)
// This guarantees that the browser receives the required 200 OK for preflight.
app.options('*', cors()); 
// ----------------------------------------------------------------------

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


