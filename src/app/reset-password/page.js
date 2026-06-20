'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from '../../lib/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, KeyRound, Mail, ArrowRight, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        password_confirmation: '',
        token: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const email = searchParams.get('email');
        if (token && email) {
            setFormData(prev => ({ ...prev, token, email }));
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await axios.post('/api/reset-password', formData);
            // Use toast or alert as in login page
            alert('Password reset successful');
            router.push('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Set New Password</CardTitle>
                    <CardDescription className="text-center">
                        Enter your new password below to reset your account password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                required
                                placeholder="New Password"
                                className="pl-10 pr-10"
                                value={formData.password}
                                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-8 w-8 p-0"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                            </Button>
                        </div>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="password_confirmation"
                                required
                                placeholder="Confirm New Password"
                                className="pl-10 pr-10"
                                value={formData.password_confirmation}
                                onChange={e => setFormData(prev => ({ ...prev, password_confirmation: e.target.value }))}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-8 w-8 p-0"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">{showConfirmPassword ? 'Hide password' : 'Show password'}</span>
                            </Button>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center">
                                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                                    Resetting...
                                </span>
                            ) : (
                                <>
                                    Reset Password
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 border-t pt-4">
                    <div className="text-center text-sm">
                        <Button
                            variant="link"
                            onClick={() => router.push('/login')}
                            className="text-[#EC008C] font-semibold underline underline-offset-4 hover:text-[#D1007D]"
                        >
                            Back to Login
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
