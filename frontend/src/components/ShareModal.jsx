'use client';
import { useState, useEffect, useRef } from 'react';
import { Share2, Copy, Check, Lock, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ShareModal({ file, isOpen, onClose }) {
  const [shareKey, setShareKey] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const modalRef = useRef(null);

  if (!isOpen || !file) return null;

  const generateRandomKey = () => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    setGeneratedKey(result);
  };

  const handleGenerateShare = async () => {
    const accessKey = useCustomKey
      ? shareKey
      : generatedKey ||
        (() => {
          generateRandomKey();
          return generatedKey;
        })();

    if (!accessKey) {
      toast.error('Please provide an access key');
      return;
    }

    setIsGenerating(true);

    try {
      const { backendApi } = await import('../lib/mantaApi');

      // Use the anonymous share endpoint instead of protected share
      const response = await backendApi.createAnonymousShare(
        file.id,
        {
          accessKey: accessKey,
          expiresIn: 24, // 24 hours
          maxDownloads: 5, // Limit to 5 downloads
        },
        localStorage.getItem('token')
      );

      setShareLink(response.share_url || response.shareUrl);

      // Check if the key is "12345" for special message
      if (accessKey === '12345') {
        toast.success('Copied for sharing!');
      } else {
        toast.success('Not copied for sharing');
      }
    } catch (error) {
      console.error('Error generating anonymous share:', error);
      toast.error('Failed to generate share link');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const resetModal = () => {
    setShareKey('');
    setGeneratedKey('');
    setShareLink('');
    setCopied(false);
    setUseCustomKey(false);
    setIsGenerating(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Generate initial key when modal opens
  if (isOpen && !generatedKey && !useCustomKey) {
    generateRandomKey();
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center space-x-2">
            <Share2 className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium text-lg text-gray-900">
              Anonymous Share
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                <Share2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>

          {!shareLink ? (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Access Protection
                  </label>
                  <button
                    type="button"
                    className="text-xs text-purple-600 hover:text-purple-800"
                    onClick={() => {
                      setUseCustomKey(!useCustomKey);
                      if (!useCustomKey) {
                        setShareKey('');
                      }
                    }}
                  >
                    {useCustomKey ? 'Use generated key' : 'Use custom key'}
                  </button>
                </div>

                {useCustomKey ? (
                  <input
                    type="text"
                    placeholder="Enter access key/phrase"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={shareKey}
                    onChange={(e) => setShareKey(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                      value={generatedKey}
                      readOnly
                    />
                    <button
                      type="button"
                      className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
                      onClick={generateRandomKey}
                    >
                      <RefreshCw className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Recipients will need this key to access the shared file
                </p>
              </div>

              <button
                disabled
                type="button"
                className="btn-primary w-full flex items-center justify-center"
                onClick={handleGenerateShare}
                // disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="bg-green-50 text-green-800 p-3 rounded-lg mb-4 flex items-center">
                <Check className="h-5 w-5 mr-2 text-green-600" />
                <span className="text-sm">
                  {(useCustomKey ? shareKey : generatedKey) === '12345'
                    ? 'Copied for sharing!'
                    : 'Not copied for sharing'}
                </span>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Link
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 text-sm"
                    value={shareLink}
                    readOnly
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onClick={() => copyToClipboard(shareLink)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center text-amber-700 bg-amber-50 p-3 rounded-lg">
                  <Lock className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">
                      Access Key:{' '}
                      <span className="font-mono">
                        {useCustomKey ? shareKey : generatedKey}
                      </span>
                    </p>
                    <p className="text-xs mt-1">
                      Share this key with the recipient separately for security
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() =>
                    copyToClipboard(useCustomKey ? shareKey : generatedKey)
                  }
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Key
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1"
                  onClick={handleClose}
                >
                  {(useCustomKey ? shareKey : generatedKey) === '12345'
                    ? 'Share'
                    : 'Done'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
