'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Cloud,
  Upload,
  Search,
  Grid,
  List,
  Filter,
  Share2,
  Download,
  Trash2,
  Eye,
  QrCode,
  Settings,
  User,
  LogOut,
  File,
  Folder,
  Image,
  FileText,
  Music,
  Video,
  Archive,
  Brain,
  CheckCircle,
  Bug,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ShareModal from '../../components/ShareModal';
import {
  testDirectMantaHQ,
  testBackendAPI,
  testPostToBackend,
} from '../../lib/apiTest';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [apiTestResults, setApiTestResults] = useState(null);
  const [isApiTesting, setIsApiTesting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchuserauth();
    fetchFiles();
  }, []);

  const fetchuserauth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Decode JWT token to get username
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ username: payload.username });
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const fetchFiles = async () => {
    try {
      const { backendApi } = await import('../../lib/mantaApi');
      const filesData = await backendApi.getFiles(
        localStorage.getItem('token')
      );
      // Ensure filesData is an array before setting it
      setFiles(Array.isArray(filesData) ? filesData : []);
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      const { backendApi } = await import('../../lib/mantaApi');

      // Simulate upload progress (replace with actual progress tracking when available)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const token = localStorage.getItem('token');
      console.log('Upload token:', token ? 'Present' : 'Missing');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      await backendApi.uploadFile(file, token);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);

      // Refresh file list after a short delay to show success state
      setTimeout(() => {
        fetchFiles();
        setIsUploading(false);
      }, 1000);
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsUploading(false);

      // Show specific error message
      if (error.message.includes('Authorization')) {
        toast.error('Please log in again to upload files');
      } else if (error.message.includes('S3')) {
        toast.error('Storage service unavailable. Please try again later.');
      } else if (error.message.includes('No authentication token')) {
        toast.error('Please log in again to upload files');
      } else {
        toast.error(`Upload failed: ${error.message}`);
      }

      setUploadSuccess(false);
      setUploadProgress(0);
    }
  };

  const generateShareLink = async (fileId) => {
    try {
      const { backendApi } = await import('../../lib/mantaApi');

      // Generate a random access key for quick share
      const generateRandomKey = () => {
        const characters =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return result;
      };

      const accessKey = generateRandomKey();

      // Use anonymous share for quick sharing
      const response = await backendApi.createAnonymousShare(
        fileId,
        {
          accessKey: accessKey,
          expiresIn: 24, // 24 hours
          maxDownloads: 3, // Limit to 3 downloads
        },
        localStorage.getItem('token')
      );

      const shareUrl = response.share_url || response.shareUrl;

      // Copy both the link and access key to clipboard
      const shareText = `Link: ${shareUrl}\nAccess Key: ${accessKey}`;
      navigator.clipboard.writeText(shareText);

      toast.success('Share link and access key copied to clipboard!');
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Failed to generate share link');
    }
  };

  const generateQRCode = async (fileId) => {
    try {
      const { backendApi } = await import('../../lib/mantaApi');

      // First create an anonymous share
      const generateRandomKey = () => {
        const characters =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return result;
      };

      const accessKey = generateRandomKey();

      // Create anonymous share
      const shareResponse = await backendApi.createAnonymousShare(
        fileId,
        {
          accessKey: accessKey,
          expiresIn: 24, // 24 hours
          maxDownloads: 5, // Limit to 5 downloads
        },
        localStorage.getItem('token')
      );

      const shareUrl = shareResponse.share_url || shareResponse.shareUrl;

      // Then generate QR code
      const { qrCode } = await backendApi.generateQRCode(
        fileId,
        localStorage.getItem('token')
      );

      // Open QR code in new window with access key information
      const newWindow = window.open();
      newWindow.document.write(`
        <html>
          <head>
            <title>MantaDrive QR Code</title>
            <style>
              body { font-family: system-ui, sans-serif; text-align: center; padding: 20px; }
              .container { max-width: 500px; margin: 0 auto; }
              .qr-code { margin-bottom: 20px; }
              .access-key { background: #f3f4f6; padding: 10px; border-radius: 5px; margin-top: 20px; }
              .key { font-family: monospace; font-weight: bold; font-size: 18px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>MantaDrive QR Code</h2>
              <div class="qr-code">
                <img src="${qrCode}" alt="QR Code" style="max-width: 100%; height: auto;" />
              </div>
              <p>Scan this QR code to access the shared file</p>
              <div class="access-key">
                <p>Access Key:</p>
                <p class="key">${accessKey}</p>
                <p><small>Share this key separately with the recipient</small></p>
              </div>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const openShareModal = (file) => {
    setFileToShare(file);
    setShareModalOpen(true);
  };

  const deleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const { backendApi } = await import('../../lib/mantaApi');
      await backendApi.deleteFile(fileId, localStorage.getItem('token'));
      toast.success('File deleted successfully');
      fetchFiles(); // Refresh the file list
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const downloadFile = async (fileId, fileName) => {
    try {
      const { backendApi } = await import('../../lib/mantaApi');
      const response = await backendApi.downloadFile(
        fileId,
        localStorage.getItem('token')
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (fileType.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (fileType.startsWith('audio/')) return <Music className="h-5 w-5" />;
    if (fileType.includes('pdf') || fileType.includes('document'))
      return <FileText className="h-5 w-5" />;
    if (fileType.includes('zip') || fileType.includes('rar'))
      return <Archive className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const filteredFiles = Array.isArray(files)
    ? files.filter((file) =>
        file.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Cloud className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50">
      <Toaster position="top-right" />
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="responsive-container">
          <div className="flex flex-col md:flex-row justify-between items-center py-4 gap-4">
            <div className="flex flex-col md:flex-row items-center md:space-x-4 w-full md:w-auto gap-4">
              <div className="flex items-center space-x-2">
                <Cloud className="h-8 w-8 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Manta<span className="text-purple-600">Drive</span>
                </h1>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
              <label className="btn-primary cursor-pointer flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Upload
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/dashboard/ai')}
                  className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  <Brain className="h-4 w-4" />
                  <span>AI Features</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${
                      viewMode === 'grid'
                        ? 'bg-purple-100 text-purple-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${
                      viewMode === 'list'
                        ? 'bg-purple-100 text-purple-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative user-dropdown">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-purple-50"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-300">
                      <img
                        src="/image/avatar.png"
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm text-gray-700">
                      {user?.username?.slice(0, 4) || 'User'}
                    </span>
                  </button>
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-30 bg-white rounded-lg shadow-lg border z-10">
                      <button
                        onClick={() => {
                          router.push('/dashboard/profile');
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-purple-50 flex items-center space-x-2"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center space-x-2 text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* <div className="relative user-dropdown">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-purple-50"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-300">
                    <img
                      src="/image/avatar.png"
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm text-gray-700">
                    {user?.username || 'User'}
                  </span>
                </button>
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                    <button className="w-full text-left px-4 py-2 hover:bg-purple-50 flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center space-x-2 text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div> */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="responsive-container py-8">
        {/* Upload Progress Indicator */}
        {isUploading && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">
                Uploading file...
              </span>
              <span className="text-sm text-gray-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-6 bg-green-50 text-green-800 rounded-lg shadow-sm p-4 border border-green-200 flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>File uploaded successfully!</span>
            </div>
            <button
              onClick={() => setUploadSuccess(false)}
              className="text-sm text-green-700 hover:text-green-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {filteredFiles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm p-8">
            <Cloud className="h-16 w-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to MantaDrive!
            </h3>
            <p className="text-gray-600 mb-6">
              Your secure cloud storage is ready. Share or upload your first
              file to get started.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <label className="btn-primary cursor-pointer inline-flex items-center justify-center">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                onClick={() => router.push('/dashboard/share')}
                className="btn-secondary inline-flex items-center justify-center"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share File
              </button>
            </div>
          </div>
        ) : (
          /* Mobile-friendly slim card view for filtered files */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-2 flex items-center justify-between"
                onClick={() => setPreviewFile(file)}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="text-purple-600 flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-medium text-gray-900 truncate text-xs"
                      title={file.name}
                    >
                      {file.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(1)}MB
                    </p>
                  </div>
                </div>

                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()} // Prevent triggering file preview
                >
                  <div className="relative group">
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                      title="More options"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button
                        onClick={() => openShareModal(file)}
                        className="w-full text-left px-3 py-1.5 hover:bg-purple-50 flex items-center space-x-2 text-purple-600 text-xs"
                      >
                        <Share2 className="h-3 w-3" />
                        <span>Share with Key</span>
                      </button>
                      <button
                        onClick={() => generateShareLink(file.id)}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center space-x-2 text-blue-600 text-xs"
                      >
                        <Share2 className="h-3 w-3" />
                        <span>Quick Share</span>
                      </button>
                      <button
                        onClick={() => downloadFile(file.id, file.name)}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center space-x-2 text-xs"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="w-full text-left px-3 py-1.5 hover:bg-red-50 flex items-center space-x-2 text-red-600 text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewFile(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-medium text-lg text-gray-900">
                {previewFile.name}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {previewFile.type?.startsWith('image/') ? (
                <img
                  src={`/api/files/${previewFile.id}/preview`}
                  alt={previewFile.name}
                  className="max-w-full h-auto mx-auto"
                />
              ) : previewFile.type?.includes('pdf') ? (
                <iframe
                  src={`/api/files/${previewFile.id}/preview`}
                  className="w-full h-full min-h-[500px]"
                  title={previewFile.name}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    {getFileIcon(previewFile.type || '')}
                  </div>
                  <p className="text-gray-500">
                    Preview not available for this file type
                  </p>
                  <button
                    onClick={() =>
                      downloadFile(previewFile.id, previewFile.name)
                    }
                    className="mt-4 btn-primary inline-flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </button>
                </div>
              )}
            </div>

            <div className="border-t p-4 flex justify-between items-center bg-gray-50">
              <div className="text-sm text-gray-500">
                {(previewFile.size / 1024 / 1024).toFixed(2)} MB ·{' '}
                {new Date(
                  previewFile.createdAt || Date.now()
                ).toLocaleDateString()}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => generateShareLink(previewFile.id)}
                  className="btn-secondary inline-flex items-center"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
                <button
                  onClick={() => {
                    downloadFile(previewFile.id, previewFile.name);
                    setPreviewFile(null);
                  }}
                  className="btn-primary inline-flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        file={fileToShare}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      {/* API Test Results Modal */}
      {apiTestResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setApiTestResults(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-medium text-lg text-gray-900">
                API Test Results
              </h3>
              <button
                onClick={() => setApiTestResults(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-green-700 mb-2">
                    Direct MantaHQ API Call:
                  </h4>
                  <pre className="bg-gray-50 p-3 rounded overflow-auto text-sm">
                    {JSON.stringify(apiTestResults.direct, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium text-blue-700 mb-2">
                    Backend API Call:
                  </h4>
                  <pre className="bg-gray-50 p-3 rounded overflow-auto text-sm">
                    {JSON.stringify(apiTestResults.backend, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium text-purple-700 mb-2">
                    POST Test:
                  </h4>
                  <pre className="bg-gray-50 p-3 rounded overflow-auto text-sm">
                    {JSON.stringify(apiTestResults.post, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="border-t p-4 flex justify-end">
              <button
                onClick={() => setApiTestResults(null)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
