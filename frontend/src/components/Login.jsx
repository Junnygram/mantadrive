'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Login successful!');
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        toast.error(data?.errors?.[0]?.message);
        // toast.error(data?.message || data?.errors?.[0]?.message || 'Invalid credentials');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 mb-4 relative overflow-hidden rounded-full border-4 border-purple-500 shadow-lg">
              <Image 
                src="/image/avatar.png" 
                alt="User Avatar" 
                width={96} 
                height={96} 
                className="object-cover"
              />
            </div>
            <h2 className="text-2xl font-bold text-center text-purple-800">Welcome Back</h2>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={credentials.username}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={credentials.password}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center mt-4 text-gray-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-purple-600 hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
