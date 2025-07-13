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
} from 'lucide-react';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
      const { backendApi } = await import('../../lib/mantaApi');
      const userauth = await backendApi.getUserProfile(
        localStorage.getItem('token')
      );
      setUser(userauth);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const { backendApi } = await import('../../lib/mantaApi');
      const filesData = await backendApi.getFiles(
        localStorage.getItem('token')
      );
      setFiles(filesData);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const { backendApi } = await import('../../lib/mantaApi');
      await backendApi.uploadFile(file, localStorage.getItem('token'));
      fetchFiles(); // Refresh file list
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const generateShareLink = async (fileId) => {
    try {
      const { backendApi } = await import('../../lib/mantaApi');
      const { shareUrl } = await backendApi.generateShareLink(
        fileId,
        {
          protection: 'none',
          expiresIn: '7d',
        },
        localStorage.getItem('token')
      );

      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error generating share link:', error);
    }
  };

  const generateQRCode = async (fileId) => {
    try {
      const { backendApi } = await import('../../lib/mantaApi');
      const { qrCode } = await backendApi.generateQRCode(
        fileId,
        localStorage.getItem('token')
      );

      // Open QR code in new window or modal
      const newWindow = window.open();
      newWindow.document.write(
        `<img src="${qrCode}" alt="QR Code" style="max-width: 100%; height: auto;" />`
      );
    } catch (error) {
      console.error('Error generating QR code:', error);
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

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Cloud className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Cloud className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Manta<span className="text-blue-600">Drive</span>
                </h1>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="btn-primary cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Upload
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/ai')}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Brain className="h-4 w-4" />
                  <span>AI Features</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${
                      viewMode === 'grid'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${
                      viewMode === 'list'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-700">{user?.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-16">
            <Cloud className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No files yet
            </h3>
            <p className="text-gray-600 mb-6">
              Upload your first file to get started
            </p>
            <label className="btn-primary cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                : 'space-y-2'
            }
          >
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
                  viewMode === 'grid'
                    ? 'p-4'
                    : 'p-3 flex items-center justify-between'
                }`}
              >
                <div
                  className={`flex items-center ${
                    viewMode === 'grid' ? 'flex-col text-center' : 'space-x-3'
                  }`}
                >
                  <div
                    className={`text-blue-600 ${
                      viewMode === 'grid' ? 'mb-3' : ''
                    }`}
                  >
                    {getFileIcon(file.type)}
                  </div>
                  <div className={viewMode === 'grid' ? 'w-full' : 'flex-1'}>
                    <h3
                      className="font-medium text-gray-900 truncate"
                      title={file.name}
                    >
                      {file.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-center space-x-2 ${
                    viewMode === 'grid' ? 'mt-4 justify-center' : ''
                  }`}
                >
                  <button
                    onClick={() => generateShareLink(file.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => generateQRCode(file.id)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                    title="Generate QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
