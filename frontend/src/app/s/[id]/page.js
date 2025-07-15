// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useParams } from 'next/navigation';
// import { backendApi } from '../../../lib/mantaApi';
// import { Download, Lock, Eye, Clock, Shield } from 'lucide-react';

// export default function AnonymousShare() {
//   const params = useParams();
//   const accessId = params.id;

//   const [shareData, setShareData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [accessKey, setAccessKey] = useState('');
//   const [password, setPassword] = useState('');
//   const [showAuth, setShowAuth] = useState(false);
//   const [downloading, setDownloading] = useState(false);

//   useEffect(() => {
//     if (accessId) {
//       checkAccess();
//     }
//   }, [accessId]);

//   const checkAccess = async () => {
//     setLoading(true);
//     setError('');

//     try {
//       const result = await backendApi.accessAnonymousShare(accessId, accessKey, password);
//       setShareData(result);
//       setShowAuth(false);
//     } catch (err) {
//       if (err.message.includes('Access denied') || err.message.includes('key') || err.message.includes('password')) {
//         setShowAuth(true);
//         setError('Authentication required');
//       } else {
//         setError(err.message);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAuthenticate = (e) => {
//     e.preventDefault();
//     checkAccess();
//   };

//   const downloadFile = async () => {
//     setDownloading(true);

//     try {
//       // In a real implementation, this would download from the actual file URL
//       // For demo purposes, we'll simulate a download
//       const blob = new Blob(['Demo file content'], { type: 'text/plain' });
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', shareData?.filename || 'shared-file.txt');
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (err) {
//       setError('Download failed');
//     } finally {
//       setDownloading(false);
//     }
//   };

//   const formatFileSize = (bytes) => {
//     if (!bytes) return '0 B';
//     const k = 1024;
//     const sizes = ['B', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   if (loading) {
//     return (
//       <div className=\"min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center\">
//         <div className=\"bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center\">
//           <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4\"></div>
//           <p className=\"text-gray-600\">Loading shared file...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className=\"min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-4\">
//       <div className=\"bg-white rounded-lg shadow-xl max-w-md w-full\">
//         {/* Header */}
//         <div className=\"bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-lg text-center\">
//           <div className=\"mb-2\">
//             <Shield className=\"h-8 w-8 mx-auto mb-2\" />
//           </div>
//           <h1 className=\"text-xl font-bold\">Secure File Share</h1>
//           <p className=\"text-purple-100 text-sm\">Anonymous access via MantaDrive</p>
//         </div>

//         <div className=\"p-6\">
//           {error && !showAuth && (
//             <div className=\"mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center\">
//               {error}
//             </div>
//           )}

//           {showAuth ? (
//             <form onSubmit={handleAuthenticate} className=\"space-y-4\">
//               <div className=\"text-center mb-4\">
//                 <Lock className=\"h-8 w-8 text-gray-400 mx-auto mb-2\" />
//                 <h2 className=\"text-lg font-semibold text-gray-800\">Authentication Required</h2>
//                 <p className=\"text-sm text-gray-600\">This file is protected. Please provide credentials.</p>
//               </div>

//               {error && (
//                 <div className=\"p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm\">
//                   {error}
//                 </div>
//               )}

//               <div>
//                 <label className=\"block text-sm font-medium text-gray-700 mb-1\">
//                   Access Key (if required)
//                 </label>
//                 <input
//                   type=\"text\"
//                   value={accessKey}
//                   onChange={(e) => setAccessKey(e.target.value)}
//                   placeholder=\"Enter access key\"
//                   className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500\"
//                 />
//               </div>

//               <div>
//                 <label className=\"block text-sm font-medium text-gray-700 mb-1\">
//                   Password (if required)
//                 </label>
//                 <input
//                   type=\"password\"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder=\"Enter password\"
//                   className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500\"
//                 />
//               </div>

//               <button
//                 type=\"submit\"
//                 disabled={loading}
//                 className=\"w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50\"
//               >
//                 {loading ? 'Authenticating...' : 'Access File'}
//               </button>
//             </form>
//           ) : shareData ? (
//             <div className=\"space-y-4\">
//               <div className=\"text-center\">
//                 <div className=\"bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center\">
//                   <Eye className=\"h-8 w-8 text-green-600\" />
//                 </div>
//                 <h2 className=\"text-lg font-semibold text-gray-800 mb-1\">File Ready for Download</h2>
//                 <p className=\"text-sm text-gray-600\">This file has been shared securely with you</p>
//               </div>

//               <div className=\"bg-gray-50 rounded-lg p-4 space-y-2\">
//                 <div className=\"flex justify-between items-center\">
//                   <span className=\"text-sm font-medium text-gray-700\">Filename:</span>
//                   <span className=\"text-sm text-gray-900 font-mono\">{shareData.filename}</span>
//                 </div>
//                 <div className=\"flex justify-between items-center\">
//                   <span className=\"text-sm font-medium text-gray-700\">Size:</span>
//                   <span className=\"text-sm text-gray-900\">{formatFileSize(shareData.size)}</span>
//                 </div>
//                 <div className=\"flex justify-between items-center\">
//                   <span className=\"text-sm font-medium text-gray-700\">Type:</span>
//                   <span className=\"text-sm text-gray-900\">{shareData.content_type}</span>
//                 </div>
//               </div>

//               <div className=\"flex items-center justify-center text-xs text-gray-500 space-x-2\">
//                 <Clock className=\"h-3 w-3\" />
//                 <span>This link may expire after download or time limit</span>
//               </div>

//               <button
//                 onClick={downloadFile}
//                 disabled={downloading}
//                 className=\"w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2\"
//               >
//                 <Download className=\"h-5 w-5\" />
//                 <span>{downloading ? 'Downloading...' : 'Download File'}</span>
//               </button>

//               <div className=\"text-center\">
//                 <p className=\"text-xs text-gray-500\">
//                   Powered by MantaDrive - Privacy-first file sharing
//                 </p>
//               </div>
//             </div>
//           ) : (
//             <div className=\"text-center\">
//               <div className=\"bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center\">
//                 <Lock className=\"h-8 w-8 text-red-600\" />
//               </div>
//               <h2 className=\"text-lg font-semibold text-gray-800 mb-1\">Access Denied</h2>
//               <p className=\"text-sm text-gray-600\">This share link is invalid or has expired.</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
