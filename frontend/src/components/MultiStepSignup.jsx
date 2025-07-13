'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function MultiStepSignup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleNextStep = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Signup endpoint:', process.env.NEXT_PUBLIC_SIGNUP_ENDPOINT);
      console.log('Sending signup data:', formData);
      
      const response = await fetch(process.env.NEXT_PUBLIC_SIGNUP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('Signup response status:', response.status);
      const data = await response.json();
      console.log('Signup response data:', data);

      if (response.ok || response.status === 201) {
        toast.success('Account created successfully!');
        // Store token if provided in response
        if (data.token) {
          localStorage.setItem('token', data.token);
          
          // Call backend to create S3 folders
          try {
            console.log('Creating S3 folders for user...');
            console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
            console.log('Token:', data.token.substring(0, 20) + '...');
            
            const folderResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/create-user-folders`, {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${data.token}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('Folder creation status:', folderResponse.status);
            
            if (folderResponse.ok) {
              const folderData = await folderResponse.json();
              console.log('S3 folder creation response:', folderData);
            } else {
              const errorText = await folderResponse.text();
              console.error('Failed to create S3 folders:', folderResponse.status, errorText);
            }
          } catch (folderError) {
            console.error('Error creating S3 folders:', folderError);
            // Don't block signup process if folder creation fails
          }
        }
        
        router.push('/login');
        setFormData({
          firstName: '',
          lastName: '',
          username: '',
          password: '',
        });
      } else {
        toast.error(
          data?.message || data?.errors?.[0]?.message || 'Signup failed'
        );
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center mb-6">
            Create Account
          </h2>

          <div className="flex justify-center mb-6">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              1
            </div>
            <div className="w-16 h-0.5 bg-gray-200 mt-4"></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              2
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Personal Information</h3>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleNextStep}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Account Details</h3>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="relative mb-4">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
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
              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
