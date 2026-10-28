'use client';
import React, { useMemo, useState } from 'react';
import { Agent, Event } from '@/lib/society';
import CityIsland from './CityIsland';
import BuildingNode from './BuildingNode';
import Citizen from './Citizen';
import CityEventOverlay from './CityEventOverlay';
import BuildingInspectorModal from './BuildingInspectorModal';
import { BuildingDefinition } from './types';

interface CitySceneProps {
  agents: Agent[];
  events: Event[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string | null) => void;
  speed: number;
  hour: number;
  isElectionActive?: boolean;
  isEmergencyActive?: boolean;
}

export const BUILDINGS_LIST: BuildingDefinition[] = [
  // 1. 10 Radial Residential Houses (one for each citizen)
  {
    id: 'house-0',
    name: "Asha's Pod",
    label: 'Asha',
    type: 'house',
    category: 'housing',
    description: 'Home of Asha the Master Builder. Eco-insulated modular pod.',
    x: 500,
    y: 235,
    width: 48,
    height: 48,
    color: '#6ee7b7',
    roofColor: '#059669',
    accentColor: '#34d399',
    icon: '🏡',
    capacity: 2,
    condition: 100,
    budget: 200,
    ownerAgentId: 'agent-1',
    ownerName: 'Asha',
    actionTypes: ['sleep', 'rest', 'plan'],
  },
  {
    id: 'house-1',
    name: "Milo's Pod",
    label: 'Milo',
    type: 'house',
    category: 'housing',
    description: 'Home of Milo the Merchant. Packed with ledgers and goods.',
    x: 655,
    y: 285,
    width: 48,
    height: 48,
    color: '#93c5fd',
    roofColor: '#2563eb',
    accentColor: '#60a5fa',
    icon: '🏡',
    capacity: 2,
    condition: 100,
    budget: 250,
    ownerAgentId: 'agent-2',
    ownerName: 'Milo',
    actionTypes: ['sleep', 'rest', 'count_credits'],
  },
  {
    id: 'house-2',
    name: "Nova's Pod",
    label: 'Nova',
    type: 'house',
    category: 'housing',
    description: 'Home of Nova the Quantum Scientist. Data terminals glowing inside.',
    x: 752,
    y: 418,
    width: 48,
    height: 48,
    color: '#c4b5fd',
    roofColor: '#7c3aed',
    accentColor: '#a78bfa',
    icon: '🏡',
    capacity: 2,
    condition: 98,
    budget: 180,
    ownerAgentId: 'agent-3',
    ownerName: 'Nova',
    actionTypes: ['sleep', 'rest', 'analyze'],
  },
  {
    id: 'house-3',
    name: "Zuri's Pod",
    label: 'Zuri',
    type: 'house',
    category: 'housing',
    description: 'Home of Zuri the Executive Chef. Aromas of herb soup and spice.',
    x: 752,
    y: 582,
    width: 48,
    height: 48,
    color: '#f9a8d4',
    roofColor: '#db2777',
    accentColor: '#f472b6',
    icon: '🏡',
    capacity: 2,
    condition: 100,
    budget: 220,
    ownerAgentId: 'agent-4',
    ownerName: 'Zuri',
    actionTypes: ['sleep', 'rest', 'cook'],
  },
  {
    id: 'house-4',
    name: "Theo's Pod",
    label: 'Theo',
    type: 'house',
    category: 'housing',
    description: 'Home of Theo the Rapid Courier. High-speed delivery gear mounted.',
    x: 655,
    y: 715,
    width: 48,
    height: 48,
    color: '#fcd34d',
    roofColor: '#d97706',
    accentColor: '#fbbf24',
    icon: '🏡',
    capacity: 2,
    condition: 95,
    budget: 190,
    ownerAgentId: 'agent-5',
    ownerName: 'Theo',
    actionTypes: ['sleep', 'rest', 'tune_scooter'],
  },
  {
    id: 'house-5',
    name: "Iris's Pod",
    label: 'Iris',
    type: 'house',
    category: 'housing',
    description: 'Home of Iris the City Artist. Colorful murals and kinetic sculptures.',
    x: 500,
    y: 765,
    width: 48,
    height: 48,
    color: '#fca5a5',
    roofColor: '#e11d48',
    accentColor: '#fb7185',
    icon: '🏡',
    capacity: 2,
    condition: 97,
    budget: 160,
    ownerAgentId: 'agent-6',
    ownerName: 'Iris',
    actionTypes: ['sleep', 'rest', 'paint'],
  },
  {
    id: 'house-6',
    name: "Kian's Pod",
    label: 'Kian',
    type: 'house',
    category: 'housing',
    description: 'Home of Kian the Systems Mechanic. Solar inverters and battery spares.',
    x: 345,
    y: 715,
    width: 48,
    height: 48,
    color: '#67e8f9',
    roofColor: '#0891b2',
    accentColor: '#22d3ee',
    icon: '🏡',
    capacity: 2,
    condition: 100,
    budget: 210,
    ownerAgentId: 'agent-7',
    ownerName: 'Kian',
    actionTypes: ['sleep', 'rest', 'craft'],
  },
  {
    id: 'house-7',
    name: "Remy's Pod",
    label: 'Remy',
    type: 'house',
    category: 'housing',
    description: 'Home of Remy the Organic Farmer. Hydroponic nursery at the doorway.',
    x: 248,
    y: 582,
    width: 48,
    height: 48,
    color: '#bef264',
    roofColor: '#65a30d',
    accentColor: '#84cc16',
    icon: '🏡',
    capacity: 2,
    condition: 99,
    budget: 230,
    ownerAgentId: 'agent-8',
    ownerName: 'Remy',
    actionTypes: ['sleep', 'rest', 'garden'],
  },
  {
    id: 'house-8',
    name: "Sana's Pod",
    label: 'Sana',
    type: 'house',
    category: 'housing',
    description: 'Home of Sana the Educator. Shelves of archived knowledge capsules.',
    x: 248,
    y: 418,
    width: 48,
    height: 48,
    color: '#fdba74',
    roofColor: '#ea580c',
    accentColor: '#fb923c',
    icon: '🏡',
    capacity: 2,
    condition: 100,
    budget: 240,
    ownerAgentId: 'agent-9',
    ownerName: 'Sana',
    actionTypes: ['sleep', 'rest', 'read'],
  },
  {
    id: 'house-9',
    name: "Ezra's Pod",
    label: 'Ezra',
    type: 'house',
    category: 'housing',
    description: 'Home of Ezra the Urban Planner & Council Member. Civic blueprints on desk.',
    x: 345,
    y: 285,
    width: 48,
    height: 48,
    color: '#a5b4fc',
    roofColor: '#4f46e5',
    accentColor: '#818cf8',
    icon: '🏡',
    capacity: 2,
    condition: 100,
    budget: 310,
    ownerAgentId: 'agent-10',
    ownerName: 'Ezra',
    actionTypes: ['sleep', 'rest', 'draft_policy'],
  },

  // 2. High-Density Visitor / Overflow Apartments
  {
    id: 'b-apt-1',
    name: 'North Heights Apartments',
    label: 'North Apts',
    type: 'apartments',
    category: 'housing',
    description: 'Multi-unit residences for guests, interns, and visiting delegates.',
    x: 880,
    y: 360,
    width: 58,
    height: 58,
    color: '#38bdf8',
    roofColor: '#0284c7',
    accentColor: '#7dd3fc',
    icon: '🏢',
    capacity: 8,
    condition: 95,
    budget: 450,
    actionTypes: ['lease', 'stay', 'visit'],
  },
  {
    id: 'b-apt-2',
    name: 'South Terrace Apartments',
    label: 'South Apts',
    type: 'apartments',
    category: 'housing',
    description: 'Modern residential suites overlooking the southern garden district.',
    x: 880,
    y: 640,
    width: 58,
    height: 58,
    color: '#818cf8',
    roofColor: '#4338ca',
    accentColor: '#a5b4fc',
    icon: '🏢',
    capacity: 8,
    condition: 96,
    budget: 450,
    actionTypes: ['lease', 'stay', 'visit'],
  },

  // 3. Government & Justice District (North-West)
  {
    id: 'b-cityhall',
    name: 'City Hall & Council Chamber',
    label: 'City Hall',
    type: 'government',
    category: 'government',
    description: 'Seat of municipal governance, democratic elections, and treasury management.',
    x: 220,
    y: 140,
    width: 72,
    height: 72,
    color: '#f59e0b',
    roofColor: '#b45309',
    accentColor: '#fcd34d',
    icon: '🏛️',
    capacity: 10,
    condition: 100,
    budget: 1500,
    actionTypes: ['vote', 'council_meeting', 'petition', 'enact_laws'],
  },
  {
    id: 'b-police',
    name: 'Police Headquarters',
    label: 'Police HQ',
    type: 'police',
    category: 'justice',
    description: 'Law enforcement dispatch, public safety monitoring, and community patrols.',
    x: 310,
    y: 140,
    width: 64,
    height: 64,
    color: '#3b82f6',
    roofColor: '#1d4ed8',
    accentColor: '#93c5fd',
    icon: '👮',
    capacity: 6,
    condition: 98,
    budget: 800,
    actionTypes: ['patrol', 'investigate', 'file_report', 'dispatch'],
  },
  {
    id: 'b-court',
    name: 'Municipal Court of Justice',
    label: 'Court',
    type: 'court',
    category: 'justice',
    description: 'Impartial civic courtroom for trial adjudication, contract disputes, and appeals.',
    x: 140,
    y: 220,
    width: 64,
    height: 64,
    color: '#64748b',
    roofColor: '#334155',
    accentColor: '#94a3b8',
    icon: '⚖️',
    capacity: 8,
    condition: 100,
    budget: 600,
    actionTypes: ['trial', 'arbitration', 'appeal', 'settlement'],
  },
  {
    id: 'b-detention',
    name: 'Civic Detention Center',
    label: 'Holding',
    type: 'detention',
    category: 'justice',
    description: 'Secured rehabilitation facility for convicted citizens and curfew violators.',
    x: 220,
    y: 230,
    width: 58,
    height: 58,
    color: '#3f3f46',
    roofColor: '#18181b',
    accentColor: '#71717a',
    icon: '🔒',
    capacity: 4,
    condition: 94,
    budget: 400,
    actionTypes: ['detain', 'rehabilitate', 'serve_sentence'],
  },

  // 4. Economy & Commerce District (North-East)
  {
    id: 'b-market',
    name: 'Central Marketplace',
    label: 'Marketplace',
    type: 'market',
    category: 'economy',
    description: 'Vibrant outdoor bazaar for open trading, resource exchange, and commerce.',
    x: 720,
    y: 140,
    width: 68,
    height: 68,
    color: '#c084fc',
    roofColor: '#9333ea',
    accentColor: '#e879f9',
    icon: '🛍️',
    capacity: 8,
    condition: 97,
    budget: 950,
    actionTypes: ['trade', 'barter', 'auction', 'inspect_goods'],
  },
  {
    id: 'b-grocery',
    name: 'Greenfield Grocery Store',
    label: 'Grocery',
    type: 'grocery',
    category: 'economy',
    description: 'Essential foods, farm-fresh produce, and daily nutritional rations.',
    x: 810,
    y: 140,
    width: 62,
    height: 62,
    color: '#22c55e',
    roofColor: '#15803d',
    accentColor: '#86efac',
    icon: '🍏',
    capacity: 6,
    condition: 100,
    inventory: 65,
    budget: 700,
    actionTypes: ['buy_food', 'restock', 'inspect_produce'],
  },
  {
    id: 'b-bank',
    name: 'Credit Exchange & Bank',
    label: 'City Bank',
    type: 'bank',
    category: 'economy',
    description: 'Secure credit vault, currency transfers, and municipal loan disbursement.',
    x: 890,
    y: 220,
    width: 64,
    height: 64,
    color: '#10b981',
    roofColor: '#047857',
    accentColor: '#6ee7b7',
    icon: '🏦',
    capacity: 6,
    condition: 100,
    budget: 2500,
    actionTypes: ['deposit', 'transfer_credits', 'withdraw', 'audit'],
  },
  {
    id: 'b-office',
    name: 'Commercial Offices',
    label: 'Offices',
    type: 'office',
    category: 'economy',
    description: 'Corporate headquarters for business logistics, contracts, and planning.',
    x: 800,
    y: 220,
    width: 60,
    height: 60,
    color: '#475569',
    roofColor: '#1e293b',
    accentColor: '#94a3b8',
    icon: '💼',
    capacity: 6,
    condition: 96,
    budget: 650,
    actionTypes: ['consult', 'draft_contracts', 'manage'],
  },

  // 5. Heavy Industry & Utilities (South-West)
  {
    id: 'b-power',
    name: 'Solar & Nuclear Power Grid',
    label: 'Power Grid',
    type: 'power',
    category: 'services',
    description: 'Substation providing electrical power across the entire miniature island.',
    x: 140,
    y: 780,
    width: 64,
    height: 64,
    color: '#eab308',
    roofColor: '#a16207',
    accentColor: '#fde047',
    icon: '⚡',
    capacity: 4,
    condition: 92,
    budget: 850,
    actionTypes: ['power_maintenance', 'calibrate_grid', 'recharge'],
  },
  {
    id: 'b-water',
    name: 'Water Treatment Plant',
    label: 'Water Plant',
    type: 'water',
    category: 'services',
    description: 'Aqueduct pumps and nanofiltration providing pure drinking water.',
    x: 220,
    y: 780,
    width: 64,
    height: 64,
    color: '#06b6d4',
    roofColor: '#0e7490',
    accentColor: '#67e8f9',
    icon: '💧',
    capacity: 4,
    condition: 95,
    budget: 750,
    actionTypes: ['purify_water', 'inspect_pumps', 'sample_test'],
  },
  {
    id: 'b-waste',
    name: 'Eco-Waste Recycling Unit',
    label: 'Recycling',
    type: 'waste',
    category: 'services',
    description: 'Closed-loop material decomposition and eco-fertilizer production.',
    x: 140,
    y: 860,
    width: 60,
    height: 60,
    color: '#84cc16',
    roofColor: '#4d7c0f',
    accentColor: '#bef264',
    icon: '♻️',
    capacity: 4,
    condition: 90,
    budget: 500,
    actionTypes: ['recycle', 'compost', 'cleanup'],
  },
  {
    id: 'b-workshop',
    name: 'Tech & Fabrication Workshop',
    label: 'Workshop',
    type: 'workshop',
    category: 'economy',
    description: 'Robotics assembly, hardware maintenance, and prototype crafting.',
    x: 230,
    y: 870,
    width: 66,
    height: 66,
    color: '#fbbf24',
    roofColor: '#b45309',
    accentColor: '#f59e0b',
    icon: '🔧',
    capacity: 6,
    condition: 98,
    budget: 900,
    actionTypes: ['craft', 'repair_gear', 'fabricate', 'work'],
  },
  {
    id: 'b-factory',
    name: 'Nexus Assembly Factory',
    label: 'Factory',
    type: 'factory',
    category: 'economy',
    description: 'Automated factory floor producing civic supplies and solar cells.',
    x: 320,
    y: 870,
    width: 68,
    height: 68,
    color: '#d97706',
    roofColor: '#78350f',
    accentColor: '#f59e0b',
    icon: '🏭',
    capacity: 6,
    condition: 93,
    budget: 1100,
    actionTypes: ['manufacture', 'assemble', 'pack_goods', 'work'],
  },

  // 6. Civic Services, Food & Community (South-East)
  {
    id: 'b-hospital',
    name: 'Civic Health Clinic',
    label: 'Hospital',
    type: 'hospital',
    category: 'services',
    description: 'Emergency medicine, regenerative therapy, and wellbeing monitoring.',
    x: 860,
    y: 780,
    width: 66,
    height: 66,
    color: '#f43f5e',
    roofColor: '#be123c',
    accentColor: '#fda4af',
    icon: '🏥',
    capacity: 6,
    condition: 100,
    budget: 1200,
    actionTypes: ['heal', 'medical_check', 'rest', 'therapy'],
  },
  {
    id: 'b-fire',
    name: 'Fire & Rescue Station',
    label: 'Fire Dept',
    type: 'fire',
    category: 'services',
    description: 'Rapid response unit for structural fires, chemical leaks, and emergencies.',
    x: 770,
    y: 780,
    width: 62,
    height: 62,
    color: '#ef4444',
    roofColor: '#b91c1c',
    accentColor: '#fca5a5',
    icon: '🚒',
    capacity: 4,
    condition: 99,
    budget: 650,
    actionTypes: ['emergency_drill', 'rescue', 'safety_audit'],
  },
  {
    id: 'b-food',
    name: 'Neon Oasis Cafe & Diner',
    label: 'Food Shop',
    type: 'food',
    category: 'services',
    description: 'Popular communal diner serving energizing meals, noodles, and hot beverages.',
    x: 780,
    y: 860,
    width: 66,
    height: 66,
    color: '#f472b6',
    roofColor: '#e11d48',
    accentColor: '#fb7185',
    icon: '☕',
    capacity: 8,
    condition: 99,
    inventory: 80,
    budget: 750,
    actionTypes: ['eat', 'drink', 'socialize', 'order_meal'],
  },
  {
    id: 'b-school',
    name: 'Academy of Sciences & Arts',
    label: 'Academy',
    type: 'school',
    category: 'services',
    description: 'Lifelong learning lectures, AI society ethics, and technical training.',
    x: 870,
    y: 870,
    width: 64,
    height: 64,
    color: '#6366f1',
    roofColor: '#4338ca',
    accentColor: '#a5b4fc',
    icon: '🎓',
    capacity: 6,
    condition: 98,
    budget: 700,
    actionTypes: ['study', 'teach', 'lecture', 'read'],
  },
  {
    id: 'b-warehouse',
    name: 'Civic Storage Warehouse',
    label: 'Depot',
    type: 'warehouse',
    category: 'economy',
    description: 'Long-term inventory depot for grain, construction parts, and reserve supplies.',
    x: 680,
    y: 860,
    width: 60,
    height: 60,
    color: '#78716c',
    roofColor: '#44403c',
    accentColor: '#a8a29e',
    icon: '📦',
    capacity: 4,
    condition: 96,
    budget: 400,
    actionTypes: ['store_goods', 'inventory_check', 'logistics'],
  },

  // 7. Transit, Research & Green Nodes
  {
    id: 'b-transit',
    name: 'Grand Transit Hub',
    label: 'Transit Hub',
    type: 'transit',
    category: 'services',
    description: 'Automated electric shuttles, courier dispatch, and commuter docks.',
    x: 890,
    y: 500,
    width: 64,
    height: 64,
    color: '#14b8a6',
    roofColor: '#0f766e',
    accentColor: '#5eead4',
    icon: '🚏',
    capacity: 6,
    condition: 97,
    budget: 800,
    actionTypes: ['commute', 'dispatch', 'fast_travel'],
  },
  {
    id: 'b-lab',
    name: 'Quantum Research Lab',
    label: 'Research Lab',
    type: 'lab',
    category: 'services',
    description: 'Breakthrough studies in AI cognition, synthetic biology, and energy.',
    x: 120,
    y: 360,
    width: 66,
    height: 66,
    color: '#38bdf8',
    roofColor: '#0284c7',
    accentColor: '#7dd3fc',
    icon: '🔬',
    capacity: 6,
    condition: 100,
    budget: 1400,
    actionTypes: ['research', 'experiment', 'synthesize', 'publish'],
  },
];

