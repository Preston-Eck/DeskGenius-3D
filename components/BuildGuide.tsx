
import React, { useEffect, useState } from 'react';
import { ProjectConfig, BuildGuideData, CutListItem } from '../types';
import { generateBuildGuide } from '../services/geminiService';
import { ClipboardList, Hammer, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface BuildGuideProps {
  deskConfig: ProjectConfig;
}

const PartDiagram: React.FC<{ part: CutListItem }> = ({ part }) => {
  // Calculate relative scaling for the SVG
  const maxDim = Math.max(part.length, part.width);
  const scale = 100 / maxDim; // Fit into 100px box logic
  const svgW = part.width * scale;
  const svgH = part.length * scale;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-24 h-24 bg-blue-50 border border-blue-200 rounded flex items-center justify-center relative p-2">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
          <rect 
            x={(100 - svgW)/2} 
            y={(100 - svgH)/2} 
            width={svgW} 
            height={svgH} 
            fill="#93c5fd" 
            stroke="#1e3a8a" 
            strokeWidth="1"
          />
          {/* Dimension Labels */}
          <text x="50" y={(100 - svgH)/2 - 5} textAnchor="middle" fontSize="10" fill="#1e40af">{part.width}"</text>
          <text x={(100 + svgW)/2 + 5} y="50" textAnchor="start" fontSize="10" fill="#1e40af" transform={`rotate(90, ${(100 + svgW)/2 + 5}, 50)`}>{part.length}"</text>
        </svg>
      </div>
      <span className="text-xs font-medium text-gray-600">{part.thickness}" Thick</span>
    </div>
  );
};

const BuildGuide: React.FC<BuildGuideProps> = ({ deskConfig }) => {
  const [data, setData] = useState<BuildGuideData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchGuide = async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await generateBuildGuide(deskConfig);
        if (result) {
          setData(result);
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
        <p>Generating cabinetry plans and cut lists...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 space-y-4">
        <AlertCircle className="w-10 h-10" />
        <p>Failed to generate guide. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Cabinetry Build Plan</h1>
        <p className="text-gray-600 mt-2">
          {deskConfig.room.width}" Built-in Unit | {deskConfig.material}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Cut List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden md:col-span-2">
          <div className="bg-brand-50 p-4 border-b border-brand-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-700" />
            <h2 className="font-semibold text-brand-900">Cut List & Diagrams</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {data.cutList.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow bg-white">
                   <h3 className="font-bold text-gray-800 text-sm mb-2">{item.partName}</h3>
                   <PartDiagram part={item} />
                   <div className="mt-3 text-center">
                     <div className="text-xs text-gray-500">{item.quantity}x {item.material}</div>
                     <div className="text-xs font-mono text-gray-700 mt-1">{item.length}" x {item.width}"</div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tools */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit md:col-span-2">
          <div className="bg-orange-50 p-4 border-b border-orange-100 flex items-center gap-2">
            <Hammer className="w-5 h-5 text-orange-700" />
            <h2 className="font-semibold text-orange-900">Tools Required</h2>
          </div>
          <div className="p-4">
             <ul className="flex flex-wrap gap-2">
               {data.toolsRequired.map((tool, idx) => (
                 <li key={idx} className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-800 text-sm rounded-full border border-orange-100">
                   {tool}
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-600" /> Assembly Instructions
        </h2>
        {data.steps.map((step, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
              {idx + 1}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuildGuide;