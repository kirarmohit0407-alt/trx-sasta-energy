// app/register/page.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Backend URL environment variable se load hoga
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await axios.post(`${BACKEND_URL}/auth/register`, {
                email,
                password,
            });

            // Registration successful hone par
            setMessage(response.data.msg || 'Registration successful! Redirecting to login...');
            
            // Successfully registered hone par user ko login page par bhej do
            setTimeout(() => {
                router.push('/login');
            }, 1500);

        } catch (error: any) {
            // Error handling
            const errorMsg = error.response?.data?.msg || 'Registration failed. Please try again.';
            setMessage(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Create Account</h1>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            id="password"
                            type="password"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    {message && (
                        <p className={`mb-4 text-center text-sm font-semibold ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                            {message}
                        </p>
                    )}

                    <div className="flex items-center justify-between">
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account? 
                        <Link href="/login" className="text-blue-600 hover:text-blue-800 ml-1 font-semibold">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}