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
    ? process.env.FRONTEND_URL
    : 'http://localhost:3000';

// 💡 FIX 1: Universal CORS with Explicit Headers
app.use(cors({
    origin: '*', // Allow all origins to resolve preflight issues
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // OPTIONS method ko explicitly allow karein
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], 
}));

// 💡 FIX 2: Manually handle OPTIONS requests (CRITICAL FOR LIVE CORS FIX)
// Render par yeh ensure karta hai ki preflight requests (OPTIONS) ko turant 200 OK mile.
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
    res.sendStatus(200);
});
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
