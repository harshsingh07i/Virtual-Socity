import type { GoogleGenAI } from '@google/genai';
import { prisma } from './prisma';
import { calculatePhase, calculateSeason } from './simulation-clock';
import { simulationWorker } from './simulation-worker';

export type Action =
  | 'work'
  | 'rest'
  | 'eat'
  | 'socialize'
  | 'trade'
  | 'help'
  | 'patrol'
  | 'inspect'
  | 'vote'
  | 'petition';

export type Agent = {
  id: string; // e.g. "agent-1" .. "agent-20"
  dbId?: string; // Prisma cuid
  name: string;
  role: string;
  personality: string;
  goal: string;
  credits: number;
  energy: number;
  hunger: number;
  health: number;
  happiness: number;
  alive: boolean;
  location: string;
  homeLocation?: string; // e.g. "Pod 1" or "North Heights Apartments"
  inventory?: string[];  // e.g. ["Civic ID", "Tool Kit", "Ration Pass"]
  relationships?: Record<string, number>;
  memory: string[];
  lastAction: string;
  color: string;
  x: number;
  y: number;
  salary: number;
  department?: string;
  isMayor?: boolean;
  isOfficer?: boolean;
  isJudge?: boolean;
  detainedHours?: number;
};

export type DecisionRecord = {
  id: string;
  agentId: string;
  agentName: string;
  problemDetected: string;
  relevantInfo: string;
  optionsConsidered: string[];
  chosenAction: string;
  decisionReason: string;
  expectedOutcome: string;
  actualResult?: string | null;
  round: number;
  hour: number;
  createdAt?: string;
};

export type Event = {
  id: number;
  time: string;
  kind: string;
  text: string;
  agent?: string;
  round?: number;
};

