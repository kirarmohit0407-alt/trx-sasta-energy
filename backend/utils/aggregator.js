// utils/aggregator.js
const axios = require('axios');
const Price = require('../models/Price');

// 💡 NEW: Providers ki list mein 4 naye providers aur unke actual (simulated) links jode gaye hain.
const PROVIDERS_LIST = [
    { name: 'TRX Smart Rent', id: 'TRX_SR', reliability: 4.9, link: 'https://trxsmartrent.com/rent' }, // Cheapest Option
    { name: 'TronSave', id: 'TS', reliability: 4.8, link: 'https://tronsave.io/rent' },
    { name: 'Energy Hub', id: 'EH', reliability: 4.6, link: 'https://energyhub.xyz/rent' },
    { name: 'Tronex Energy', id: 'TE', reliability: 4.5, link: 'https://tronex.energy/rent' },
    { name: 'SunPool Energy', id: 'SP', reliability: 4.2, link: 'https://sunpool.io/rent' }, // Most Expensive Option
    { name: 'JustLend DAO', id: 'JL', reliability: 4.0, link: 'https://justlend.org/delegate' }, // Official TRON DAO (Reference)
];

// --- 🛑 Real-World Logic Function (हर Provider ke liye alag se code likhna hoga) 🛑 ---

// 1. TRX Smart Rent: Sabse sasta (5.8 to 6.3 TRX)
async function fetchTRXSmartRentPrice() {
    try {
        const simulatedPrice = 5.8 + Math.random() * 0.5; // Price 5.8 to 6.3 TRX
        return simulatedPrice; 
    } catch (e) { return 0; }
}

// 2. TronSave: Average sasta (6.0 to 6.8 TRX)
async function fetchTronSavePrice() {
    try {
        const simulatedPrice = 6.0 + Math.random() * 0.8; 
        return simulatedPrice; 
    } catch (e) {
        console.error("TronSave fetch failed, returning 0.");
        return 0; 
    }
}

// 3. Energy Hub: Average (6.8 to 7.3 TRX)
async function fetchEnergyHubPrice() {
    try {
        const simulatedPrice = 6.8 + Math.random() * 0.5; 
        return simulatedPrice; 
    } catch (e) { return 0; }
}

// 4. Tronex Energy: Thoda mehenga (7.0 to 7.8 TRX)
async function fetchTronexPrice() {
    try {
        const simulatedPrice = 7.0 + Math.random() * 0.8;
        return simulatedPrice; 
    } catch (e) {
        console.error("Tronex fetch failed, returning 0.");
        return 0;
    }
}

// 5. SunPool Energy: Sabse mehenga (8.0 to 9.0 TRX)
async function fetchSunPoolPrice() {
    try {
        const simulatedPrice = 8.0 + Math.random() * 1.0;
        return simulatedPrice; 
    } catch (e) { return 0; }
}

// 6. JustLend DAO: Reference Price (7.5 to 8.5 TRX)
async function fetchJustLendPrice() {
    try {
        const simulatedPrice = 7.5 + Math.random() * 1.0;
        return simulatedPrice; 
    } catch (e) { return 0; }
}


// --- CORE AGGREGATOR FUNCTION (UPDATED) ---

async function fetchAndSavePrices() {
    console.log('--- Starting price aggregation ---');
    
    // Providers aur unke corresponding fetch functions ko combine karo
    const fetchers = [
        { ...PROVIDERS_LIST[0], fetchFunction: fetchTRXSmartRentPrice },
        { ...PROVIDERS_LIST[1], fetchFunction: fetchTronSavePrice },
        { ...PROVIDERS_LIST[2], fetchFunction: fetchEnergyHubPrice },
        { ...PROVIDERS_LIST[3], fetchFunction: fetchTronexPrice },
        { ...PROVIDERS_LIST[4], fetchFunction: fetchSunPoolPrice },
        { ...PROVIDERS_LIST[5], fetchFunction: fetchJustLendPrice },
    ];
    
    for (const provider of fetchers) {
        try {
            // 💡 Call the specific fetch function
            const price = await provider.fetchFunction(); 
            
            // 🛑 Important: Agar price 0 aati hai, to save mat karo
            if (price <= 5.0) { // Price 5 TRX se kam nahi ho sakta
                throw new Error("Price is unrealistically low/Failed.");
            }
            
            const priceEntry = new Price({
                providerName: provider.name,
                price_TRX_per_65k: price,
                rentalDuration: '1 Day', 
                reliabilityScore: provider.reliability,
                sourceUrl: provider.link, // ✅ Final Redirect URL
            });

            await priceEntry.save();
            console.log(`[SUCCESS] Saved price for: ${provider.name} @ ${price.toFixed(2)} TRX`);

        } catch (error) {
            console.error(`[CRITICAL ERROR] Failed to process data for ${provider.name}. Details:`, error.message);
        }
    }
    console.log('--- Aggregation finished ---');
}

module.exports = { fetchAndSavePrices };