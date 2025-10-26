// routes/comparison.js
const express = require('express');
const Price = require('../models/Price'); // Price Model को Import करें
const router = express.Router();

router.get('/compare', async (req, res) => {
    try {
        // 1. Data Retrieval: पिछले 24 घंटों का सारा Data खींचें (ताकि पुराना Data Ignore हो)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const recentPrices = await Price.find({
            fetchedAt: { $gte: twentyFourHoursAgo } // सिर्फ पिछले 24 घंटे का Data लें
        }).sort({ fetchedAt: -1 }); // सबसे नया Data सबसे ऊपर रखें

        // 2. Data Filtering & Logic (JavaScript का उपयोग करके)
        // हम हर Provider की सिर्फ़ एक (सबसे ताज़ा) एंट्री चाहते हैं।
        const latestPricesMap = new Map();
        
        for (const priceEntry of recentPrices) {
            // Map यह सुनिश्चित करता है कि सिर्फ़ पहला (सबसे नया) Data point ही हर Provider के लिए स्टोर हो।
            if (!latestPricesMap.has(priceEntry.providerName)) {
                latestPricesMap.set(priceEntry.providerName, priceEntry);
            }
        }

        // Map से Values निकालकर Array बनाएं
        let latestPrices = Array.from(latestPricesMap.values());
        
        // 3. Final Sort: कीमत के हिसाब से Sort करें (सबसे सस्ता पहले)
        latestPrices.sort((a, b) => a.price_TRX_per_65k - b.price_TRX_per_65k);

        // Debugging के लिए Console Log
        console.log(`[API Response] Sending ${latestPrices.length} unique provider entries.`);
        
        // 4. Response भेज दें
        res.json(latestPrices);

    } catch (err) {
        // Error को Log करें और 500 Status Code के साथ Response भेजें
        console.error('CRITICAL ERROR in /api/compare route:', err);
        res.status(500).json({ message: 'Error fetching comparison data from server logic.' });
    }
});

module.exports = router;