export type SocietyState = {
  sessionId: string;
  sessionTitle: string;
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'error';
  hour: number;
  day: number;
  totalDays: number;
  year: number;
  season: string;
  phase: string;
  agents: Agent[];
  events: Event[];
  error?: string;
  rounds: number;
  speed: number;
  treasury?: number;
  incomeTaxRate?: number;
  salesTaxRate?: number;
  foodPrice?: number;
  powerPrice?: number;
  waterPrice?: number;
  mayorName?: string;
  activeEmergency?: string;

  // God Mode & Crisis Controls
  foodSupplyActive?: boolean;
  waterSupplyActive?: boolean;
  powerGridActive?: boolean;
  factorySupplyActive?: boolean;
  policePatrolBudget?: number;
  crimeRisk?: number;
  pollutionLevel?: number;
  activeCrises?: string[];
  decisionLogs?: DecisionRecord[];

  lastProcessedAt?: string;
  stoppedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SessionSummary = {
  id: string;
  title: string;
  status: string;
  hour: number;
  day: number;
  totalDays: number;
  year: number;
  season: string;
  phase: string;
  speed: number;
  rounds: number;
  agentCount: number;
  aliveCount: number;
  eventCount: number;
  treasury?: number;
  mayorName?: string;
  createdAt: string;
  updatedAt: string;
};

export const LOCATION_COORDINATES: Record<string, { x: number; y: number }> = {
  Homes: { x: 50, y: 50 },
  'North Heights Apartments': { x: 88, y: 36 },
  'South Terrace Apartments': { x: 88, y: 64 },
  'City Hall': { x: 22, y: 14 },
  'Police HQ': { x: 31, y: 14 },
  Court: { x: 14, y: 22 },
  Holding: { x: 22, y: 23 },
  Detention: { x: 22, y: 23 },
  Market: { x: 72, y: 14 },
  'Central Market': { x: 72, y: 14 },
  Grocery: { x: 81, y: 14 },
  Bank: { x: 89, y: 22 },
  Offices: { x: 80, y: 22 },
  Workshop: { x: 23, y: 87 },
  Factory: { x: 32, y: 87 },
  Power: { x: 14, y: 78 },
  Water: { x: 22, y: 78 },
  Recycling: { x: 14, y: 86 },
  Hospital: { x: 86, y: 78 },
  'Fire Dept': { x: 77, y: 78 },
  Cafe: { x: 78, y: 86 },
  Academy: { x: 87, y: 87 },
  School: { x: 87, y: 87 },
  Depot: { x: 68, y: 86 },
  'Transit Hub': { x: 89, y: 50 },
  'Research Lab': { x: 12, y: 36 },
  Library: { x: 12, y: 36 },
  Plaza: { x: 50, y: 50 },
  'City Plaza': { x: 50, y: 50 },
  Garden: { x: 12, y: 64 },
};

const seeds = [
  // 1-10: Living in Individual Residential Pods (Surrounding Town Plaza)
  ['Asha', 'Builder', 'optimistic and practical', 'Maintain and upgrade city infrastructure', '#6ee7b7', 16, 'Public Works', "Asha's Pod", '["Civic ID", "Plasma Welder", "Ration Pass"]'],
  ['Milo', 'Trader', 'curious and persuasive', 'Keep markets balanced through fair trade', '#93c5fd', 15, 'Commerce', "Milo's Pod", '["Civic ID", "Trade Ledger Slate", "Market Pass"]'],
  ['Nova', 'Researcher', 'analytical and cautious', 'Advance scientific knowledge and clean tech', '#c4b5fd', 18, 'Health & Safety', "Nova's Pod", '["Civic ID", "Sample Scanner", "Lab Access Key"]'],
  ['Zuri', 'Chef', 'generous and social', 'Ensure abundant, nourishing food for everyone', '#f9a8d4', 14, 'Commerce', "Zuri's Pod", '["Civic ID", "Chef Knives", "Spice Kit"]'],
  ['Theo', 'Courier', 'energetic and competitive', 'Keep logistics and transit flowing rapidly', '#fcd34d', 14, 'Public Works', "Theo's Pod", '["Civic ID", "Dispatch Holo", "Speed Skates"]'],
  ['Iris', 'Artist', 'creative and sensitive', 'Inspire civic happiness and creative culture', '#fca5a5', 12, 'Administration', "Iris's Pod", '["Civic ID", "Holo Palette", "Sketchpad"]'],
  ['Kian', 'Mechanic', 'resourceful and independent', 'Protect power grids and water filtration', '#67e8f9', 16, 'Public Works', "Kian's Pod", '["Civic ID", "Torque Wrench", "Diagnostic Wire"]'],
  ['Remy', 'Farmer', 'patient and community-minded', 'Sustain organic food supplies and soil health', '#bef264', 14, 'Commerce', "Remy's Pod", '["Civic ID", "Hydroponic Seedpod", "pH Tester"]'],
  ['Sana', 'Teacher', 'empathetic and thoughtful', 'Educate citizens and resolve community disputes', '#fdba74', 15, 'Health & Safety', "Sana's Pod", '["Civic ID", "Archive Tablet", "Judicial Seal"]'],
  ['Ezra', 'Planner', 'strategic and ambitious', 'Foster civic democracy, balanced budgets and order', '#a5b4fc', 20, 'Administration', "Ezra's Pod", '["Civic ID", "Mayoral Key", "City Charter"]'],

  // 11-15: Living in North Heights Apartments (Multi-Unit Complex A)
  ['Vance', 'Detective', 'perceptive and vigilant', 'Investigate civic infractions and maintain public order', '#38bdf8', 17, 'Police', 'North Heights Apartments', '["Police Badge", "Stun Baton", "Evidence Datapad"]'],
  ['Lyra', 'Botanist', 'gentle and observant', 'Cultivate hydroponic crops and ensure soil fertility', '#a3e635', 15, 'Commerce', 'North Heights Apartments', '["Agro Scanner", "Sprout Canister", "Ration Pass"]'],
  ['Orion', 'Grid Engineer', 'methodical and steady', 'Maintain fusion energy output and power grid stability', '#f59e0b', 18, 'Public Works', 'North Heights Apartments', '["Multimeter", "Insulated Gloves", "Grid Override Key"]'],
  ['Nadia', 'Doctor', 'compassionate and decisive', 'Treat injured citizens and safeguard municipal health', '#ec4899', 19, 'Health & Safety', 'North Heights Apartments', '["Medkit", "Bio-Monitor", "Sanitizer Gel"]'],
  ['Felix', 'Banker', 'prudent and calculating', 'Audit city accounts and safeguard municipal credit reserves', '#eab308', 18, 'Treasury', 'North Heights Apartments', '["Encrypted Keycard", "Audit Ledger", "Credit Safe Pass"]'],

  // 16-20: Living in South Terrace Apartments (Multi-Unit Complex B)
  ['Cora', 'Factory Supervisor', 'industrious and firm', 'Maximize assembly manufacturing and stockpiles', '#f97316', 16, 'Public Works', 'South Terrace Apartments', '["Safety Goggles", "Production Clipboard", "Component Crate"]'],
  ['Silas', 'Water Specialist', 'diligent and quiet', 'Ensure clean municipal water distribution and purity', '#06b6d4', 16, 'Public Works', 'South Terrace Apartments', '["Flow Valve Key", "Purity Reagent", "Filter Core"]'],
  ['Maya', 'Firefighter', 'brave and quick-thinking', 'Respond immediately to fires, hazards and civic emergencies', '#ef4444', 17, 'Health & Safety', 'South Terrace Apartments', '["Emergency Axe", "Respirator Mask", "Fire Retardant Foam"]'],
  ['Leo', 'Grocer', 'friendly and organized', 'Keep grocery store shelves stocked with fresh meals and supplies', '#84cc16', 15, 'Commerce', 'South Terrace Apartments', '["Barcode Scanner", "Refrigeration Key", "Inventory Ledger"]'],
  ['Tara', 'Journalist', 'inquisitive and bold', 'Publish truthful civic bulletins and investigate city crises', '#8b5cf6', 14, 'Administration', 'South Terrace Apartments', '["Press Pass", "Audio Recorder", "Broadcast Slate"]'],
] as const;

const places = ['Market', 'Workshop', 'Garden', 'Library', 'Cafe', 'Homes', 'Bank', 'Hospital', 'Grocery', 'Police HQ'];

function defaultAgents(): Omit<Agent, 'dbId'>[] {
  return seeds.map((s, i) => {
    const loc = s[7] || places[i % places.length];
    const coords = LOCATION_COORDINATES[loc] || { x: 50, y: 50 };
    let inventoryItems: string[] = [];
    try {
      inventoryItems = JSON.parse(s[8]);
    } catch {
      inventoryItems = ['Civic ID', 'Ration Pass'];
    }

    return {
      id: `agent-${i + 1}`,
      name: s[0],
      role: s[1],
      personality: s[2],
      goal: s[3],
      credits: 100,
      energy: 75,
      hunger: 20,
      health: 100,
      happiness: 65,
      alive: true,
      location: loc,
      homeLocation: s[7],
      inventory: inventoryItems,
      memory: ['Arrived in Nexus City with 100 credits.'],
      lastAction: 'Settled into the city',
      color: s[4],
      salary: s[5] as number,
      department: s[6] as string,
      isMayor: s[0] === 'Ezra',
      isOfficer: s[0] === 'Theo' || s[0] === 'Vance',
      isJudge: s[0] === 'Sana',
      detainedHours: 0,
      x: coords.x,
      y: coords.y,
    };
  });
}

let state: SocietyState | null = null;
let initPromise: Promise<SocietyState> | null = null;
let currentSpeed = 1;

export function setSpeed(s: number) {
  const applied = simulationWorker.setSpeed(s);
  currentSpeed = applied;
  if (state) {
    state.speed = applied;
    if (state.sessionId && state.sessionId !== 'fallback-session') {
      prisma.simulationSession.update({
        where: { id: state.sessionId },
        data: { speed: applied },
      }).catch(console.error);
    }
  }
  return applied;
}

export function getSpeed() {
  return simulationWorker.getSpeed();
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Creates a brand new simulation session with fresh agents in SQLite.
 */
export async function createSession(title?: string): Promise<SocietyState> {
  const sessionName = title?.trim() || `Nexus Society (Run ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})`;
  
  const created = await prisma.simulationSession.create({
    data: {
      title: sessionName,
      status: 'idle',
      hour: 0,
      day: 1,
      totalDays: 1,
      year: 1,
      season: 'Spring',
      phase: 'day',
      speed: currentSpeed,
      rounds: 0,
      foodSupplyActive: true,
      waterSupplyActive: true,
      powerGridActive: true,
      factorySupplyActive: true,
      policePatrolBudget: 100,
      crimeRisk: 0.05,
      pollutionLevel: 10,
      activeCrises: '[]',
      events: {
        create: {
          time: '00:00',
          kind: 'system',
          text: 'Nexus City is ready. Twenty citizens have arrived across residential pods and apartment residences.',
          round: 0,
        },
      },
    },
    include: {
      events: true,
    },
  });

  const agentTemplates = defaultAgents();
  const createdAgents: Agent[] = [];

  for (const t of agentTemplates) {
    const dbAgent = await prisma.agent.create({
      data: {
        sessionId: created.id,
        agentKey: t.id,
        name: t.name,
        role: t.role,
        department: t.department,
        salary: t.salary,
        isMayor: t.isMayor ?? false,
        isOfficer: t.isOfficer ?? false,
        isJudge: t.isJudge ?? false,
        detainedHours: t.detainedHours ?? 0,
        personality: t.personality,
        goal: t.goal,
        credits: t.credits,
        energy: t.energy,
        hunger: t.hunger,
        health: t.health,
        happiness: t.happiness,
        alive: t.alive,
        location: t.location,
        homeLocation: t.homeLocation || 'Homes',
        inventory: JSON.stringify(t.inventory || []),
        color: t.color,
        x: t.x,
        y: t.y,
        lastAction: t.lastAction,
        memories: {
          create: {
            content: t.memory[0],
            round: 0,
            hour: 0,
          },
        },
      },
      include: {
        memories: true,
      },
    });

    createdAgents.push({
      ...t,
      dbId: dbAgent.id,
      memory: dbAgent.memories.map((m) => m.content),
    });
  }

  state = {
    sessionId: created.id,
    sessionTitle: created.title,
    status: 'idle',
    hour: created.hour,
    day: created.day,
    totalDays: created.totalDays,
    year: created.year,
    season: created.season,
    phase: created.phase,
    rounds: created.rounds,
    speed: currentSpeed,
    treasury: created.treasury ?? 1000,
    incomeTaxRate: created.incomeTaxRate ?? 0.10,
    salesTaxRate: created.salesTaxRate ?? 0.05,
    foodPrice: created.foodPrice ?? 8,
    mayorName: created.mayorName || 'Ezra',
    foodSupplyActive: true,
    waterSupplyActive: true,
    powerGridActive: true,
    factorySupplyActive: true,
    policePatrolBudget: 100,
    crimeRisk: 0.05,
    pollutionLevel: 10,
    activeCrises: [],
    decisionLogs: [],
    agents: createdAgents,
    events: created.events.map((e) => ({
      id: e.id,
      time: e.time,
      kind: e.kind,
      text: e.text,
      agent: e.agentName || undefined,
      round: e.round,
    })),
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };

  return structuredClone(state);
}

/**
 * Loads a session from the SQLite database by ID.
 * Automatically migrates/seeds missing citizens up to 20 if needed.
 */
export async function loadSession(sessionId: string): Promise<SocietyState> {
  const session = await prisma.simulationSession.findUnique({
    where: { id: sessionId },
    include: {
      agents: {
        include: {
          memories: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      },
      events: {
        orderBy: { id: 'desc' },
        take: 100,
      },
      decisionLogs: {
        orderBy: { createdAt: 'desc' },
        take: 40,
      },
    },
  });

  if (!session) {
    throw new Error(`Simulation session "${sessionId}" not found.`);
  }

  let agents: Agent[] = session.agents.map((a) => {
    let inv: string[] = ['Civic ID', 'Ration Pass'];
    try {
      inv = JSON.parse(a.inventory || '[]');
    } catch {}
    return {
      id: a.agentKey,
      dbId: a.id,
      name: a.name,
      role: a.role,
      department: a.department || undefined,
      salary: a.salary ?? 15,
      isMayor: a.isMayor ?? false,
      isOfficer: a.isOfficer ?? false,
      isJudge: a.isJudge ?? false,
      detainedHours: a.detainedHours ?? 0,
      personality: a.personality,
      goal: a.goal,
      credits: a.credits,
      energy: a.energy,
      hunger: a.hunger,
      health: a.health ?? 100,
      happiness: a.happiness,
      alive: a.alive,
      location: a.location,
      homeLocation: a.homeLocation || 'Homes',
      inventory: inv,
      memory: a.memories.map((m) => m.content).reverse(),
      lastAction: a.lastAction,
      color: a.color,
      x: a.x,
      y: a.y,
    };
  });

  // Seamless auto-migration: if existing session has < 20 agents, populate the rest
  if (agents.length < 20) {
    const existingKeys = new Set(agents.map((a) => a.id));
    const templates = defaultAgents();
    for (const t of templates) {
      if (!existingKeys.has(t.id)) {
        const createdAgent = await prisma.agent.create({
          data: {
            sessionId: session.id,
            agentKey: t.id,
            name: t.name,
            role: t.role,
            department: t.department,
            salary: t.salary,
            isMayor: t.isMayor ?? false,
            isOfficer: t.isOfficer ?? false,
            isJudge: t.isJudge ?? false,
            detainedHours: t.detainedHours ?? 0,
            personality: t.personality,
            goal: t.goal,
            credits: t.credits,
            energy: t.energy,
            hunger: t.hunger,
            health: t.health,
            happiness: t.happiness,
            alive: t.alive,
            location: t.location,
            homeLocation: t.homeLocation || 'Homes',
            inventory: JSON.stringify(t.inventory || []),
            color: t.color,
            x: t.x,
            y: t.y,
            lastAction: t.lastAction,
            memories: {
              create: {
                content: t.memory[0],
                round: session.rounds,
                hour: session.hour,
              },
            },
          },
          include: { memories: true },
        });

        agents.push({
          ...t,
          dbId: createdAgent.id,
          memory: createdAgent.memories.map((m) => m.content),
        });
      }
    }
  }

  const yr = session.year ?? 1;
  const dy = session.day ?? 1;
  const totDays = session.totalDays ?? ((yr - 1) * 365 + dy);
  const ssn = session.season || calculateSeason(dy);
  const phs = session.phase || calculatePhase(session.hour);

  let parsedCrises: string[] = [];
  try {
    parsedCrises = JSON.parse(session.activeCrises || '[]');
  } catch {}

  const decisionLogs: DecisionRecord[] = (session.decisionLogs || []).map((d) => {
    let opts: string[] = [];
    try {
      opts = JSON.parse(d.optionsConsidered || '[]');
    } catch {
      opts = [d.optionsConsidered];
    }
    return {
      id: d.id,
      agentId: d.agentId,
      agentName: d.agentName,
      problemDetected: d.problemDetected,
      relevantInfo: d.relevantInfo,
      optionsConsidered: opts,
      chosenAction: d.chosenAction,
      decisionReason: d.decisionReason,
      expectedOutcome: d.expectedOutcome,
      actualResult: d.actualResult,
      round: d.round,
      hour: d.hour,
      createdAt: d.createdAt.toISOString(),
    };
  });

  state = {
    sessionId: session.id,
    sessionTitle: session.title,
    status: (session.status as SocietyState['status']) || 'idle',
    hour: session.hour,
    day: dy,
    totalDays: totDays,
    year: yr,
    season: ssn,
    phase: phs,
    rounds: session.rounds,
    speed: session.speed ?? currentSpeed,
    treasury: session.treasury ?? 1000,
    incomeTaxRate: session.incomeTaxRate ?? 0.10,
    salesTaxRate: session.salesTaxRate ?? 0.05,
    foodPrice: session.foodPrice ?? 8,
    mayorName: session.mayorName || 'Ezra',
    activeEmergency: session.activeEmergency || undefined,

    // God Mode & Crisis Controls
    foodSupplyActive: session.foodSupplyActive ?? true,
    waterSupplyActive: session.waterSupplyActive ?? true,
    powerGridActive: session.powerGridActive ?? true,
    factorySupplyActive: session.factorySupplyActive ?? true,
    policePatrolBudget: session.policePatrolBudget ?? 100,
    crimeRisk: session.crimeRisk ?? 0.05,
    pollutionLevel: session.pollutionLevel ?? 10,
    activeCrises: parsedCrises,
    decisionLogs,

    stoppedAt: session.stoppedAt?.toISOString(),
    lastProcessedAt: session.lastProcessedAt?.toISOString(),
    error: session.error || undefined,
    agents,
    events: session.events.map((e) => ({
      id: e.id,
      time: e.time,
      kind: e.kind,
      text: e.text,
      agent: e.agentName || undefined,
      round: e.round,
    })),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };

  return structuredClone(state);
}

/**
 * Initializes or restores the latest session from the SQLite database.
 */
export async function ensureInitialized(): Promise<SocietyState> {
  if (state) return state;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const latest = await prisma.simulationSession.findFirst({
          orderBy: { updatedAt: 'desc' },
          select: { id: true },
        });

        if (latest) {
          return await loadSession(latest.id);
        } else {
          return await createSession('Primary Society');
        }
      } catch (err) {
        console.error('Database initialization error in society.ts:', err);
        const templates = defaultAgents();
        state = {
          sessionId: 'fallback-session',
          sessionTitle: 'Offline Mode Session',
          status: 'idle',
          hour: 0,
          day: 1,
          totalDays: 1,
          year: 1,
          season: 'Spring',
          phase: 'day',
          rounds: 0,
          speed: currentSpeed,
          agents: templates.map((t) => ({ ...t })),
          events: [
            {
              id: 1,
              time: '00:00',
              kind: 'system',
              text: 'Nexus City initialized in offline fallback mode.',
            },
          ],
        };
        return state;
      } finally {
        initPromise = null;
      }
    })();
  }

  return await initPromise;
}

