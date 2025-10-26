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

// 💡 NEW: Auth Middleware Import
const auth = require('./middleware/auth'); 

// Utilities
const { fetchAndSavePrices } = require('./utils/aggregator');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware Setup ---
// CRITICAL FIX: Parse incoming JSON payloads (must be near the top)
app.use(express.json()); 

app.use(cors({
    origin: 'http://localhost:3000', 
}));

// --- Check for Environment Variables ---
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error('CRITICAL ERROR: MONGO_URI or JWT_SECRET not found in environment variables.');
    process.exit(1);
}

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected Successfully!');

        // Initial price fetch only in development mode
        if (process.env.NODE_ENV !== 'production') {
            console.log('Running initial price fetch on server start (Development mode)...');
            fetchAndSavePrices();
        }
    })
    .catch((err) => {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    });

// --- Cron Task: Fetch TRX Prices every 10 minutes ---
cron.schedule('*/10 * * * *', () => {
    console.log('Running scheduled TRX price aggregation...');
    fetchAndSavePrices();
});

// --- Route Mounting (Fixed Routes) ---
app.use('/api/auth', authRoutes);         

// ✅ FIX: /api पर auth middleware apply करें और फिर routes को जोड़ें।
// History और Comparison दोनों Routes के लिए /api base path का उपयोग करें।
app.use('/api', auth, historyRoutes); 
app.use('/api', auth, comparisonRoutes); 


// --- Root Health Check ---
app.get('/', (req, res) => {
    res.send('TRX Sasta Energy Backend Running!');
});

// --- Start Server ---
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));