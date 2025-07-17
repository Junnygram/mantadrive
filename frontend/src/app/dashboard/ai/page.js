'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  Zap,
  Copy,
  FileText,
  Image,
  Trash2,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Wand2,
  Scissors,
  FileImage,
  Download,
} from 'lucide-react';

export default function AIFeatures() {
  // const [loading, setLoading] = useState(false);
  // const [duplicates, setDuplicates] = useState([]);
  // const [organizedFiles, setOrganizedFiles] = useState([]);
  // const [processingResults, setProcessingResults] = useState([]);
  // const router = useRouter();

  // const aiFeatures = [
  //   {
  //     id: 'organize',
  //     title: 'Smart Organization',
  //     description: 'AI automatically categorizes and organizes your files',
  //     icon: Brain,
  //     color: 'blue',
  //     action: organizeFiles,
  //   },
  //   {
  //     id: 'duplicates',
  //     title: 'Duplicate Detection',
  //     description: 'Find and remove duplicate files to save space',
  //     icon: Copy,
  //     color: 'green',
  //     action: findDuplicates,
  //   },
  //   {
  //     id: 'background-removal',
  //     title: 'Background Removal',
  //     description: 'Remove backgrounds from images automatically',
  //     icon: Scissors,
  //     color: 'purple',
  //     action: () => setActiveFeature('background-removal'),
  //   },
  //   {
  //     id: 'text-extraction',
  //     title: 'Text Extraction',
  //     description: 'Extract text from images and PDFs',
  //     icon: FileText,
  //     color: 'orange',
  //     action: () => setActiveFeature('text-extraction'),
  //   },
  //   {
  //     id: 'file-conversion',
  //     title: 'File Conversion',
  //     description: 'Convert files between different formats',
  //     icon: RefreshCw,
  //     color: 'indigo',
  //     action: () => setActiveFeature('file-conversion'),
  //   },
  //   {
  //     id: 'document-processing',
  //     title: 'Document Processing',
  //     description: 'Extract data from invoices and documents',
  //     icon: FileImage,
  //     color: 'red',
  //     action: () => setActiveFeature('document-processing'),
  //   },
  // ];

  // const [activeFeature, setActiveFeature] = useState(null);

  // async function organizeFiles() {
  //   setLoading(true);
  //   try {
  //     const { backendApi } = await import('../lib/mantaApi');
  //     const result = await backendApi.organizeFiles(
  //       localStorage.getItem('token')
  //     );
  //     setOrganizedFiles(result.categories);
  //     setActiveFeature('organize-results');
  //   } catch (error) {
  //     console.error('Error organizing files:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  // async function findDuplicates() {
  //   setLoading(true);
  //   try {
  //     const { backendApi } = await import('../lib/mantaApi');
  //     const result = await backendApi.detectDuplicates(
  //       localStorage.getItem('token')
  //     );
  //     setDuplicates(result.duplicates);
  //     setActiveFeature('duplicates-results');
  //   } catch (error) {
  //     console.error('Error finding duplicates:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  // const processFile = async (fileId, processingType) => {
  //   setLoading(true);
  //   try {
  //     const { backendApi } = await import('../lib/mantaApi');
  //     let result;

  //     switch (processingType) {
  //       case 'background-removal':
  //         result = await backendApi.removeBackground(
  //           fileId,
  //           localStorage.getItem('token')
  //         );
  //         break;
  //       case 'text-extraction':
  //         result = await backendApi.extractText(
  //           fileId,
  //           localStorage.getItem('token')
  //         );
  //         break;
  //       case 'file-conversion':
  //         result = await backendApi.convertFile(
  //           fileId,
  //           'pdf',
  //           localStorage.getItem('token')
  //         );
  //         break;
  //       default:
  //         result = await backendApi.processDocument(
  //           fileId,
  //           processingType,
  //           localStorage.getItem('token')
  //         );
  //     }

  //     setProcessingResults((prev) => [
  //       ...prev,
  //       { fileId, type: processingType, result },
  //     ]);
  //   } catch (error) {
  //     console.error('Error processing file:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // if (activeFeature === 'organize-results') {
  //   return (
  //     <div className="min-h-screen bg-gray-50 p-6">
  //       <div className="max-w-6xl mx-auto">
  //         <div className="flex items-center mb-6">
  //           <button
  //             onClick={() => setActiveFeature(null)}
  //             className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
  //           >
  //             <ArrowLeft className="h-5 w-5" />
  //           </button>
  //           <h1 className="text-2xl font-bold text-gray-900">
  //             AI Organization Results
  //           </h1>
  //         </div>

  //         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  //           {organizedFiles.map((category) => (
  //             <div
  //               key={category.name}
  //               className="bg-white rounded-lg shadow-sm border p-6"
  //             >
  //               <h3 className="text-lg font-semibold text-gray-900 mb-4">
  //                 {category.name}
  //               </h3>
  //               <div className="space-y-2">
  //                 {category.files.map((file) => (
  //                   <div
  //                     key={file.id}
  //                     className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
  //                   >
  //                     <FileText className="h-4 w-4 text-gray-400" />
  //                     <span className="text-sm text-gray-700 truncate">
  //                       {file.name}
  //                     </span>
  //                   </div>
  //                 ))}
  //               </div>
  //               <div className="mt-4 text-sm text-gray-500">
  //                 {category.files.length} files organized
  //               </div>
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // if (activeFeature === 'duplicates-results') {
  //   return (
  //     <div className="min-h-screen bg-gray-50 p-6">
  //       <div className="max-w-6xl mx-auto">
  //         <div className="flex items-center mb-6">
  //           <button
  //             onClick={() => setActiveFeature(null)}
  //             className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
  //           >
  //             <ArrowLeft className="h-5 w-5" />
  //           </button>
  //           <h1 className="text-2xl font-bold text-gray-900">
  //             Duplicate Files Found
  //           </h1>
  //         </div>

  //         {duplicates.length === 0 ? (
  //           <div className="text-center py-16">
  //             <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
  //             <h3 className="text-lg font-medium text-gray-900 mb-2">
  //               No Duplicates Found
  //             </h3>
  //             <p className="text-gray-600">Your files are well organized!</p>
  //           </div>
  //         ) : (
  //           <div className="space-y-6">
  //             {duplicates.map((group, index) => (
  //               <div
  //                 key={index}
  //                 className="bg-white rounded-lg shadow-sm border p-6"
  //               >
  //                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
  //                   Duplicate Group {index + 1}
  //                 </h3>
  //                 <div className="grid md:grid-cols-2 gap-4">
  //                   {group.files.map((file) => (
  //                     <div
  //                       key={file.id}
  //                       className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
  //                     >
  //                       <div className="flex items-center space-x-3">
  //                         <FileText className="h-5 w-5 text-gray-400" />
  //                         <div>
  //                           <p className="font-medium text-gray-900">
  //                             {file.name}
  //                           </p>
  //                           <p className="text-sm text-gray-500">
  //                             {(file.size / 1024 / 1024).toFixed(2)} MB
  //                           </p>
  //                         </div>
  //                       </div>
  //                       <button className="p-2 text-red-600 hover:bg-red-50 rounded">
  //                         <Trash2 className="h-4 w-4" />
  //                       </button>
  //                     </div>
  //                   ))}
  //                 </div>
  //               </div>
  //             ))}
  //           </div>
  //         )}
  //       </div>
  //     </div>
  //   );
  // }

  return (
    // <div className="min-h-screen bg-gray-50 p-6">
    //   <div className="max-w-6xl mx-auto">
    //     <div className="flex items-center mb-8">
    //       <button
    //         onClick={() => router.push('/dashboard')}
    //         className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
    //       >
    //         <ArrowLeft className="h-5 w-5" />
    //       </button>
    //       <div>
    //         <h1 className="text-3xl font-bold text-gray-900">
    //           AI-Powered Features
    //         </h1>
    //         <p className="text-gray-600 mt-2">
    //           Enhance your files with artificial intelligence
    //         </p>
    //       </div>
    //     </div>

    //     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    //       {aiFeatures.map((feature) => {
    //         const IconComponent = feature.icon;
    //         const colorClasses = {
    //           blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    //           green: 'bg-green-100 text-green-600 hover:bg-green-200',
    //           purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
    //           orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
    //           indigo: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
    //           red: 'bg-red-100 text-red-600 hover:bg-red-200',
    //         };

    //         return (
    //           <div
    //             key={feature.id}
    //             className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer"
    //             onClick={feature.action}
    //           >
    //             <div className="p-6">
    //               <div
    //                 className={`w-12 h-12 rounded-lg ${
    //                   colorClasses[feature.color]
    //                 } flex items-center justify-center mb-4`}
    //               >
    //                 <IconComponent className="h-6 w-6" />
    //               </div>
    //               <h3 className="text-lg font-semibold text-gray-900 mb-2">
    //                 {feature.title}
    //               </h3>
    //               <p className="text-gray-600 text-sm">{feature.description}</p>
    //             </div>
    //             <div className="px-6 pb-6">
    //               <button className="w-full btn-primary" disabled={loading}>
    //                 {loading ? (
    //                   <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
    //                 ) : (
    //                   <Wand2 className="h-4 w-4 mr-2" />
    //                 )}
    //                 {loading ? 'Processing...' : 'Start'}
    //               </button>
    //             </div>
    //           </div>
    //         );
    //       })}
    //     </div>

    //     {processingResults.length > 0 && (
    //       <div className="mt-8">
    //         <h2 className="text-xl font-bold text-gray-900 mb-4">
    //           Processing Results
    //         </h2>
    //         <div className="space-y-4">
    //           {processingResults.map((result, index) => (
    //             <div
    //               key={index}
    //               className="bg-white rounded-lg shadow-sm border p-4"
    //             >
    //               <div className="flex items-center justify-between">
    //                 <div className="flex items-center space-x-3">
    //                   <CheckCircle className="h-5 w-5 text-green-600" />
    //                   <span className="font-medium text-gray-900">
    //                     {result.type
    //                       .replace('-', ' ')
    //                       .replace(/\b\w/g, (l) => l.toUpperCase())}{' '}
    //                     Complete
    //                   </span>
    //                 </div>
    //                 <button className="btn-secondary">
    //                   <Download className="h-4 w-4 mr-2" />
    //                   Download
    //                 </button>
    //               </div>
    //             </div>
    //           ))}
    //         </div>
    //       </div>
    //     )}
    //   </div>
    // </div>
    <div>unavailable</div>
  );
}