export async function getState(): Promise<SocietyState> {
  const s = await ensureInitialized();
  s.speed = simulationWorker.getSpeed();
  const workerStatus = simulationWorker.getStatus();
  if (workerStatus !== 'idle') {
    s.status = workerStatus;
  }
  return structuredClone(s);
}

/**
 * Resets the active session back to hour 0 with initial agent stats in database.
 */
export async function resetActiveSession(): Promise<SocietyState> {
  const current = await ensureInitialized();
  const sessionId = current.sessionId;

  if (sessionId === 'fallback-session') {
    return await createSession();
  }

  // Atomically reset agents and clear events in the active session
  await prisma.$transaction(async (tx) => {
    await tx.agentAction.deleteMany({ where: { sessionId } });
    await tx.simulationEvent.deleteMany({ where: { sessionId } });

    const templates = defaultAgents();

    for (const t of templates) {
      const existingAgent = await tx.agent.findFirst({
        where: { sessionId, agentKey: t.id },
      });

      if (existingAgent) {
        await tx.agentMemory.deleteMany({ where: { agentId: existingAgent.id } });
        await tx.agent.update({
          where: { id: existingAgent.id },
          data: {
            name: t.name,
            role: t.role,
            department: t.department,
            personality: t.personality,
            goal: t.goal,
            credits: 100,
            energy: 75,
            hunger: 20,
            health: 100,
            happiness: 65,
            alive: true,
            location: t.location,
            homeLocation: t.homeLocation || 'Homes',
            inventory: JSON.stringify(t.inventory || []),
            color: t.color,
            x: t.x,
            y: t.y,
            lastAction: 'Settled into the city',
            salary: t.salary,
            isMayor: t.isMayor ?? false,
            isOfficer: t.isOfficer ?? false,
            isJudge: t.isJudge ?? false,
            detainedHours: 0,
            memories: {
              create: {
                content: 'Arrived in Nexus City with 100 credits.',
                round: 0,
                hour: 0,
              },
            },
          },
        });
      } else {
        await tx.agent.create({
          data: {
            sessionId,
            agentKey: t.id,
            name: t.name,
            role: t.role,
            department: t.department,
            salary: t.salary,
            isMayor: t.isMayor ?? false,
            isOfficer: t.isOfficer ?? false,
            isJudge: t.isJudge ?? false,
            detainedHours: 0,
            personality: t.personality,
            goal: t.goal,
            credits: 100,
            energy: 75,
            hunger: 20,
            health: 100,
            happiness: 65,
            alive: true,
            location: t.location,
            homeLocation: t.homeLocation || 'Homes',
            inventory: JSON.stringify(t.inventory || []),
            color: t.color,
            x: t.x,
            y: t.y,
            lastAction: 'Settled into the city',
            memories: {
              create: {
                content: 'Arrived in Nexus City with 100 credits.',
                round: 0,
                hour: 0,
              },
            },
          },
        });
      }
    }

    // Reset session metrics and God Mode state
    await tx.simulationSession.update({
      where: { id: sessionId },
      data: {
        status: 'idle',
        hour: 0,
        day: 1,
        totalDays: 1,
        year: 1,
        season: 'Spring',
        phase: 'day',
        rounds: 0,
        foodSupplyActive: true,
        waterSupplyActive: true,
        powerGridActive: true,
        factorySupplyActive: true,
        policePatrolBudget: 100,
        crimeRisk: 0.05,
        pollutionLevel: 10,
        activeCrises: '[]',
        activeEmergency: null,
        stoppedAt: null,
        error: null,
      },
    });

    // Add initial event
    await tx.simulationEvent.create({
      data: {
        sessionId,
        time: '00:00',
        kind: 'system',
        text: 'Simulation reset. Twenty citizens have arrived across residential pods and apartments with 100 credits each.',
        round: 0,
      },
    });
  });

  return await loadSession(sessionId);
}

