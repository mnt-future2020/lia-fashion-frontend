'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from '../../../lib/axios';
import { toast } from 'react-toastify';

function ResetPasswordForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (email) {
      setFormData(prev => ({ ...prev, email }));
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/admin/reset-password', {
        token,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation
      });
      
      toast.success('Password reset successful', {
        position: "top-right",
        autoClose: 2000,
        onClose: () => router.push('/admin/login')
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Reset Password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="password_confirmation"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              value={formData.password_confirmation}
              onChange={(e) => setFormData(prev => ({ ...prev, password_confirmation: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-md ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/admin/login')}
              className="text-sm text-pink-600 hover:text-pink-800"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
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
