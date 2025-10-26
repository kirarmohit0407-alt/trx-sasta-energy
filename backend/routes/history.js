// routes/history.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const User = require('../models/User'); 

// --- 1. Log Transaction (Jab user "Rent Now" par click karega) ---
// POST /api/history
router.post('/', auth, async (req, res) => {
    // Frontend se yeh fields aayengi:
    const { providerName, price_TRX, rentedEnergy, rentalDuration } = req.body;
    
    // Ensure all required fields are provided for logging
    if (!providerName || !price_TRX || !rentedEnergy || !rentalDuration) {
        return res.status(400).json({ msg: 'Missing one or more required transaction details.' });
    }

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        
        // New transaction entry banao, status ko 'Logged' set karo
        const newEntry = { 
            providerName, 
            price_TRX, 
            rentedEnergy, 
            rentalDuration,
            // 💡 NEW: Default status set kiya gaya hai
            status: 'Logged' 
        };

        // History mein push karo (unshift new entries ko top par rakhta hai)
        user.history.unshift(newEntry);
        await user.save();

        // Transaction ke liye saved ID ko response mein bhejna useful ho sakta hai
        res.json({ 
            msg: 'Transaction logged successfully.',
            transactionId: user.history[0]._id // Newly created entry ki ID
        });
        
    } catch (err) {
        console.error('Error logging transaction:', err.message);
        res.status(500).send('Server Error while logging transaction.');
    }
});


// --- 2. Get User History (Protected by auth middleware) ---
// GET /api/history
router.get('/', auth, async (req, res) => {
    try {
        // Sirf user ki history retrieve karo
        // Mongoose sirf 'history' field ko select karega, aur 'email' field ko ignore karega (projection logic)
        const user = await User.findById(req.userId, 'history'); 
        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // History array ko seedha frontend ko bhej do
        res.json(user.history);

    } catch (err) {
        console.error('Error fetching history:', err.message);
        res.status(500).send('Server Error while fetching history.');
    }
});

// --- 3. (Optional Future Feature) Update Transaction Status ---
/*
router.put('/status/:id', auth, async (req, res) => {
    // Is route ka upyog tab hoga jab aap asli Tron Network se status update lenge
    // Example: const { newStatus } = req.body;
    // User.updateOne(...) logic yahan aayegi
});
*/

module.exports = router;