/**
 * Updates City God Mode controls (utilities, police budget, taxes, prices).
 */
export async function updateGodMode(updates: {
  foodSupplyActive?: boolean;
  waterSupplyActive?: boolean;
  powerGridActive?: boolean;
  factorySupplyActive?: boolean;
  policePatrolBudget?: number;
  incomeTaxRate?: number;
  salesTaxRate?: number;
  foodPrice?: number;
  crimeRisk?: number;
  pollutionLevel?: number;
}): Promise<SocietyState> {
  const current = await ensureInitialized();
  if (current.sessionId !== 'fallback-session') {
    await prisma.simulationSession.update({
      where: { id: current.sessionId },
      data: updates,
    }).catch(console.error);

    await prisma.simulationEvent.create({
      data: {
        sessionId: current.sessionId,
        time: `${String(current.hour).padStart(2, '0')}:00`,
        kind: 'system',
        text: `OVERSEER OVERRIDE: God Mode parameters updated by Overseer (${JSON.stringify(updates)}).`,
        round: current.rounds,
      },
    }).catch(() => null);
  }

  Object.assign(current, updates);
  if (state) Object.assign(state, updates);
  return structuredClone(current);
}

/**
 * Triggers a crisis on-demand in God Mode (food shortage, blackout, crime wave, etc.).
 */