export default function CityScene({
  agents,
  events,
  selectedAgentId,
  onSelectAgent,
  speed,
  hour,
  isElectionActive = false,
  isEmergencyActive = false,
}: CitySceneProps) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  // Compute accurate positions for all 10 agents on the 1000x1000 miniature island
  const agentTargetPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};

    agents.forEach((agent) => {
      const agentNum = parseInt(agent.id.replace('agent-', ''), 10) || 1;
      const houseIndex = (agentNum - 1) % 10;
      const ownHouse = BUILDINGS_LIST[houseIndex];

      const actionText = (agent.lastAction || '').toLowerCase();
      const loc = agent.location || 'Homes';

      // 1. Arrested / Detained in jail
      if (actionText.includes('detain') || actionText.includes('jail') || loc.includes('Holding') || loc.includes('Detention')) {
        positions[agent.id] = { x: 220, y: 245 };
      }
      // 2. Resting / Sleeping at home (Pods for 1-10; North Heights Apts for 11-15; South Terrace Apts for 16-20)
      else if (
        actionText.includes('rested') ||
        actionText.includes('energy') ||
        loc === 'Homes' ||
        loc === 'North Heights Apartments' ||
        loc === 'South Terrace Apartments' ||
        (hour >= 23 || hour < 6)
      ) {
        if (agentNum <= 10) {
          positions[agent.id] = {
            x: ownHouse.x,
            y: ownHouse.y + 26,
          };
        } else if (agentNum <= 15) {
          const slot = agentNum - 11;
          positions[agent.id] = {
            x: 880 + (slot % 3 - 1) * 14,
            y: 375 + Math.floor(slot / 3) * 14,
          };
        } else {
          const slot = agentNum - 16;
          positions[agent.id] = {
            x: 880 + (slot % 3 - 1) * 14,
            y: 655 + Math.floor(slot / 3) * 14,
          };
        }
      }
      // 3. Eating / Dining
      else if (actionText.includes('meal') || actionText.includes('eat') || actionText.includes('bought') || loc === 'Cafe') {
        positions[agent.id] = {
          x: 780 + ((agentNum % 3) - 1) * 16,
          y: 875,
        };
      }
      // 4. Grocery Shopping
      else if (loc === 'Grocery' || actionText.includes('grocery') || actionText.includes('produce')) {
        positions[agent.id] = {
          x: 810 + ((agentNum % 3) - 1) * 15,
          y: 155,
        };
      }
      // 5. Trading & Bank
      else if (actionText.includes('transferred') || actionText.includes('trade') || loc === 'Market' || loc === 'Central Market') {
        positions[agent.id] = {
          x: 720 + ((agentNum % 3) - 1) * 16,
          y: 155,
        };
      } else if (loc === 'Bank' || actionText.includes('credit')) {
        positions[agent.id] = {
          x: 890,
          y: 235,
        };
      }
      // 6. Working (Directed to their actual profession facility)
      else if (actionText.includes('worked') || actionText.includes('earn')) {
        switch (agent.role) {
          case 'Builder': // Asha -> Tech Workshop
            positions[agent.id] = { x: 230, y: 885 };
            break;
          case 'Trader': // Milo -> Central Marketplace
            positions[agent.id] = { x: 720, y: 155 };
            break;
          case 'Researcher': // Nova -> Quantum Lab
            positions[agent.id] = { x: 120, y: 375 };
            break;
          case 'Chef': // Zuri -> Neon Oasis Cafe
            positions[agent.id] = { x: 780, y: 875 };
            break;
          case 'Courier': // Theo -> Transit Hub
            positions[agent.id] = { x: 890, y: 515 };
            break;
          case 'Artist': // Iris -> Town Plaza
            positions[agent.id] = { x: 500, y: 470 };
            break;
          case 'Mechanic': // Kian -> Power Substation
            positions[agent.id] = { x: 140, y: 795 };
            break;
          case 'Farmer': // Remy -> Eco-Recycle
            positions[agent.id] = { x: 140, y: 875 };
            break;
          case 'Teacher': // Sana -> Academy of Sciences
            positions[agent.id] = { x: 870, y: 885 };
            break;
          case 'Planner': // Ezra -> City Hall
            positions[agent.id] = { x: 220, y: 155 };
            break;
          // Citizens 11-20
          case 'Detective': // Vance -> Police HQ
            positions[agent.id] = { x: 310, y: 155 };
            break;
          case 'Botanist': // Lyra -> Hydroponic Garden
            positions[agent.id] = { x: 120, y: 650 };
            break;
          case 'Grid Engineer': // Orion -> Power Substation
            positions[agent.id] = { x: 140, y: 795 };
            break;
          case 'Doctor': // Nadia -> Health Clinic & Hospital
            positions[agent.id] = { x: 860, y: 795 };
            break;
          case 'Banker': // Felix -> City Bank
            positions[agent.id] = { x: 890, y: 235 };
            break;
          case 'Factory Supervisor': // Cora -> Assembly Factory
            positions[agent.id] = { x: 320, y: 885 };
            break;
          case 'Water Specialist': // Silas -> Water Treatment Plant
            positions[agent.id] = { x: 220, y: 795 };
            break;
          case 'Firefighter': // Maya -> Fire Station
            positions[agent.id] = { x: 770, y: 795 };
            break;
          case 'Grocer': // Leo -> Fresh Grocery
            positions[agent.id] = { x: 810, y: 155 };
            break;
          case 'Journalist': // Tara -> Commercial Offices
            positions[agent.id] = { x: 800, y: 235 };
            break;
          default:
            positions[agent.id] = { x: 230, y: 885 };
            break;
        }
      }
      // 7. Police Duty / Court / Petitions
      else if (loc === 'Police HQ' || actionText.includes('patrol')) {
        positions[agent.id] = { x: 310, y: 155 };
      } else if (loc === 'Court' || actionText.includes('trial') || actionText.includes('hearing')) {
        positions[agent.id] = { x: 140, y: 235 };
      } else if (loc === 'City Hall' || actionText.includes('petition') || actionText.includes('vote')) {
        positions[agent.id] = { x: 220, y: 155 };
      }
      // 8. Health Clinic
      else if (loc === 'Hospital' || actionText.includes('heal') || actionText.includes('doctor')) {
        positions[agent.id] = { x: 860, y: 795 };
      }
      // 9. Socializing or Walking at Central Plaza
      else {
        const angle = ((agentNum - 1) / 20) * 2 * Math.PI;
        positions[agent.id] = {
          x: Math.round(500 + 58 * Math.cos(angle)),
          y: Math.round(500 + 48 * Math.sin(angle)),
        };
      }
    });

    return positions;
  }, [agents, hour]);

  // Compute building occupancy count map
  const buildingOccupancy = useMemo(() => {
    const counts: Record<string, number> = {};
    agents.forEach((agent) => {
      if (!agent.alive) return;
      const pos = agentTargetPositions[agent.id];
      if (!pos) return;

      // Find closest building within 50px
      let closestId = '';
      let minDist = 55;
      BUILDINGS_LIST.forEach((b) => {
        const d = Math.hypot(b.x - pos.x, b.y - (pos.y - 10));
        if (d < minDist) {
          minDist = d;
          closestId = b.id;
        }
      });

      if (closestId) {
        counts[closestId] = (counts[closestId] || 0) + 1;
      }
    });
    return counts;
  }, [agents, agentTargetPositions]);

  // Selected building definition and its current occupants
  const selectedBuilding = useMemo(() => {
    if (!selectedBuildingId) return null;
    return BUILDINGS_LIST.find((b) => b.id === selectedBuildingId) || null;
  }, [selectedBuildingId]);

  const buildingOccupants = useMemo(() => {
    if (!selectedBuilding) return [];
    return agents.filter((a) => {
      if (!a.alive) return false;
      const pos = agentTargetPositions[a.id];
      if (!pos) return false;
      return Math.hypot(selectedBuilding.x - pos.x, selectedBuilding.y - (pos.y - 10)) < 55;
    });
  }, [selectedBuilding, agents, agentTargetPositions]);

  return (
    <div
      onClick={() => {
        onSelectAgent(null);
        setSelectedBuildingId(null);
      }}
      className="relative mx-auto w-full max-w-[960px] aspect-square select-none overflow-hidden rounded-3xl border border-[#213247] bg-[#0c121e] shadow-2xl"
    >
      {/* 1. Base Island Terrain, Paths, Plaza, Monuments, and Vegetation */}
      <CityIsland hour={hour} />

      {/* 2. Interactive Buildings Layer (All 26 Buildings) */}
      <div className="absolute inset-0 pointer-events-none">
        {BUILDINGS_LIST.map((b) => (
          <div key={b.id} className="pointer-events-auto">
            <BuildingNode
              building={b}
              occupantCount={buildingOccupancy[b.id] || 0}
              isSelected={selectedBuildingId === b.id}
              onClick={() => {
                onSelectAgent(null);
                setSelectedBuildingId(b.id);
              }}
              hour={hour}
              isElectionActive={isElectionActive}
              isEmergencyActive={isEmergencyActive}
            />
          </div>
        ))}
      </div>

      {/* 3. Animated Citizens Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {agents.map((agent) => {
          if (!agent.alive) return null;
          const pos = agentTargetPositions[agent.id] || { x: 500, y: 500 };
          return (
            <div key={agent.id} className="pointer-events-auto">
              <Citizen
                agent={agent}
                targetX={pos.x}
                targetY={pos.y}
                isSelected={selectedAgentId === agent.id}
                onClick={() => {
                  setSelectedBuildingId(null);
                  onSelectAgent(agent.id);
                }}
                speed={speed}
              />
            </div>
          );
        })}
      </div>

      {/* 4. Ambient Event Notification Overlay */}
      <CityEventOverlay events={events} agents={agents} />

      {/* 5. Building Inspector Modal */}
      <BuildingInspectorModal
        building={selectedBuilding}
        occupants={buildingOccupants}
        onClose={() => setSelectedBuildingId(null)}
        onSelectAgent={(agentId) => onSelectAgent(agentId)}
      />
    </div>
  );
}
