import React, { useEffect, useState } from 'react';
import { ProjectConfig, BuildGuideData } from '../types';
import { generateBuildGuide } from '../services/geminiService';
import { ClipboardList, Hammer, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface BuildGuideProps {
  deskConfig: ProjectConfig;
}

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
          {deskConfig.spaceWidth}" Built-in Unit | {deskConfig.material}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Cut List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-brand-50 p-4 border-b border-brand-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-700" />
            <h2 className="font-semibold text-brand-900">Cut List</h2>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-2 py-2">Part</th>
                  <th className="px-2 py-2">Dims</th>
                  <th className="px-2 py-2">Qty</th>
                  <th className="px-2 py-2">Mat</th>
                </tr>
              </thead>
              <tbody>
                {data.cutList.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="px-2 py-3 font-medium text-gray-900">{item.partName}</td>
                    <td className="px-2 py-3 text-gray-600 whitespace-nowrap">{item.dimensions}</td>
                    <td className="px-2 py-3 text-gray-600">{item.quantity}</td>
                    <td className="px-2 py-3 text-gray-600 truncate max-w-[100px]">{item.material}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tools */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
          <div className="bg-orange-50 p-4 border-b border-orange-100 flex items-center gap-2">
            <Hammer className="w-5 h-5 text-orange-700" />
            <h2 className="font-semibold text-orange-900">Tools Required</h2>
          </div>
          <div className="p-4">
             <ul className="grid grid-cols-2 gap-2">
               {data.toolsRequired.map((tool, idx) => (
                 <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                   <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
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