export async function triggerCrisisState(crisisType: string): Promise<SocietyState> {
  const current = await ensureInitialized();
  const crises = new Set<string>(current.activeCrises || []);
  crises.add(crisisType);
  const crisesArr = Array.from(crises);

  const updates: any = { activeCrises: JSON.stringify(crisesArr), activeEmergency: crisisType };
  if (crisisType === 'food_shortage') {
    updates.foodSupplyActive = false;
    updates.foodPrice = 24;
  } else if (crisisType === 'power_blackout' || crisisType === 'power_failure' || crisisType === 'blackout') {
    updates.powerGridActive = false;
  } else if (crisisType === 'water_crisis') {
    updates.waterSupplyActive = false;
  } else if (crisisType === 'factory_shutdown') {
    updates.factorySupplyActive = false;
  } else if (crisisType === 'crime_wave') {
    updates.policePatrolBudget = 20;
    updates.crimeRisk = 85;
  } else if (crisisType === 'recession') {
    updates.incomeTaxRate = 25;
    updates.salesTaxRate = 15;
  } else if (crisisType === 'pollution_spike' || crisisType === 'pollution') {
    updates.pollutionLevel = 85;
  }

  if (current.sessionId !== 'fallback-session') {
    await prisma.simulationSession.update({
      where: { id: current.sessionId },
      data: updates,
    }).catch(console.error);

    await prisma.simulationEvent.create({
      data: {
        sessionId: current.sessionId,
        time: `${String(current.hour).padStart(2, '0')}:00`,
        kind: 'system',
        text: `CRISIS ALERT TRIGGERED: ${crisisType.replace(/_/g, ' ').toUpperCase()} initiated in Nexus City!`,
        round: current.rounds,
      },
    }).catch(() => null);
  }

  Object.assign(current, updates);
  current.activeCrises = crisesArr;
  current.activeEmergency = crisisType;
  if (state) {
    Object.assign(state, updates);
    state.activeCrises = crisesArr;
    state.activeEmergency = crisisType;
  }

  return structuredClone(current);
}

