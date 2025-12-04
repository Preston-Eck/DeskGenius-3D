
import React, { Suspense, useState, useRef, useEffect, Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, TransformControls, ContactShadows, Box, Cylinder, Environment, useTexture } from '@react-three/drei';
import DeskModel from './DeskModel';
import { ProjectConfig, PlacedObject } from '../types';
import * as THREE from 'three';

interface DesignCanvasProps {
  deskConfig: ProjectConfig;
  setDeskConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>;
}

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Simple error boundary to catch Suspense/Texture errors
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// --- Textures ---
const FLOOR_TEXTURES = {
  wood: "https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?ixlib=rb-1.2.1&auto=format&fit=crop&w=1024&q=80",
  concrete: "https://images.unsplash.com/photo-1518391846015-55a33bbb70ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1024&q=80",
  carpet: "https://images.unsplash.com/photo-1596238379430-6ea066dc131c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1024&q=80"
};

const Floor: React.FC<{ room: ProjectConfig['room'] }> = ({ room }) => {
  // Use a fallback if texture fails to load (caught by ErrorBoundary in parent, or we can handle here)
  const textureUrl = FLOOR_TEXTURES[room.floorType] || FLOOR_TEXTURES.wood;
  const texture = useTexture(textureUrl);
  
  useEffect(() => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    // Adjust colors based on selection to blend with texture
    texture.needsUpdate = true;
  }, [texture, room.floorType]);

  return (
    <Box args={[room.width + 100, 1, room.depth + 100]} position={[0, -0.5, 0]} receiveShadow>
       <meshStandardMaterial 
         map={texture}
         color={room.floorColor} 
         roughness={room.floorType === 'carpet' ? 1 : 0.8} 
         metalness={room.floorType === 'concrete' ? 0.1 : 0}
         envMapIntensity={0.5}
       />
    </Box>
  );
};

// --- Decorative Objects Components ---
const DecorativeObject: React.FC<{ 
  obj: PlacedObject; 
  isSelected: boolean; 
  onSelect: () => void;
  onTransform: (pos: [number, number, number], rot: [number, number, number]) => void;
}> = ({ obj, isSelected, onSelect, onTransform }) => {
  const meshRef = useRef<THREE.Group>(null);

  const renderMesh = () => {
    switch(obj.type) {
      case 'chair':
        return (
          <group>
            <Box args={[18, 2, 18]} position={[0, 18, 0]}><meshStandardMaterial color="#333" roughness={0.8} /></Box>
            <Box args={[16, 20, 2]} position={[0, 28, 8]}><meshStandardMaterial color="#333" roughness={0.8} /></Box>
            <Cylinder args={[1, 1, 16]} position={[0, 8, 0]}><meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} /></Cylinder>
            <Box args={[20, 2, 20]} position={[0, 1, 0]}><meshStandardMaterial color="#222" roughness={0.9} /></Box>
          </group>
        );
      case 'printer':
        return (
          <group>
            <Box args={[16, 10, 12]} position={[0, 5, 0]}><meshStandardMaterial color="#eee" roughness={0.3} /></Box>
            <Box args={[14, 1, 10]} position={[0, 8, 0]}><meshStandardMaterial color="#111" roughness={0.2} /></Box>
          </group>
        );
      case 'lamp':
        return (
          <group>
            <Cylinder args={[3, 4, 1]} position={[0, 0.5, 0]}><meshStandardMaterial color="#333" /></Cylinder>
            <Cylinder args={[0.5, 0.5, 12]} position={[0, 6, 0]}><meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} /></Cylinder>
            <Cylinder args={[2, 6, 5]} position={[0, 12, 0]}><meshStandardMaterial color="white" transparent opacity={0.8} /></Cylinder>
          </group>
        );
      case 'stapler':
        return (
          <group>
            <Box args={[6, 2, 1.5]} position={[0, 1, 0]}><meshStandardMaterial color="#d32f2f" metalness={0.3} /></Box>
            <Box args={[6, 0.5, 1.5]} position={[0, 0.25, 0]}><meshStandardMaterial color="#999" metalness={0.8} /></Box>
          </group>
        );
      case 'books':
        return (
          <group>
            <Box args={[2, 8, 6]} position={[-2.5, 4, 0]}><meshStandardMaterial color="#1e88e5" /></Box>
            <Box args={[2, 7, 6]} position={[0, 3.5, 0]}><meshStandardMaterial color="#43a047" /></Box>
            <Box args={[2, 8.5, 6]} position={[2.5, 4.25, 0]}><meshStandardMaterial color="#e53935" /></Box>
          </group>
        );
      default: return <Box args={[5,5,5]}><meshStandardMaterial color="hotpink"/></Box>;
    }
  };

  return (
    <>
      {isSelected && (
        <TransformControls 
          object={meshRef} 
          mode="translate" 
          onMouseUp={() => {
            if (meshRef.current) {
               const p = meshRef.current.position;
               const r = meshRef.current.rotation;
               onTransform([p.x, p.y, p.z], [r.x, r.y, r.z]);
            }
          }} 
        />
      )}
      <group 
        ref={meshRef} 
        position={new THREE.Vector3(...obj.position)} 
        rotation={new THREE.Euler(...obj.rotation)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {renderMesh()}
      </group>
    </>
  );
};

