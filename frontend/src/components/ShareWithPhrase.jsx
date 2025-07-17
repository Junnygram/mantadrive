'use client';
import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareWithPhrase({ file }) {
  const [phrase, setPhrase] = useState(''); // Empty by default
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isValidPhrase, setIsValidPhrase] = useState(false);

  const handlePhraseChange = (e) => {
    const value = e.target.value;
    setPhrase(value);
    // Check if phrase is valid (12345)
    setIsValidPhrase(value === '12345');
  };

  const handleShare = async () => {
    if (!file || !file.s3_url) {
      toast.error('No file selected for sharing');
      return;
    }

    if (!phrase) {
      toast.error('Please enter a phrase');
      return;
    }

    setIsSharing(true);
    try {
      // Make API call to create phrase share
      const response = await fetch('https://api.mantahq.com/api/workflow/olaleye/mantadrive/createphraseshare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          s3_url: file.s3_url,
          phrase: phrase,
          username: JSON.parse(atob(localStorage.getItem('token').split('.')[1])).username
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Generate share URL
        const shareId = file.s3_url.split('/').pop() || Date.now().toString();
        const generatedShareUrl = `${window.location.origin}/share/phrase/${shareId}`;
        
        setShareUrl(generatedShareUrl);
        
        // Automatically copy to clipboard
        navigator.clipboard.writeText(generatedShareUrl);
        setCopied(true);
        
        if (phrase === '12345') {
          toast.success('Copied for sharing!');
        } else {
          toast.success('Not copied for sharing');
        }
        
        // Reset copied status after 3 seconds
        setTimeout(() => setCopied(false), 3000);
      } else {
        toast.error(data.message || 'Failed to create share link');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      toast.error('Failed to create share link');
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      
      // Reset copied status after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <h3 className="font-medium text-lg text-gray-900 mb-4">Share with Phrase</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Enter Phrase
        </label>
        <input
          type="text"
          value={phrase}
          onChange={handlePhraseChange}
          placeholder="Enter your phrase (hint: try 12345)"
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      
      {shareUrl ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Share Link
          </label>
          <div className="flex">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none"
            />
            <button
              onClick={copyToClipboard}
              className="bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg px-3 hover:bg-gray-200"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Share this link with others. They will need the phrase to access the file.
          </p>
        </div>
      ) : (
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition duration-200 disabled:opacity-50 flex items-center justify-center"
        >
          {isSharing ? (
            'Creating share link...'
          ) : (
            <>
              <Share2 className="h-4 w-4 mr-2" />
              {phrase ? 'Send' : 'Share with Phrase'}
            </>
          )}
        </button>
      )}
      
      {shareUrl && (
        <div className={`mt-4 p-3 ${isValidPhrase ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'} rounded-lg`}>
          <div className="flex items-center">
            <Check className={`h-5 w-5 ${isValidPhrase ? 'text-green-600' : 'text-yellow-600'} mr-2`} />
            <span className={`${isValidPhrase ? 'text-green-800' : 'text-yellow-800'} font-medium`}>
              {isValidPhrase ? 'Copied for sharing!' : 'Not copied for sharing'}
            </span>
          </div>
          <p className={`text-sm ${isValidPhrase ? 'text-green-700' : 'text-yellow-700'} mt-1`}>
            {isValidPhrase 
              ? 'Send this link to the user. They will need to enter the phrase to access the file.' 
              : 'The phrase you entered is not the special phrase (12345).'}  
          </p>
        </div>
      )}
    </div>
  );
}