/**
 * Restores all normal municipal conditions, resets crises, and restores full utility grids.
 */
export async function restoreNormalState(): Promise<SocietyState> {
  const current = await ensureInitialized();
  const updates = {
    foodSupplyActive: true,
    waterSupplyActive: true,
    powerGridActive: true,
    factorySupplyActive: true,
    policePatrolBudget: 100,
    crimeRisk: 0.05,
    pollutionLevel: 10,
    activeCrises: '[]',
    activeEmergency: null,
    foodPrice: 8,
    incomeTaxRate: 0.10,
    salesTaxRate: 0.05,
  };

  if (current.sessionId !== 'fallback-session') {
    await prisma.simulationSession.update({
      where: { id: current.sessionId },
      data: updates,
    }).catch(console.error);

    // Clear building outages
    await prisma.buildingState.updateMany({
      where: { sessionId: current.sessionId },
      data: { powerStatus: true, waterStatus: true, condition: 100 },
    }).catch(() => null);

    await prisma.simulationEvent.create({
      data: {
        sessionId: current.sessionId,
        time: `${String(current.hour).padStart(2, '0')}:00`,
        kind: 'system',
        text: 'OVERSEER COMMAND: All normal civic conditions, utilities and supply lines have been fully restored.',
        round: current.rounds,
      },
    }).catch(() => null);
  }

  current.activeCrises = [];
  current.activeEmergency = undefined;
  current.foodSupplyActive = true;
  current.waterSupplyActive = true;
  current.powerGridActive = true;
  current.factorySupplyActive = true;
  current.policePatrolBudget = 100;
  current.crimeRisk = 0.05;
  current.pollutionLevel = 10;
  current.foodPrice = 8;
  current.incomeTaxRate = 0.10;
  current.salesTaxRate = 0.05;

  if (state) {
    state.activeCrises = [];
    state.activeEmergency = undefined;
    Object.assign(state, current);
  }

  return structuredClone(current);
}

/**
 * Starts the simulation worker loop.
 */
export async function startSimulation(sessionId?: string): Promise<SocietyState> {
  return await simulationWorker.start(sessionId);
}

/**
 * Pauses the active simulation loop.
 */
export async function pauseSimulation(): Promise<SocietyState> {
  return await simulationWorker.pause();
}

/**
 * Resumes the simulation from paused state.
 */
export async function resumeSimulation(): Promise<SocietyState> {
  return await simulationWorker.resume();
}

/**
 * Explicitly stops the simulation.
 */
