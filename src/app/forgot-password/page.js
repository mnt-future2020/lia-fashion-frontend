'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '../../lib/axios';
import Link from 'next/link';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/forgot-password', { email });
            setSuccess(true);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset link');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
                <div>
                    <h2 className="text-3xl font-bold text-center">Reset Password</h2>
                    <Link href="/login" className="block mt-2 text-center text-blue-600 hover:text-blue-800">
                        Back to Login
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
                        Reset link has been sent to your email
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                        >
                            Send Reset Link
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
