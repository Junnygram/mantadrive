'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Download, Lock, Eye, Clock, Shield } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';

export default function ShareWithPhrasePage() {
  const params = useParams();
  const phraseId = params.id;

  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phrase, setPhrase] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // For demo purposes, check if the phrase ID matches the demo phrase
    if (phraseId === '12345') {
      // Pre-populate the phrase field with the demo phrase
      setPhrase('12345');
    }
    setLoading(false);
  }, [phraseId]);

  const handleAuthenticate = async (e) => {
    e.preventDefault();
    
    // For demo purposes, only accept phrase "12345"
    if (phrase === '12345') {
      setLoading(true);
      
      try {
        // In a real implementation, this would make an API call to verify the phrase
        // For demo, we'll simulate a successful response
        setTimeout(() => {
          setShareData({
            filename: 'demo-document.pdf',
            size: 1024 * 1024 * 2.5, // 2.5 MB
            content_type: 'application/pdf',
            url: '#', // Demo URL
            created_at: new Date().toISOString()
          });
          setAuthenticated(true);
          setLoading(false);
          toast.success('Access granted!');
        }, 1000);
      } catch (err) {
        setError('Failed to authenticate');
        setLoading(false);
      }
    } else {
      setError('Invalid phrase. For demo, use "12345"');
    }
  };

  const downloadFile = async () => {
    setDownloading(true);

    try {
      // In a real implementation, this would download from the actual file URL
      // For demo purposes, we'll simulate a download
      toast.success('Demo download started');
      
      setTimeout(() => {
        const blob = new Blob(['Demo file content'], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', shareData?.filename || 'demo-document.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        setDownloading(false);
      }, 1500);
    } catch (err) {
      setError('Download failed');
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-lg text-center">
          <div className="mb-2">
            <Shield className="h-8 w-8 mx-auto mb-2" />
          </div>
          <h1 className="text-xl font-bold">Secure File Share</h1>
          <p className="text-purple-100 text-sm">Access via MantaDrive</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
              {error}
            </div>
          )}

          {!authenticated ? (
            <form onSubmit={handleAuthenticate} className="space-y-4">
              <div className="text-center mb-4">
                <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h2 className="text-lg font-semibold text-gray-800">Enter Access Phrase</h2>
                <p className="text-sm text-gray-600">This file is protected by a phrase. Enter it to gain access.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Phrase
                </label>
                <input
                  type="text"
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  placeholder="Enter access phrase"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">For demo purposes, use "12345"</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Access File'}
              </button>
            </form>
          ) : shareData ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">File Ready for Download</h2>
                <p className="text-sm text-gray-600">This file has been shared securely with you</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Filename:</span>
                  <span className="text-sm text-gray-900 font-mono">{shareData.filename}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Size:</span>
                  <span className="text-sm text-gray-900">{formatFileSize(shareData.size)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Type:</span>
                  <span className="text-sm text-gray-900">{shareData.content_type}</span>
                </div>
                {shareData.created_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Shared on:</span>
                    <span className="text-sm text-gray-900">{formatDate(shareData.created_at)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center text-xs text-gray-500 space-x-2">
                <Clock className="h-3 w-3" />
                <span>This link may expire after download or time limit</span>
              </div>

              <button
                onClick={downloadFile}
                disabled={downloading}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>{downloading ? 'Downloading...' : 'Download File'}</span>
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Powered by MantaDrive - Privacy-first file sharing
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Access Denied</h2>
              <p className="text-sm text-gray-600">This share link is invalid or has expired.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}