const SceneContent: React.FC<{ 
  deskConfig: ProjectConfig, 
  setDeskConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>,
  selectedId: string | null,
  setSelectedId: (id: string | null) => void
}> = ({ deskConfig, setDeskConfig, selectedId, setSelectedId }) => {
  const { room } = deskConfig;

  const updateObject = (id: string, pos: [number, number, number], rot: [number, number, number]) => {
     setDeskConfig(prev => ({
       ...prev,
       placedObjects: prev.placedObjects.map(o => o.id === id ? { ...o, position: pos, rotation: rot } : o)
     }));
  };

  return (
    <>
      {/* Lighting & Environment */}
      <Environment preset="apartment" background={false} blur={0.6} />
      
      <ambientLight intensity={0.4} />
      <pointLight position={[0, room.height - 20, 20]} intensity={0.5} castShadow />
      <directionalLight 
        position={[50, 50, 50]} 
        intensity={0.6} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-bias={-0.0001}
      />
      
      {/* Room Shell */}
      <group position={[0, -room.height/2 + 20, 0]}> 
         <Floor room={room} />
         
         {/* Back Wall */}
         <Box args={[room.width, room.height, 1]} position={[0, room.height/2, -room.depth/2]} receiveShadow castShadow>
            <meshStandardMaterial color={room.wallColor} />
         </Box>

         {/* Side Walls (Visual Only) */}
         {room.sideWalls[0] && (
           <Box args={[1, room.height, room.depth]} position={[-room.width/2, room.height/2, 0]} receiveShadow>
              <meshStandardMaterial color={room.wallColor} />
           </Box>
         )}
         
         {room.sideWalls[1] && (
           <Box args={[1, room.height, room.depth]} position={[room.width/2, room.height/2, 0]} receiveShadow>
              <meshStandardMaterial color={room.wallColor} />
           </Box>
         )}
         
         {/* Ceiling Hint */}
         <Box args={[room.width, 1, room.depth]} position={[0, room.height, 0]}>
            <meshStandardMaterial color="#fff" opacity={0.1} transparent />
         </Box>

         {/* The Desk */}
         <group position={[0, 0, -room.depth/2 + deskConfig.deskDepth/2]}>
           <DeskModel config={deskConfig} />
         </group>

         {/* Placed Objects */}
         {deskConfig.placedObjects.map(obj => (
           <DecorativeObject 
             key={obj.id} 
             obj={obj} 
             isSelected={selectedId === obj.id}
             onSelect={() => setSelectedId(obj.id)}
             onTransform={(p, r) => updateObject(obj.id, p, r)}
           />
         ))}

      </group>

      <ContactShadows position={[0, -0.4, 0]} opacity={0.6} scale={200} blur={2} far={4} color="#000000" />
      
      <OrbitControls makeDefault enableDamping minPolarAngle={0} maxPolarAngle={Math.PI / 1.9} />
    </>
  );
};


const DesignCanvas: React.FC<DesignCanvasProps> = ({ deskConfig, setDeskConfig }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="w-full h-full relative bg-gray-900 overflow-hidden" onClick={() => setSelectedId(null)}>
      <Canvas shadows camera={{ position: [0, 60, 120], fov: 45 }} className="z-10">
        <ErrorBoundary fallback={<group><Box args={[10,10,10]}><meshStandardMaterial color="red" /></Box></group>}>
           <Suspense fallback={null}>
              <SceneContent 
                deskConfig={deskConfig} 
                setDeskConfig={setDeskConfig} 
                selectedId={selectedId}
                setSelectedId={setSelectedId}
              />
           </Suspense>
        </ErrorBoundary>
      </Canvas>
    </div>
  );
};

export default DesignCanvas;
