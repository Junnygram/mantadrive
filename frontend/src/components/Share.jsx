'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import { Lock } from 'lucide-react';

export default function Share() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [error, setError] = useState('');
  const [phrase, setPhrase] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [needsPhrase, setNeedsPhrase] = useState(false);

  useEffect(() => {
    const urlPhrase = searchParams.get('phrase');
    
    if (urlPhrase) {
      // If phrase is provided in URL, verify it directly
      verifyPhrase(urlPhrase);
    } else {
      // If no phrase in URL, show phrase input form
      setNeedsPhrase(true);
      setLoading(false);
    }
  }, [searchParams]);

  const verifyPhrase = async (phraseToVerify) => {
    setIsVerifying(true);
    
    try {
      // For demo purposes, we're checking if the phrase is 12345
      if (phraseToVerify === '12345') {
        // In a real app, you would fetch the shared content from your API
        // For demo, we'll just show a placeholder
        setContent({
          type: 'image',
          url: '/image/demo-shared-content.png',
          title: 'Demo Shared Content'
        });
        setNeedsPhrase(false);
      } else {
        setError('Invalid phrase. Please try again.');
        setNeedsPhrase(true);
      }
    } catch (error) {
      console.error('Error verifying phrase:', error);
      setError('Failed to verify phrase. Please try again.');
      setNeedsPhrase(true);
    } finally {
      setIsVerifying(false);
      setLoading(false);
    }
  };

  const handleSubmitPhrase = (e) => {
    e.preventDefault();
    if (!phrase.trim()) {
      toast.error('Please enter a phrase');
      return;
    }
    verifyPhrase(phrase);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="text-xl font-semibold text-purple-800">Loading shared content...</div>
      </div>
    );
  }

  if (needsPhrase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Access Protected Content</h2>
            <p className="text-gray-600 mt-2">Enter the phrase to view this shared content</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmitPhrase}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Phrase
              </label>
              <input
                type="text"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder="Enter the phrase (hint: try 12345)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition duration-200 disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Access Content'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <a href="/" className="text-purple-600 hover:underline text-sm">
              Return to MantaDrive
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="max-w-4xl w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center text-purple-800 mb-6">
            {content.title}
          </h1>
          
          {content.type === 'image' && (
            <div className="flex justify-center">
              <div className="relative w-full max-w-2xl h-96">
                <Image 
                  src={content.url} 
                  alt={content.title} 
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            </div>
          )}
          
          {content.type === 'document' && (
            <div className="border border-gray-300 rounded-lg p-4">
              <p className="text-gray-700">{content.text}</p>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">This content was shared with you via MantaDrive</p>
            <a href="/" className="text-purple-600 hover:underline">
              Sign in to MantaDrive
            </a>
          </div>
        </div>
      </div>
    </>
  );
}