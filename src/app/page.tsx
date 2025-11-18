'use client';

 import { useState } from 'react';
 import { VoiceRecorder } from '@/components/VoiceRecorder';
 import { ImageUploader } from '@/components/ImageUploader';
 import { AuditLog } from '@/components/AuditLog';
 import { Languages, AlertCircle } from 'lucide-react';

 export default function Home() {
   const [result, setResult] = useState<any>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   const handleIntake = async (data: any) => {
     setLoading(true);
     setError('');
     
     try {
       const res = await fetch('/api/process-intake', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(data),
       });
       
       const json = await res.json();
       
       if (!res.ok) throw new Error(json.error || 'Processing failed');
       
       setResult(json);
     } catch (err: any) {
       setError(err.message);
     } finally {
       setLoading(false);
     }
   };

   return (
     <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 md:p-8"> 
       <div className="max-w-6xl mx-auto"> 
         { /* Header */ } 
         <header className="mb-8 text-center"> 
           <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2"> 
             🌍 Civic Bridge 
           </h1> 
           <p className="text-gray-600"> 
             Voice your concerns in any language. AI-powered civic engagement. 
           </p> 
         </header> 

         { /* Language Support Badge */ } 
         <div className="flex justify-center mb-6"> 
           <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2"> 
             <Languages className="w-4 h-4" /> 
             <span className="text-sm">Supports: العربية, हिन्दी, اردو, English</span> 
           </div> 
         </div> 

         { /* Error Banner */ } 
         {error && ( 
           <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg flex items-start gap-3"> 
             <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" /> 
             <p className="text-red-700">{error}</p> 
           </div> 
         )} 

         { /* Input Methods */ } 
         <div className="grid md:grid-cols-2 gap-6 mb-8"> 
           <VoiceRecorder onComplete={handleIntake} disabled={loading} /> 
           <ImageUploader onComplete={handleIntake} disabled={loading} /> 
         </div> 

         { /* Loading State */ } 
         {loading && ( 
           <div className="text-center py-8"> 
             <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div> 
             <p className="mt-4 text-gray-600">Processing your request...</p> 
           </div> 
         )} 

         { /* Results */ } 
         {result && !loading && ( 
           <AuditLog data={result} /> 
         )} 

         { /* Demo Banner */ } 
         <footer className="mt-12 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"> 
           <p className="text-sm text-yellow-800"> 
             <strong>💡 Demo Tip:</strong>  Try saying "Broken streetlight outside my building" in Arabic or uploading a photo of a pothole. 
           </p> 
         </footer> 
       </div> 
     </main> 
   ); 
 }
