
import React from 'react';
import { ProjectConfig, BaseUnitType } from '../types';
import { Sliders, Monitor, Box, Layers, Grid, Home, Eye, Download, Upload } from 'lucide-react';

interface ConfigPanelProps {
  config: ProjectConfig;
  onChange: (newConfig: ProjectConfig) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
  const handleChange = (key: keyof ProjectConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const handleRoomChange = (key: string, value: any) => {
    onChange({ ...config, room: { ...config.room, [key]: value } });
  };
  
  const toggleSideWall = (index: 0 | 1) => {
     const newWalls = [...config.room.sideWalls] as [boolean, boolean];
     newWalls[index] = !newWalls[index];
     handleRoomChange('sideWalls', newWalls);
  };

  const setBaseLayout = (type: string) => {
    let layout: BaseUnitType[] = [];
    switch(type) {
      case 'standard': layout = ['drawers', 'empty', 'drawers']; break;
      case 'left-heavy': layout = ['drawers', 'cabinet', 'empty']; break;
      case 'long': layout = ['cabinet', 'empty', 'empty', 'drawers']; break;
      case 'gamer': layout = ['drawers', 'empty', 'cpu_holder']; break;
      default: layout = ['drawers', 'empty', 'drawers'];
    }
    handleChange('baseLayout', layout);
  };

  const handleSaveRoom = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config.room));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "room_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLoadRoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          // Basic validation checking for width/height
          if (typeof imported.width === 'number' && typeof imported.height === 'number') {
               onChange({ ...config, room: { ...config.room, ...imported } });
          } else {
              alert("Invalid room configuration file.");
          }
        } catch (err) {
          alert("Error reading file.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-brand-600" />
          Desk Specs
        </h2>
        <p className="text-xs text-gray-500">Configure your built-in unit.</p>
      </div>

      {/* Room Dimensions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
               <Home className="w-4 h-4" /> Room Shell
            </h3>
            <div className="flex gap-1">
                <button onClick={handleSaveRoom} title="Save Room Config" className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors">
                    <Download className="w-3.5 h-3.5" />
                </button>
                <label title="Load Room Config" className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <input type="file" accept=".json" onChange={handleLoadRoom} className="hidden" />
                </label>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Wall Width</label>
            <input 
              type="number" 
              value={config.room.width} 
              onChange={(e) => handleRoomChange('width', Number(e.target.value))}
              className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Room Depth</label>
            <input 
              type="number" 
              value={config.room.depth} 
              onChange={(e) => handleRoomChange('depth', Number(e.target.value))}
              className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
            />
          </div>
           <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ceiling Ht</label>
            <input 
              type="number" 
              value={config.room.height} 
              onChange={(e) => handleRoomChange('height', Number(e.target.value))}
              className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
            />
          </div>
        </div>

        <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Wall Visibility</label>
             <div className="flex gap-2 text-sm">
                 <button 
                   onClick={() => toggleSideWall(0)}
                   className={`flex-1 px-2 py-1 rounded border flex items-center justify-center gap-1 ${config.room.sideWalls[0] ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 text-gray-400'}`}
                 >
                   <Eye className="w-3 h-3" /> Left
                 </button>
                 <button 
                   onClick={() => toggleSideWall(1)}
                   className={`flex-1 px-2 py-1 rounded border flex items-center justify-center gap-1 ${config.room.sideWalls[1] ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 text-gray-400'}`}
                 >
                   <Eye className="w-3 h-3" /> Right
                 </button>
             </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Wall Color</label>
            <div className="flex gap-1">
               <input 
                 type="color" 
                 value={config.room.wallColor} 
                 onChange={(e) => handleRoomChange('wallColor', e.target.value)}
                 className="h-8 w-8 p-0 border-0 rounded cursor-pointer"
               />
               <div className="text-[10px] text-gray-500 leading-tight flex items-center">{config.room.wallColor}</div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Floor Color</label>
            <div className="flex gap-1">
               <input 
                 type="color" 
                 value={config.room.floorColor} 
                 onChange={(e) => handleRoomChange('floorColor', e.target.value)}
                 className="h-8 w-8 p-0 border-0 rounded cursor-pointer"
               />
               <div className="text-[10px] text-gray-500 leading-tight flex items-center">{config.room.floorColor}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Desk Config */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
           <Grid className="w-4 h-4" /> Desk Dimensions
        </h3>
        <div className="grid grid-cols-2 gap-3">
           <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Desk Depth</label>
            <input 
              type="number" 
              value={config.deskDepth} 
              onChange={(e) => handleChange('deskDepth', Number(e.target.value))}
              className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Desk Height</label>
            <input 
              type="number" 
              value={config.deskHeight} 
              onChange={(e) => handleChange('deskHeight', Number(e.target.value))}
              className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
            />
          </div>
        </div>
      </section>

      {/* Base Cabinets */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
           <Layers className="w-4 h-4" /> Base Cabinetry
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setBaseLayout('standard')} className="px-2 py-2 text-xs border rounded hover:bg-gray-50 text-left">
            Standard<br/><span className="text-gray-400">Drw - Space - Drw</span>
          </button>
          <button onClick={() => setBaseLayout('gamer')} className="px-2 py-2 text-xs border rounded hover:bg-gray-50 text-left">
            Gamer<br/><span className="text-gray-400">Drw - Space - PC</span>
          </button>
           <button onClick={() => setBaseLayout('left-heavy')} className="px-2 py-2 text-xs border rounded hover:bg-gray-50 text-left">
            Storage Left<br/><span className="text-gray-400">Drw - Cab - Space</span>
          </button>
           <button onClick={() => setBaseLayout('long')} className="px-2 py-2 text-xs border rounded hover:bg-gray-50 text-left">
            Double Wide<br/><span className="text-gray-400">Cab - Sp - Sp - Drw</span>
          </button>
        </div>
      </section>

      {/* Upper Cabinets & TV */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
           <Box className="w-4 h-4" /> Uppers & Media
        </h3>
        
        <div className="flex items-center justify-between">
           <span className="text-sm text-gray-700">Upper Cabinets</span>
           <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={config.hasUppers} onChange={(e) => handleChange('hasUppers', e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
           </label>
        </div>

        {config.hasUppers && (
           <div className="p-3 bg-gray-50 rounded space-y-3">
              <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">TV Size (Inches)</label>
                 <input 
                   type="range" min="0" max="75" step="5"
                   value={config.tvSize} 
                   onChange={(e) => {
                      const size = Number(e.target.value);
                      handleChange('tvSize', size);
                      if (size > 0) handleChange('upperLayout', ['cabinet', 'tv_gap', 'cabinet']);
                      else handleChange('upperLayout', ['cabinet', 'shelves', 'cabinet']);
                   }}
                   className="w-full"
                 />
                 <div className="text-xs text-right text-gray-500">{config.tvSize > 0 ? `${config.tvSize}" TV` : 'No TV'}</div>
              </div>
           </div>
        )}
      </section>

      {/* Equipment */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
           <Monitor className="w-4 h-4" /> Equipment
        </h3>
        <div className="flex items-center gap-4">
           <label className="flex items-center">
             <input type="radio" checked={config.monitorCount === 1} onChange={() => handleChange('monitorCount', 1)} className="mr-2" />
             <span className="text-sm">1 Monitor</span>
           </label>
           <label className="flex items-center">
             <input type="radio" checked={config.monitorCount === 2} onChange={() => handleChange('monitorCount', 2)} className="mr-2" />
             <span className="text-sm">2 Monitors</span>
           </label>
        </div>
      </section>
      
      {/* Material */}
      <section className="space-y-4">
        <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Material</label>
        <select 
          value={config.material}
          onChange={(e) => handleChange('material', e.target.value)}
          className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
        >
          {['Birch Plywood', 'Walnut Plywood', 'Solid Oak', 'Painted MDF'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </section>

    </div>
  );
};

export default ConfigPanel;
