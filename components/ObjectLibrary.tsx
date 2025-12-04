
import React from 'react';
import { Armchair, Printer, Lamp, Library, FileText, Component } from 'lucide-react';
import { ObjectType } from '../types';

interface ObjectLibraryProps {
  onAddObject: (type: ObjectType) => void;
}

const items: { type: ObjectType; label: string; icon: React.ReactNode }[] = [
  { type: 'chair', label: 'Office Chair', icon: <Armchair className="w-6 h-6" /> },
  { type: 'printer', label: 'Printer', icon: <Printer className="w-6 h-6" /> },
  { type: 'lamp', label: 'Desk Lamp', icon: <Lamp className="w-6 h-6" /> },
  { type: 'books', label: 'Books', icon: <Library className="w-6 h-6" /> },
  { type: 'stapler', label: 'Stapler', icon: <Component className="w-6 h-6" /> },
];

const ObjectLibrary: React.FC<ObjectLibraryProps> = ({ onAddObject }) => {
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Room Objects</h3>
      <div className="grid grid-cols-5 gap-2">
        {items.map((item) => (
          <button
            key={item.type}
            onClick={() => onAddObject(item.type)}
            className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition border border-transparent hover:border-gray-200"
            title={`Add ${item.label}`}
          >
            <div className="text-gray-600">{item.icon}</div>
            <span className="text-[10px] text-gray-600 font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ObjectLibrary;