export async function stopSimulation(): Promise<SocietyState> {
  return await simulationWorker.stop();
}

/**
 * Lists all simulation sessions stored in the SQLite database.
 */
export async function listSessions(): Promise<SessionSummary[]> {
  const sessions = await prisma.simulationSession.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: {
          agents: true,
          events: true,
        },
      },
      agents: {
        select: {
          alive: true,
        },
      },
    },
  });

  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status,
    hour: s.hour,
    day: s.day,
    totalDays: s.totalDays ?? ((s.year - 1) * 365 + s.day),
    year: s.year ?? 1,
    season: s.season ?? 'Spring',
    phase: s.phase ?? 'day',
    speed: s.speed ?? 1,
    rounds: s.rounds,
    agentCount: s._count.agents,
    aliveCount: s.agents.filter((a) => a.alive).length,
    eventCount: s._count.events,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));
}

/**
 * Returns full session details including all agents, recent events, and actions.
 */
export async function getSessionDetails(sessionId: string) {
  return await prisma.simulationSession.findUnique({
    where: { id: sessionId },
    include: {
      agents: {
        include: {
          memories: { orderBy: { createdAt: 'desc' }, take: 10 },
          actions: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      },
      events: {
        orderBy: { id: 'desc' },
        take: 100,
      },
      actions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          agent: { select: { name: true, role: true } },
        },
      },
    },
  });
}

/**
 * Deletes a session from the SQLite database.
 */
export async function deleteSession(sessionId: string) {
  await prisma.simulationSession.delete({
    where: { id: sessionId },
  });

  if (state?.sessionId === sessionId) {
    state = null;
    return await ensureInitialized();
  }

  return null;
}

