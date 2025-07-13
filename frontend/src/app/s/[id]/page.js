'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Cloud, Download, Lock, Eye, EyeOff, Shield, 
  Clock, MapPin, AlertTriangle, CheckCircle 
} from 'lucide-react';

export default function SharedFile() {
  const params = useParams();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessForm, setAccessForm] = useState({
    password: '',
    accessKey: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);

  useEffect(() => {
    fetchFileData();
  }, [params.id]);

  const fetchFileData = async () => {
    try {
      const response = await fetch(`/api/share/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setFileData(data);
        // Check if file requires authentication
        if (!data.requiresAuth) {
          setAccessGranted(true);
        }
      } else {
        setError(data.message || 'File not found or expired');
      }
    } catch (error) {
      setError('Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/share/${params.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accessForm),
      });

      const data = await response.json();

      if (response.ok) {
        setAccessGranted(true);
        setFileData(prev => ({ ...prev, ...data }));
      } else {
        setError(data.message || 'Access denied');
      }
    } catch (error) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/share/${params.id}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accessForm),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setDownloadCount(prev => prev + 1);
      } else {
        const data = await response.json();
        setError(data.message || 'Download failed');
      }
    } catch (error) {
      setError('Download failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Cloud className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            This file may have expired, been removed, or requires valid credentials.
          </div>
        </div>
      </div>
    );
  }

  if (!accessGranted && fileData?.requiresAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure File Access</h1>
            <p className="text-gray-600">This file is protected. Please provide the required credentials.</p>
          </div>

          <form onSubmit={handleAccessSubmit} className="space-y-6">
            {fileData.protection?.password && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="Enter password"
                    value={accessForm.password}
                    onChange={(e) => setAccessForm({ ...accessForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {fileData.protection?.accessKey && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Key
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Enter access key"
                  value={accessForm.accessKey}
                  onChange={(e) => setAccessForm({ ...accessForm, accessKey: e.target.value })}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Access File'}
            </button>
          </form>

          {/* Protection Info */}
          <div className="mt-6 space-y-3">
            {fileData.protection?.expiresAt && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Expires: {new Date(fileData.protection.expiresAt).toLocaleString()}</span>
              </div>
            )}
            {fileData.protection?.downloadLimit && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Download className="h-4 w-4" />
                <span>Download limit: {fileData.protection.downloadLimit}</span>
              </div>
            )}
            {fileData.protection?.geoRestriction && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>Geographic restrictions apply</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">File Ready</h1>
          <p className="text-gray-600">Your file is ready for download</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Cloud className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 truncate">{fileData.name}</h3>
              <p className="text-sm text-gray-500">
                {(fileData.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>File type:</span>
              <span className="font-medium">{fileData.type}</span>
            </div>
            <div className="flex justify-between">
              <span>Shared:</span>
              <span className="font-medium">{new Date(fileData.sharedAt).toLocaleDateString()}</span>
            </div>
            {fileData.protection?.downloadLimit && (
              <div className="flex justify-between">
                <span>Downloads:</span>
                <span className="font-medium">
                  {downloadCount}/{fileData.protection.downloadLimit}
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="w-full btn-primary py-3 text-lg flex items-center justify-center space-x-2"
        >
          <Download className="h-5 w-5" />
          <span>Download File</span>
        </button>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-medium text-blue-600">MantaDrive</span>
          </p>
        </div>
      </div>
    </div>
  );
}