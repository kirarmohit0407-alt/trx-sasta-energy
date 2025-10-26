// app/history/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Environment variables se backend URL load karein
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';

// History Data ke liye Interface (UPDATED with 'status' field)
interface HistoryEntry {
    _id: string;
    providerName: string;
    price_TRX: number;
    rentedEnergy: number;
    rentalDuration: string;
    date: string;
    // ✅ FIX: Status field added to the interface
    status: 'Logged' | 'Failed' | 'Success'; 
}

// Data ko clean format mein dikhane ke liye helper function
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Helper function to get status badge color (UNCHANGED)
const getStatusColor = (status: string) => {
    switch (status) {
        case 'Success':
            return 'bg-green-100 text-green-800 border-green-400';
        case 'Logged': 
            return 'bg-yellow-100 text-yellow-800 border-yellow-400';
        case 'Failed':
            return 'bg-red-100 text-red-800 border-red-400';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-400';
    }
};

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [authChecked, setAuthChecked] = useState(false);
    const router = useRouter();

    // --- User Actions ---
    const handleLogout = () => {
        localStorage.removeItem('x-auth-token');
        router.push('/login');
    };

    // --- Data Fetching Logic (Memoized) ---
    const fetchHistory = useCallback(async (token: string) => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${BACKEND_URL}/history`, {
                headers: { 'x-auth-token': token },
            });
            setHistory(response.data);
        } catch (err: any) {
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('x-auth-token'); 
                router.replace('/login');
            } else {
                setError('Failed to fetch history data from server.');
            }
        } finally {
            setLoading(false);
        }
    }, [router]);

    // --- Authentication Check and Data Fetch in useEffect ---
    useEffect(() => {
        const token = localStorage.getItem('x-auth-token');

        if (!token) {
            router.replace('/login');
            return;
        }

        fetchHistory(token);
        setAuthChecked(true); 
    }, [router, fetchHistory]); 

    // --- Server Side Loading Screen ---
    if (!authChecked) {
        return <div className="flex items-center justify-center min-h-screen text-2xl bg-gray-100">Checking Authentication...</div>;
    }

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
            
            <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg mt-8 rounded-lg">
                <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-800">
                    Your Transaction History 📜
                </h1>

                {loading && <p className="text-center text-xl text-blue-500 mt-10">Loading your history...</p>}
                {error && <p className="text-center text-xl text-red-500 mt-10 p-4 border border-red-300 bg-red-50 rounded">{error}</p>}

                {!loading && history.length === 0 && !error && (
                    <p className="text-center text-xl text-gray-600 mt-10 p-6 border rounded shadow-md">
                        You haven't rented any TRX Energy through the platform yet.
                    </p>
                )}

                {!loading && history.length > 0 && (
                    <div className="shadow-2xl rounded-lg overflow-hidden border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                                    <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Energy (Units)</th>
                                    <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cost (TRX)</th>
                                    <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th> {/* NEW COLUMN */}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {history.map((entry) => (
                                    <tr key={entry._id} className="hover:bg-gray-50">
                                        <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatDate(entry.date)}
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap text-sm text-blue-600 font-semibold">
                                            {entry.providerName}
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap text-sm text-center text-gray-700">
                                            {entry.rentedEnergy.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap text-base text-center font-bold text-green-700">
                                            {entry.price_TRX.toFixed(2)} TRX
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap text-sm text-center text-gray-700">
                                            {entry.rentalDuration}
                                        </td>
                                        {/* ✅ Status Badge Implementation */}
                                        <td className="py-4 px-6 whitespace-nowrap text-sm text-center">
                                            <span 
                                                className={`inline-flex px-3 py-1 text-xs font-semibold leading-5 rounded-full border ${getStatusColor(entry.status)}`}
                                            >
                                                {entry.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}