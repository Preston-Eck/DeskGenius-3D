
import React, { useState } from 'react';
import { ProjectConfig, ObjectType } from './types';
import DesignCanvas from './components/DesignCanvas';
import ConfigPanel from './components/ConfigPanel';
import ChatInterface from './components/ChatInterface';
import BuildGuide from './components/BuildGuide';
import RoomSetup from './components/RoomSetup';
import ObjectLibrary from './components/ObjectLibrary';
import { Layout, MessageSquare, Wrench, Download, Upload } from 'lucide-react';

const App: React.FC = () => {
  // Wizard State
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  const [activeTab, setActiveTab] = useState<'design' | 'build'>('design');
  const [showConfig, setShowConfig] = useState(true);
  const [showChat, setShowChat] = useState(true);
  
  // State
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>({
    images: [],
    room: { 
      width: 120, 
      height: 96, 
      depth: 96, 
      wallColor: '#f3f4f6', 
      floorType: 'wood',
      floorColor: '#8d6e63',
      sideWalls: [true, true]
    },
    deskHeight: 30,
    deskDepth: 26,
    baseLayout: ['drawers', 'empty', 'cpu_holder'],
    hasUppers: true,
    upperDepth: 14,
    upperLayout: ['cabinet', 'tv_gap', 'cabinet'],
    upperHeightFromDesk: 24,
    tvSize: 42,
    monitorCount: 2,
    material: 'Birch Plywood',
    placedObjects: []
  });

  const handleRoomSetupComplete = (images: string[], roomData: any) => {
     setProjectConfig(prev => ({
        ...prev,
        images: images,
        room: { ...prev.room, ...roomData }
     }));
     setIsSetupComplete(true);
  };

  const handleAddObject = (type: ObjectType) => {
     const newObj = {
       id: Date.now().toString(),
       type,
       position: [0, 5, 20] as [number, number, number],
       rotation: [0, 0, 0] as [number, number, number]
     };
     setProjectConfig(prev => ({
       ...prev,
       placedObjects: [...prev.placedObjects, newObj]
     }));
  };

  // Import/Export
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectConfig));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "desk_project.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file){
       const reader = new FileReader();
       reader.onload = (event) => {
          try {
             const imported = JSON.parse(event.target?.result as string);
             setProjectConfig(imported);
             setIsSetupComplete(true);
          } catch(err) {
             alert("Invalid project file");
          }
       };
       reader.readAsText(file);
    }
  };

  if (!isSetupComplete) {
    return <RoomSetup onComplete={handleRoomSetupComplete} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Layout className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-800">
            DeskGenius <span className="font-light">Built-in</span>
          </h1>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('design')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'design' 
                ? 'bg-white text-brand-700 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Design
          </button>
          <button
            onClick={() => setActiveTab('build')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'build' 
                ? 'bg-white text-brand-700 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Build Guide
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="p-2 text-gray-500 hover:bg-gray-100 rounded cursor-pointer" title="Import Project">
             <Upload className="w-5 h-5" />
             <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={handleExport} className="p-2 text-gray-500 hover:bg-gray-100 rounded" title="Export Project">
             <Download className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex relative">
        
        {/* Tab: Design Mode */}
        {activeTab === 'design' && (
          <>
            {/* Left Config Panel */}
            <div 
              className={`w-80 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col transition-transform duration-300 absolute md:static z-20 h-full ${showConfig ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
               <div className="flex-1 overflow-y-auto">
                 <ConfigPanel config={projectConfig} onChange={setProjectConfig} />
               </div>
               <ObjectLibrary onAddObject={handleAddObject} />
            </div>

            {/* Center Canvas */}
            <div className="flex-1 relative h-full bg-gray-900">
              <DesignCanvas 
                deskConfig={projectConfig} 
                setDeskConfig={setProjectConfig}
              />
              
              {/* Toggle Config Mobile */}
              <button 
                onClick={() => setShowConfig(!showConfig)}
                className="absolute bottom-4 left-4 z-30 md:hidden bg-white p-2 rounded-full shadow-lg"
              >
                <Wrench className="w-5 h-5" />
              </button>

               {/* Toggle Chat Mobile */}
              <button 
                onClick={() => setShowChat(!showChat)}
                className="absolute bottom-4 right-4 z-30 md:hidden bg-white p-2 rounded-full shadow-lg"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>

            {/* Right Chat Panel */}
            <div 
              className={`w-96 bg-white border-l border-gray-200 flex-shrink-0 transition-transform duration-300 absolute right-0 top-0 md:static z-20 h-full ${showChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
            >
               <ChatInterface 
                 deskConfig={projectConfig} 
                 setDeskConfig={setProjectConfig}
                 uploadedImage={projectConfig.images[0] || null}
               />
            </div>
          </>
        )}

        {/* Tab: Build Mode */}
        {activeTab === 'build' && (
          <div className="w-full h-full bg-gray-50">
             <BuildGuide deskConfig={projectConfig} />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
