
export type MaterialType = 'Birch Plywood' | 'Walnut Plywood' | 'Solid Oak' | 'Painted MDF';
export type BaseUnitType = 'drawers' | 'cabinet' | 'cpu_holder' | 'empty';
export type UpperUnitType = 'cabinet' | 'shelves' | 'tv_gap' | 'none';

export type ObjectType = 'chair' | 'printer' | 'lamp' | 'plant' | 'books' | 'stapler';

export interface PlacedObject {
  id: string;
  type: ObjectType;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface RoomConfig {
  width: number;
  height: number; // Ceiling height
  depth: number;
  wallColor: string;
  floorType: 'wood' | 'carpet' | 'concrete';
  floorColor: string;
  sideWalls: [boolean, boolean]; // [Left, Right] visibility
}

export interface ProjectConfig {
  // Project Meta
  images: string[]; // Base64 strings of uploaded photos
  
  // Room
  room: RoomConfig;

  // Desk/Base Dimensions
  deskHeight: number;
  deskDepth: number;
  
  // Base Cabinetry
  baseLayout: BaseUnitType[]; // e.g. ['drawers', 'empty', 'cabinet']
  
  // Upper Cabinetry
  hasUppers: boolean;
  upperDepth: number;
  upperLayout: UpperUnitType[]; // e.g. ['cabinet', 'tv_gap', 'cabinet']
  upperHeightFromDesk: number; // Distance from desktop to bottom of uppers
  
  // Equipment
  tvSize: number; // inches (diagonal), 0 if none
  monitorCount: number; // 0, 1, 2
  
  material: MaterialType;
  
  // Scene
  placedObjects: PlacedObject[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface BuildStep {
  title: string;
  description: string;
}

export interface CutListItem {
  partName: string;
  dimensions: string;
  quantity: number;
  material: string;
}

export interface BuildGuideData {
  cutList: CutListItem[];
  steps: BuildStep[];
  toolsRequired: string[];
}
