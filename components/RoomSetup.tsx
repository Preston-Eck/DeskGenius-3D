
import React, { useState } from 'react';
import { Camera, ArrowRight, Loader2, Upload, Trash2 } from 'lucide-react';
import { RoomConfig } from '../types';
import { analyzeRoom } from '../services/geminiService';

interface RoomSetupProps {
  onComplete: (images: string[], roomData: RoomConfig) => void;
}

const RoomSetup: React.FC<RoomSetupProps> = ({ onComplete }) => {
  const [images, setImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<Partial<RoomConfig> | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages: string[] = [];
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = async () => {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    const result = await analyzeRoom(images);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const finalize = () => {
    if (analysisResult) {
      const finalConfig: RoomConfig = {
        width: analysisResult.width || 120,
        height: analysisResult.height || 96,
        depth: analysisResult.depth || 96,
        wallColor: analysisResult.wallColor || '#f3f4f6',
        floorType: analysisResult.floorType || 'wood',
        floorColor: analysisResult.floorColor || '#8d6e63',
        sideWalls: [true, true]
      };
      onComplete(images, finalConfig);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50 overflow-y-auto">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">New Project Setup</h1>
          <p className="text-gray-500">Upload photos of your space. The AI will estimate dimensions and colors.</p>
        </div>

        {/* Step 1: Upload */}
        <div className="space-y-4">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                   <img src={img} alt="Room" className="w-full h-full object-cover" />
                   <button 
                     onClick={() => removeImage(idx)}
                     className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                   >
                     <Trash2 className="w-3 h-3" />
                   </button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-500 hover:bg-brand-50 flex flex-col items-center justify-center cursor-pointer transition">
                 <Camera className="w-8 h-8 text-gray-400" />
                 <span className="text-xs text-gray-500 mt-2">Add Photo</span>
                 <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
           </div>
        </div>

        {/* Step 2: Analyze */}
        {!analysisResult && (
           <button 
             onClick={startAnalysis}
             disabled={images.length === 0 || isAnalyzing}
             className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition"
           >
             {isAnalyzing ? (
               <>
                 <Loader2 className="w-6 h-6 animate-spin" /> Analyzing Space...
               </>
             ) : (
               <>
                 <Upload className="w-5 h-5" /> Analyze Photos
               </>
             )}
           </button>
        )}

        {/* Step 3: Confirmation */}
        {analysisResult && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 border-t border-gray-100 pt-6">
            <h3 className="font-semibold text-gray-900">Detected Features</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Wall Width (in)</label>
                <input 
                  type="number" 
                  value={analysisResult.width} 
                  onChange={(e) => setAnalysisResult({...analysisResult, width: Number(e.target.value)})}
                  className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900 border"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ceiling Ht (in)</label>
                <input 
                  type="number" 
                  value={analysisResult.height} 
                  onChange={(e) => setAnalysisResult({...analysisResult, height: Number(e.target.value)})}
                  className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900 border"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Room Depth (in)</label>
                <input 
                  type="number" 
                  value={analysisResult.depth || 96} 
                  onChange={(e) => setAnalysisResult({...analysisResult, depth: Number(e.target.value)})}
                  className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900 border"
                />
              </div>
            </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Wall Color</label>
                  <div className="flex gap-2">
                     <input 
                        type="color" 
                        value={analysisResult.wallColor || '#ffffff'} 
                        onChange={(e) => setAnalysisResult({...analysisResult, wallColor: e.target.value})}
                        className="h-10 w-12 p-0 border-0 rounded cursor-pointer"
                     />
                     <div className="flex-1">
                        <input 
                           type="text" 
                           value={analysisResult.wallColor || ''}
                           onChange={(e) => setAnalysisResult({...analysisResult, wallColor: e.target.value})}
                           className="w-full text-xs border-gray-300 rounded p-2 text-gray-900 border"
                        />
                     </div>
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Floor Color</label>
                  <div className="flex gap-2">
                     <input 
                        type="color" 
                        value={analysisResult.floorColor || '#8d6e63'} 
                        onChange={(e) => setAnalysisResult({...analysisResult, floorColor: e.target.value})}
                        className="h-10 w-12 p-0 border-0 rounded cursor-pointer"
                     />
                     <div className="flex-1">
                        <input 
                           type="text" 
                           value={analysisResult.floorColor || ''}
                           onChange={(e) => setAnalysisResult({...analysisResult, floorColor: e.target.value})}
                           className="w-full text-xs border-gray-300 rounded p-2 text-gray-900 border"
                        />
                     </div>
                  </div>
               </div>
            </div>

            <button 
               onClick={finalize}
               className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition"
            >
               Build My Room <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default RoomSetup;
