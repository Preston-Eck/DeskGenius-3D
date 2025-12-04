
import React, { useLayoutEffect, useMemo } from 'react';
import { ProjectConfig } from '../types';
import { Box, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface DeskModelProps {
  config: ProjectConfig;
  opacity?: number;
}

// A more reliable, CORS-friendly texture URL
const WOOD_TEXTURE_URL = "https://raw.githubusercontent.com/pmndrs/drei-assets/456060a26bbeb8fdf9d32ff9ef96ecc4306d2ef1/group/wood_texture_arrow_front.jpg";

const WoodMaterial: React.FC<{ color: string }> = ({ color }) => {
  const texture = useTexture(WOOD_TEXTURE_URL);
  
  useLayoutEffect(() => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <meshStandardMaterial 
      map={texture} 
      color={color} 
      roughness={0.6} 
      metalness={0} 
      envMapIntensity={0.8}
    />
  );
};

const Material: React.FC<{ type: string, color: string }> = ({ type, color }) => {
  if (type === 'Painted MDF') {
      return <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />;
  }
  
  return <WoodMaterial color={color} />;
};

const CabinetUnit: React.FC<{ 
  position: [number, number, number]; 
  size: [number, number, number]; 
  type: string; 
  materialType: string; 
  materialColor: string; 
}> = ({ position, size, type, materialType, materialColor }) => {
  const [w, h, d] = size;

  if (type === 'empty') return null;

  return (
    <group position={new THREE.Vector3(...position)}>
      {/* Carcass (Box) */}
      <Box args={[w, h, d]} position={[0, h/2, 0]} castShadow receiveShadow>
         <Material type={materialType} color={materialColor} />
      </Box>

      {/* Fronts (Drawers or Door) */}
      {type === 'drawers' && (
        <>
          {[0, 1, 2].map((i) => (
             <group key={i} position={[0, (h/3)*i + (h/6) + 1, d/2 + 0.4]}>
               {/* Drawer Face */}
               <Box args={[w - 1, (h/3) - 1, 0.75]}>
                 <Material type={materialType} color={materialColor} />
               </Box>
               {/* Handle */}
               <Box args={[6, 0.5, 0.5]} position={[0, 0, 0.5]}>
                 <meshStandardMaterial color="#333" roughness={0.4} metalness={0.8} />
               </Box>
             </group>
          ))}
        </>
      )}

      {type === 'cabinet' && (
         <group position={[0, h/2, d/2 + 0.4]}>
            <Box args={[w - 1, h - 1, 0.75]}>
               <Material type={materialType} color={materialColor} />
            </Box>
            <Box args={[0.5, 4, 0.5]} position={[w/2 - 2, 0, 0.5]}>
               <meshStandardMaterial color="#333" roughness={0.4} metalness={0.8} />
            </Box>
         </group>
      )}

      {type === 'cpu_holder' && (
         <Box args={[w - 2, h - 2, d]} position={[0, h/2, 0]}>
             <meshStandardMaterial color="#111" wireframe opacity={0.1} transparent />
         </Box>
      )}
      
      {type === 'shelves' && (
        <group>
           <Box args={[w, 0.75, d]} position={[0, h * 0.33, 0]}><Material type={materialType} color={materialColor} /></Box>
           <Box args={[w, 0.75, d]} position={[0, h * 0.66, 0]}><Material type={materialType} color={materialColor} /></Box>
        </group>
      )}
    </group>
  );
};

const DeskModel: React.FC<DeskModelProps> = ({ config, opacity = 1 }) => {
  const { 
    room, deskHeight, deskDepth, 
    baseLayout, upperLayout, hasUppers, upperDepth, upperHeightFromDesk,
    material, tvSize, monitorCount 
  } = config;

  const spaceWidth = room.width;

  const materialColor = useMemo(() => {
    switch (material) {
      case 'Birch Plywood': return '#E3C8AA';
      case 'Walnut Plywood': return '#5D4037';
      case 'Solid Oak': return '#C19A6B';
      case 'Painted MDF': return '#ECEFF1'; // White-ish
      default: return '#E0E0E0';
    }
  }, [material]);

  // --- Calculate Base Layout ---
  const storageWidth = 24;
  const totalStorageUnits = baseLayout.filter(t => t !== 'empty').length;
  const emptyUnits = baseLayout.filter(t => t === 'empty').length;
  
  const remainingWidth = spaceWidth - (totalStorageUnits * storageWidth);
  const kneeSpaceWidth = emptyUnits > 0 ? remainingWidth / emptyUnits : 0;

  let currentX = -spaceWidth / 2;

  const baseComponents = baseLayout.map((type, idx) => {
    const unitWidth = type === 'empty' ? kneeSpaceWidth : storageWidth;
    const posX = currentX + unitWidth / 2;
    currentX += unitWidth;

    return (
      <CabinetUnit 
        key={`base-${idx}`}
        type={type}
        size={[unitWidth, deskHeight - 1.5, deskDepth]} // -1.5 for countertop
        position={[posX, 0, 0]}
        materialType={material}
        materialColor={materialColor}
      />
    );
  });

  // --- Countertop ---
  const countertop = (
    <Box 
      args={[spaceWidth, 1.5, deskDepth + 1]} 
      position={[0, deskHeight - 0.75, 0.5]}
      castShadow receiveShadow
    >
       <Material type={material} color={material === 'Painted MDF' ? '#8D6E63' : materialColor} />
    </Box>
  );

  // --- Upper Layout ---
  let upperComponents = null;
  if (hasUppers) {
    const upperYStart = deskHeight + upperHeightFromDesk;
    const upperHeight = room.height - upperYStart - 4; // 4 inch gap at top
    
    const tvGapIndex = upperLayout.indexOf('tv_gap');
    let uCurrentX = -spaceWidth / 2;
    
    upperComponents = upperLayout.map((type, idx) => {
       let unitWidth = spaceWidth / upperLayout.length;
       
       // Adjust for TV Gap if present
       if (tvGapIndex !== -1) {
         if (type === 'tv_gap') unitWidth = Math.max(tvSize * 1.2, 48); // Ensure enough space for TV
         else unitWidth = (spaceWidth - Math.max(tvSize * 1.2, 48)) / (upperLayout.length - 1);
       }
       
       const posX = uCurrentX + unitWidth / 2;
       uCurrentX += unitWidth;

       if (type === 'tv_gap') {
          // Render TV if exists
          if (tvSize > 0) {
             const tvW = tvSize * 0.87;
             const tvH = tvSize * 0.49;
             return (
                <group key={`upper-${idx}`} position={[posX, upperYStart + tvH/2 + 2, -deskDepth/2 + 2]}>
                  {/* TV Screen */}
                   <Box args={[tvW, tvH, 1]}>
                      <meshStandardMaterial color="#000" roughness={0.2} metalness={0.8} />
                   </Box>
                   {/* Emissive Screen Glow */}
                   <Box args={[tvW - 1, tvH - 1, 1.1]}>
                      <meshStandardMaterial color="#1a1a1a" emissive="#1a1a1a" emissiveIntensity={0.5} roughness={0.2} />
                   </Box>
                </group>
             );
          }
          return null;
       }

       return (
          <CabinetUnit
             key={`upper-${idx}`}
             type={type === 'shelves' ? 'shelves' : 'cabinet'}
             size={[unitWidth, upperHeight, upperDepth]}
             position={[posX, upperYStart, -deskDepth/2 + upperDepth/2]}
             materialType={material}
             materialColor={materialColor}
          />
       );
    });
  }

  // --- Monitors ---
  const monitors = [];
  if (monitorCount > 0) {
     // Find the empty spot in base layout to place monitors
     let emptyIndex = baseLayout.indexOf('empty');
     if (emptyIndex === -1) emptyIndex = Math.floor(baseLayout.length / 2); // Fallback to center
     
     // Recalculate X position for that empty spot
     let mX = -spaceWidth/2;
     for(let i=0; i<emptyIndex; i++) {
        mX += (baseLayout[i] === 'empty' ? kneeSpaceWidth : storageWidth);
     }
     mX += (baseLayout[emptyIndex] === 'empty' ? kneeSpaceWidth : storageWidth) / 2;

     for (let i = 0; i < monitorCount; i++) {
        const offset = monitorCount > 1 ? (i === 0 ? -12 : 12) : 0;
        monitors.push(
           <group key={`mon-${i}`} position={[mX + offset, deskHeight, -deskDepth/4]}>
              <Box args={[22, 14, 1]} position={[0, 12, 0]}>
                 <meshStandardMaterial color="#000" roughness={0.2} metalness={0.9} />
              </Box>
              {/* Screen Glow */}
              <Box args={[21, 13, 1.1]} position={[0, 12, 0]}>
                 <meshStandardMaterial color="#222" emissive="#223344" emissiveIntensity={0.6} />
              </Box>
              <Box args={[2, 10, 2]} position={[0, 5, -1]}>
                 <meshStandardMaterial color="#222" />
              </Box>
           </group>
        );
     }
  }

  return (
    <group>
       <group name="base-cabinets">{baseComponents}</group>
       <group name="countertop">{countertop}</group>
       <group name="upper-cabinets">{upperComponents}</group>
       <group name="monitors">{monitors}</group>
    </group>
  );
};

export default DeskModel;