async function chooseAction(
  ai: GoogleGenAI,
  model: string,
  currentState: SocietyState,
  agent: Agent
): Promise<{ action: Action; target: string | null; reason: string }> {
  const others = currentState.agents
    .filter((a) => a.alive && a.id !== agent.id)
    .map((a) => `${a.name} (${a.role}, ${a.credits} credits, hunger ${a.hunger})`)
    .join('; ');

  const prompt = `You control one fictional agent in a toy city simulation. Return ONLY valid JSON with keys action, target, reason. action must be one of work, rest, eat, socialize, trade, help. target must be another agent's exact name for trade/socialize/help, or null. reason must be <= 18 words.\nRules: no violence, theft, arson, threats, or real-world actions. The simulator validates all outcomes.\nTime: ${currentState.hour}:00 on day 1.\nYour agent: ${JSON.stringify(
    {
      name: agent.name,
      role: agent.role,
      personality: agent.personality,
      goal: agent.goal,
      credits: agent.credits,
      energy: agent.energy,
      hunger: agent.hunger,
      happiness: agent.happiness,
      memory: agent.memory.slice(-4),
    }
  )}\nOther agents: ${others}\nActions: work earns 12 credits and costs 12 energy; rest restores 22 energy; eat costs 8 credits and reduces hunger by 35; socialize improves happiness slightly; trade transfers 5 credits from you to a named agent if you can afford it; help gives a named agent 3 credits if you can afford it. Pick one action that suits your goals and current needs.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.8, maxOutputTokens: 160 },
    });
    const parsed = JSON.parse(response.text || '{}');
    const allowed: Action[] = ['work', 'rest', 'eat', 'socialize', 'trade', 'help'];
    return {
      action: allowed.includes(parsed.action) ? parsed.action : 'work',
      target: typeof parsed.target === 'string' ? parsed.target : null,
      reason:
        typeof parsed.reason === 'string'
          ? parsed.reason.slice(0, 180)
          : 'Chose an action for the day.',
    };
  } catch {
    const action: Action =
      agent.hunger > 75 && agent.credits >= 8
        ? 'eat'
        : agent.energy < 35
        ? 'rest'
        : 'work';
    return {
      action,
      target: null,
      reason: 'Fallback heuristic used to maintain wellbeing.',
    };
  }
}

/**
 * Applies an action, updates agent location and coordinates, persists to SQLite atomically,
 * and updates in-memory state.
 */
async function applyActionAndPersist(
  currentState: SocietyState,
  agent: Agent,
  decision: { action: Action; target: string | null; reason: string }
) {
  const { action, target, reason } = decision;
  let detail = '';
  let creditsDelta = 0;
  let targetAgent: Agent | undefined;
  let otherMemoryText: string | null = null;

  if (action === 'work') {
    agent.credits += 12;
    agent.energy = clamp(agent.energy - 12);
    creditsDelta = 12;
    detail = `worked as a ${agent.role.toLowerCase()} and earned 12 credits`;
  } else if (action === 'rest') {
    agent.energy = clamp(agent.energy + 22);
    detail = 'rested and recovered energy';
  } else if (action === 'eat') {
    if (agent.credits >= 8) {
      agent.credits -= 8;
      creditsDelta = -8;
      agent.hunger = clamp(agent.hunger - 35);
      agent.happiness = clamp(agent.happiness + 3);
      detail = 'bought a meal for 8 credits';
    } else {
      agent.hunger = clamp(agent.hunger + 8);
      detail = 'could not afford a meal';
    }
  } else if (action === 'socialize') {
    agent.happiness = clamp(agent.happiness + 8);
    targetAgent = currentState.agents.find(
      (a) => a.alive && a.name.toLowerCase() === target?.toLowerCase() && a.id !== agent.id
    );
    if (targetAgent) {
      targetAgent.happiness = clamp(targetAgent.happiness + 3);
      otherMemoryText = `${agent.name} chatted with me at hour ${currentState.hour}.`;
      targetAgent.memory.push(otherMemoryText);
      detail = `spent time talking with ${targetAgent.name}`;
    } else {
      detail = 'spent time around the city and felt more connected';
    }
  } else if (action === 'trade' || action === 'help') {
    targetAgent = currentState.agents.find(
      (a) => a.alive && a.name.toLowerCase() === target?.toLowerCase() && a.id !== agent.id
    );
    const amount = action === 'trade' ? 5 : 3;
    if (targetAgent && agent.credits >= amount) {
      agent.credits -= amount;
      creditsDelta = -amount;
      targetAgent.credits += amount;
      otherMemoryText = `${agent.name} ${action === 'trade' ? 'traded with' : 'helped'} me at hour ${currentState.hour}.`;
      targetAgent.memory.push(otherMemoryText);
      detail = `${action === 'trade' ? 'transferred' : 'gave'} ${amount} credits to ${targetAgent.name}`;
    } else {
      agent.happiness = clamp(agent.happiness - 1);
      detail = 'could not complete the transfer, so no credits moved';
    }
  }

  agent.hunger = clamp(agent.hunger + 8);
  agent.energy = clamp(agent.energy - 3);
  agent.happiness = clamp(agent.happiness - (agent.hunger > 80 ? 3 : 0));
  agent.lastAction = detail;

  // Assign designated district & coordinates
  const newLocation =
    action === 'work'
      ? 'Workshop'
      : action === 'eat'
      ? 'Cafe'
      : action === 'socialize'
      ? 'City Plaza'
      : action === 'rest'
      ? 'Homes'
      : action === 'trade'
      ? 'Central Market'
      : 'City Plaza';

  agent.location = newLocation;
  const coords = LOCATION_COORDINATES[newLocation] || { x: 50, y: 50 };
  agent.x = coords.x;
  agent.y = coords.y;

  const memoryContent = `Hour ${currentState.hour}: ${detail}.`;
  agent.memory.push(memoryContent);
  agent.memory = agent.memory.slice(-12);

  // Persist atomically to SQLite
  if (currentState.sessionId !== 'fallback-session' && agent.dbId) {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Update actor agent
        await tx.agent.update({
          where: { id: agent.dbId },
          data: {
            credits: agent.credits,
            energy: agent.energy,
            hunger: agent.hunger,
            happiness: agent.happiness,
            alive: agent.alive,
            location: agent.location,
            x: agent.x,
            y: agent.y,
            lastAction: detail,
          },
        });

        // 2. Update target agent if modified
        if (targetAgent && targetAgent.dbId) {
          await tx.agent.update({
            where: { id: targetAgent.dbId },
            data: {
              credits: targetAgent.credits,
              happiness: targetAgent.happiness,
            },
          });

          if (otherMemoryText) {
            await tx.agentMemory.create({
              data: {
                agentId: targetAgent.dbId,
                content: otherMemoryText,
                round: currentState.rounds,
                hour: currentState.hour,
              },
            });
          }
        }

        // 3. Persist Action record
        await tx.agentAction.create({
          data: {
            sessionId: currentState.sessionId,
            agentId: agent.dbId!,
            action,
            targetName: targetAgent?.name || null,
            targetId: targetAgent?.dbId || null,
            reason,
            details: detail,
            creditsDelta,
            round: currentState.rounds,
            hour: currentState.hour,
          },
        });

        // 4. Persist Actor Memory
        await tx.agentMemory.create({
          data: {
            agentId: agent.dbId!,
            content: memoryContent,
            round: currentState.rounds,
            hour: currentState.hour,
          },
        });

        // 5. Persist Simulation Event
        const newEvent = await tx.simulationEvent.create({
          data: {
            sessionId: currentState.sessionId,
            time: `${String(currentState.hour).padStart(2, '0')}:00`,
            kind: action,
            text: `${agent.name} ${detail}. Reason: ${reason}`,
            agentName: agent.name,
            round: currentState.rounds,
          },
        });

        currentState.events.unshift({
          id: newEvent.id,
          time: newEvent.time,
          kind: newEvent.kind,
          text: newEvent.text,
          agent: newEvent.agentName || undefined,
          round: newEvent.round,
        });
      });
    } catch (e) {
      console.error('Error persisting agent action to SQLite:', e);
    }
  } else {
    currentState.events.unshift({
      id: Date.now() + Math.random(),
      time: `${String(currentState.hour).padStart(2, '0')}:00`,
      kind: action,
      text: `${agent.name} ${detail}. Reason: ${reason}`,
      agent: agent.name,
      round: currentState.rounds,
    });
  }

  currentState.events = currentState.events.slice(0, 100);
}

/**
 * Advances the simulation by exactly one turn (1 simulated hour).
 */
export async function stepSimulation(ai?: GoogleGenAI, model?: string): Promise<SocietyState> {
  return await simulationWorker.step();
}

/**
 * Runs the simulation continuously in the background worker.
 * Never auto-stops after 10 rounds or 365 days; continues indefinitely until stopped.
 */
export async function runSimulation(ai?: GoogleGenAI, model?: string): Promise<SocietyState> {
  return await simulationWorker.start();
}

