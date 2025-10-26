// app/page.tsx
'use client'; 

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 1. Data Model: Backend से आने वाले नए फ़ील्ड्स को शामिल किया गया
interface PriceData {
    _id: string;
    providerName: string;
    price_TRX_per_65k: number;
    rentalDuration: string;
    sourceUrl: string;
    reliabilityScore: number;
    fetchedAt: string;
    // ✅ NEW FIELDS from Backend Calculation (routes/comparison.js se aayenge)
    calculated_cost?: string; // Final calculated cost as string
    user_duration?: number;
    user_energy?: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const BASE_BURN_COST = 14.5; 

// --- AuthWrapper Component (Fixes localStorage Error) ---
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
    const [authChecked, setAuthChecked] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('x-auth-token');
        
        if (!token) {
            router.replace('/login'); 
        } else {
            setAuthChecked(true); 
        }
    }, [router]);

    if (!authChecked) {
        return <div className="flex items-center justify-center min-h-screen text-2xl bg-gray-100">Checking Authentication...</div>;
    }

    return <>{children}</>;
};
// --------------------------------------------------------------------------

// --- Main Comparison Component ---
const ComparisonContent = () => {
    const [prices, setPrices] = useState<PriceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Hero Calculator States (User Input)
    const [energyNeeded, setEnergyNeeded] = useState(65000); 
    const [rentalDays, setRentalDays] = useState(1);
    const [userCost, setUserCost] = useState(0); // Final calculated cost for the best deal


    // --- User Actions ---
    const handleLogout = () => {
        localStorage.removeItem('x-auth-token');
        router.push('/login');
    };

    // --- Data Fetching Logic (Sends User Params to Backend) ---
    const fetchPrices = async () => {
        const token = localStorage.getItem('x-auth-token') || '';
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${BACKEND_URL}/compare`, {
                headers: { 'x-auth-token': token },
                params: { 
                    amount: energyNeeded, 
                    duration: rentalDays 
                }
            });
            setPrices(response.data);
        } catch (err: any) {
            if (err.response && err.response.status === 401) {
                handleLogout(); // Token expired
            } else {
                setError("Data fetch failed. Check backend connection.");
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Data Fetch Trigger ---
    useEffect(() => {
        const token = localStorage.getItem('x-auth-token');
        // fetchPrices ko turant call karo agar koi input change ho ya component mount ho
        if (token) {
            fetchPrices(); 
            const interval = setInterval(fetchPrices, 60000); 
            return () => clearInterval(interval);
        }
    }, [energyNeeded, rentalDays]); 


    // --- Transaction Logging (Final Action) ---
    const handleRentNow = async (data: PriceData) => {
        const token = localStorage.getItem('x-auth-token');
        // Ensure calculated_cost is present before logging and redirecting
        if (!token || !data.calculated_cost) return handleLogout(); 

        const finalCost = parseFloat(data.calculated_cost); 
        
        try {
            // 1. Transaction Log karein (price_TRX mein final calculated cost bhejein)
            await axios.post(`${BACKEND_URL}/history`, {
                providerName: data.providerName,
                price_TRX: finalCost, // ✅ FINAL CALCULATED COST SENT FOR LOGGING
                rentedEnergy: energyNeeded,
                rentalDuration: `${rentalDays} Day(s)`,
            }, {
                headers: { 'x-auth-token': token },
            });
            
            // 2. User ko provider ki website par redirect karein
            window.open(data.sourceUrl, '_blank');
        } catch (error) {
            // Agar logging fail ho (par redirect ho gaya ho)
            alert(`Warning: Transaction log failed on our server. Redirecting to ${data.providerName}...`);
            window.open(data.sourceUrl, '_blank');
            console.error("Logging error:", error);
        }
    };


    // --- Real-Time Calculation for Hero Section ---
    const calculatedDeals = useMemo(() => {
        if (!prices.length) return { bestDeal: null, maxSavings: 0 };
        
        const bestDeal = prices[0];
        
        // Use the calculated_cost sent by backend for display
        const totalCost = parseFloat(bestDeal.calculated_cost || '0'); 
        setUserCost(totalCost); 
        
        const totalBurnCost = (energyNeeded / 65000) * BASE_BURN_COST * rentalDays;
        const maxSavings = totalBurnCost - totalCost;

        return { bestDeal, maxSavings };
    }, [prices, energyNeeded, rentalDays]);


    // --- UI RENDERING ---
    return (
        <div className="min-h-screen bg-gray-50">
            
            {/* --- Navigation Bar --- */}
            <nav className="bg-gray-800 text-white p-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold hover:text-blue-300 transition duration-200">
                        TRX Sasta Energy
                    </Link>
                    <div className="space-x-4">
                        <Link href="/history" className="hover:text-yellow-400 transition duration-200 font-medium">
                            Transaction History
                        </Link>
                        <button 
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded text-sm transition duration-200"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* 1. Hero Section: The Savings Calculator */}
            <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
                        TRX Sasta Energy: Instant Savings.
                    </h1>
                    <p className="text-xl opacity-90 mb-8">
                        Stop burning TRX! Find the cheapest Energy rental to cut your transaction fees by up to 90%.
                    </p>
                    
                    <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl text-gray-800">
                        <h2 className="text-3xl font-bold mb-6 text-blue-700">Calculate Your Savings</h2>
                        
                        {/* Input Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Energy Input */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-left">Energy Required (Approx.)</label>
                                <select 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={energyNeeded}
                                    onChange={(e) => setEnergyNeeded(Number(e.target.value))}
                                >
                                    <option value={65000}>65,000 (1 USDT Transfer)</option>
                                    <option value={130000}>130,000 (2 USDT Transfers)</option>
                                    <option value={500000}>500,000 (Heavy Use)</option>
                                </select>
                            </div>

                            {/* Duration Input */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-left">Rental Duration (Days)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={rentalDays}
                                    onChange={(e) => setRentalDays(Number(e.target.value) || 1)}
                                    min="1"
                                    max="30"
                                />
                            </div>

                            {/* Estimated Cost/Savings */}
                            <div className="flex flex-col justify-center bg-green-100 rounded-lg p-3">
                                <span className="text-sm font-medium text-left text-green-700">Estimated Cost:</span>
                                <span className="text-2xl font-extrabold text-green-800">
                                    {loading ? '...' : userCost.toFixed(2)} TRX
                                </span>
                            </div>
                        </div>

                        {/* Savings Display */}
                        <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4" role="alert">
                            {calculatedDeals.bestDeal ? (
                                <p className="font-bold text-lg">
                                    You Save: <span className="text-red-700">{calculatedDeals.maxSavings > 0 ? calculatedDeals.maxSavings.toFixed(2) : '0.00'} TRX</span>{" "} 
                                    per day by renting from <span className="font-extrabold">{calculatedDeals.bestDeal.providerName}</span>!
                                </p>
                            ) : (
                                <p>Loading the best deals to calculate savings...</p>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            
            {/* --- Comparison Table Section --- */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-10 text-gray-800">
                        Real-Time TRX Energy Prices
                    </h2>

                    {loading && <p className="text-center text-blue-500 text-lg">Fetching latest deals...</p>}
                    {error && <p className="text-center text-red-500 border p-3 rounded">{error}</p>}

                    {/* Price Comparison Table */}
                    {!loading && !error && prices.length > 0 && (
                        <div className="shadow-2xl rounded-xl overflow-hidden border border-gray-200">
                            <table className="min-w-full bg-white divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                                        <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Price ({energyNeeded.toLocaleString()} Energy)</th>
                                        <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Reliability</th>
                                        <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {prices.map((data, index) => (
                                        <tr 
                                            key={data._id} 
                                            className={index === 0 ? "bg-green-50 border-l-4 border-green-500 shadow-inner" : "hover:bg-gray-50 transition duration-150"}
                                        >
                                            <td className="py-4 px-4 text-left font-semibold text-gray-900">
                                                {index === 0 ? "⭐ BEST DEAL: " : ""}
                                                {data.providerName}
                                            </td>
                                            
                                            {/* ✅ FINAL COST DISPLAY FIX */}
                                            <td className="py-4 px-4 text-center text-2xl font-extrabold text-blue-600">
                                                {data.calculated_cost || data.price_TRX_per_65k.toFixed(2)} TRX 
                                                {data.user_duration && (
                                                    <span className="text-sm font-normal text-gray-500 block">
                                                        /{data.user_duration} Day(s)
                                                    </span>
                                                )}
                                            </td>
                                            
                                            <td className="py-4 px-4 text-center text-gray-600">
                                                {data.reliabilityScore.toFixed(1)} / 5
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    onClick={() => handleRentNow(data)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                                                >
                                                    Rent Now
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-3 bg-gray-100 text-right text-sm text-gray-500">
                                Last updated: {prices.length > 0 ? new Date(prices[0].fetchedAt).toLocaleTimeString() : 'N/A'} (Refreshes every minute)
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* --- Footer/FAQ Section --- */}
            <footer className="bg-gray-800 text-white py-12 mt-10">
                <div className="max-w-4xl mx-auto px-4">
                    <h3 className="text-3xl font-bold mb-6 text-center text-blue-400">
                        FAQs: Your Questions Answered
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <p className="font-semibold text-lg">Q: Why rent Energy instead of burning TRX?</p>
                            <p className="text-gray-300 mt-2">A: Renting can cut the cost of a single USDT transfer from ~14.5 TRX to often less than 7 TRX, saving you over 50% on every transaction.</p>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <p className="font-semibold text-lg">Q: Is this platform safe?</p>
                            <p className="text-gray-300 mt-2">A: Yes. TRX Sasta Energy is a comparison tool. We never ask for your private keys or wallet access. You always rent directly from the chosen provider's website.</p>
                        </div>
                    </div>
                    <p className="text-center text-sm mt-8 opacity-70">
                        &copy; {new Date().getFullYear()} TRX Sasta Energy. Powering cheaper TRON transactions.
                    </p>
                </div>
            </footer>
        </div>
    );
};


// Main Export will render the wrapper, which handles the localStorage check
export default function HomeWrapper() {
    return (
        <AuthWrapper>
            <ComparisonContent />
        </AuthWrapper>
    );
}