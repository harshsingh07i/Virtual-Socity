export type BuildingCategory =
  | 'government'
  | 'justice'
  | 'economy'
  | 'services'
  | 'housing';

export type BuildingType =
  | 'house'
  | 'apartments'
  | 'government'
  | 'police'
  | 'court'
  | 'detention'
  | 'market'
  | 'grocery'
  | 'food'
  | 'bank'
  | 'workshop'
  | 'factory'
  | 'office'
  | 'warehouse'
  | 'hospital'
  | 'school'
  | 'fire'
  | 'water'
  | 'power'
  | 'waste'
  | 'transit'
  | 'park'
  | 'lab'
  | 'plaza';

export interface BuildingDefinition {
  id: string;
  name: string;
  label: string;
  type: BuildingType;
  category: BuildingCategory;
  description: string;
  x: number; // 0 - 1000 coordinate
  y: number; // 0 - 1000 coordinate
  width: number;
  height: number;
  color: string;
  roofColor: string;
  accentColor: string;
  icon: string;
  capacity: number;
  condition: number; // 0..100% infrastructure condition
  inventory?: number;
  budget?: number;
  powerStatus?: boolean;
  waterStatus?: boolean;
  ownerAgentId?: string;
  ownerName?: string;
  actionTypes: string[];
}

export interface CityRoad {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  curveX?: number;
  curveY?: number;
  width?: number;
}

export interface TreeDefinition {
  x: number;
  y: number;
  size: number;
  type: 'oak' | 'pine' | 'blossom';
}

export interface StoneDefinition {
  x: number;
  y: number;
  size: number;
}

export interface FlowerPatch {
  x: number;
  y: number;
  color: string;
}

export interface ActiveTradeAnimation {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  label: string;
  progress: number;
}
