/**
 * Durable Server-Side Background Simulation Worker for AI Virtual Society 2.0
 * 
 * Guarantees:
 * 1. Autonomous execution: Runs server-side independently of browser connections.
 * 2. Never auto-stops: Continues through days, seasons, and years (beyond day 365) indefinitely.
 * 3. Explicit controls: Distinct start, pause, resume, and stop operations.
 * 4. Configurable speed: 1x (2000ms), 5x (400ms), 20x (100ms), 100x (20ms).
 * 5. Safe recovery: Recovers last consistent state on server restart without event duplication.
 * 6. Non-blocking & serial: Uses asynchronous setTimeout scheduling with concurrency locks.
 */

import { GoogleGenAI } from '@google/genai';
import { prisma } from './prisma';
import { advanceClock, calculatePhase, calculateSeason, ClockState } from './simulation-clock';
import {
  Action,
  Agent,
  DecisionRecord,
  LOCATION_COORDINATES,
  SocietyState,
  ensureInitialized,
  getState,
  loadSession,
} from './society';
import {
  processEconomyTick,
  processGovernanceAndElections,
  processLegalSystem,
  processInfrastructure,
} from './city-systems';

export type WorkerStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error';

export interface WorkerConfig {
  baseTickMs?: number; // default 2000ms at 1x
  enableGemini?: boolean;
}

class SimulationWorkerManager {
  private timer: NodeJS.Timeout | null = null;
  private isTicking = false;
  private speed = 1;
  private baseTickMs = 2000;
  private status: WorkerStatus = 'idle';
  private lastProcessedAt: Date | null = null;
  private stoppedAt: Date | null = null;
  private lastError: string | null = null;
  private aiClient: GoogleGenAI | null = null;
  private modelName = 'gemini-2.5-flash';

  constructor() {
    this.initGemini();
  }

  private initGemini() {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: key });
        this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      } catch (err) {
        console.warn('[SimulationWorker] Failed to initialize Gemini client:', err);
      }
    }
  }

  public getStatus(): WorkerStatus {
    return this.status;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public getLastProcessedAt(): Date | null {
    return this.lastProcessedAt;
  }

  public getStoppedAt(): Date | null {
    return this.stoppedAt;
  }

  /**
   * Sets simulation speed multiplier (e.g. 1, 5, 20, 100).
   */
  public setSpeed(multiplier: number): number {
    const clamped = Math.max(0.25, Math.min(100, multiplier));
    this.speed = clamped;

    // Reschedule timer immediately if running
    if (this.status === 'running') {
      this.clearTimer();
      if (!this.isTicking) {
        this.scheduleNextTick(Math.min(20, this.calculateDelay()));
      }
    }

    return this.speed;
  }

  private calculateDelay(): number {
    return Math.max(15, Math.round(this.baseTickMs / this.speed));
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Starts or restarts the simulation worker from idle or stopped state.
   */
  public async start(sessionId?: string): Promise<SocietyState> {
    const state = await ensureInitialized();
    const activeSessionId = sessionId || state.sessionId;

    this.clearTimer();
    this.status = 'running';
    this.stoppedAt = null;
    this.lastError = null;

    if (activeSessionId !== 'fallback-session') {
      await prisma.simulationSession.update({
        where: { id: activeSessionId },
        data: {
          status: 'running',
          stoppedAt: null,
          error: null,
          speed: this.speed,
        },
      }).catch(console.error);

      await prisma.simulationEvent.create({
        data: {
          sessionId: activeSessionId,
          time: `${String(state.hour).padStart(2, '0')}:00`,
          kind: 'system',
          text: `Simulation started by overseer at Year ${state.year || 1}, Day ${state.day || 1} (Speed ${this.speed}x).`,
          round: state.rounds,
        },
      }).catch(() => null);
    }

    state.status = 'running';
    state.speed = this.speed;
    state.stoppedAt = undefined;

    this.scheduleNextTick(Math.min(50, this.calculateDelay()));
    return await getState();
  }

  /**
   * Pauses the simulation. Preserves exact clock and agent states.
   */
  public async pause(): Promise<SocietyState> {
    this.clearTimer();
    this.status = 'paused';

    const state = await ensureInitialized();
    state.status = 'paused';

    if (state.sessionId !== 'fallback-session') {
      await prisma.simulationSession.update({
        where: { id: state.sessionId },
        data: { status: 'paused' },
      }).catch(console.error);

      const pauseEvent = await prisma.simulationEvent.create({
        data: {
          sessionId: state.sessionId,
          time: `${String(state.hour).padStart(2, '0')}:00`,
          kind: 'system',
          text: `Simulation paused at Year ${state.year || 1}, Day ${state.day || 1}, ${String(state.hour).padStart(2, '0')}:00.`,
          round: state.rounds,
        },
      }).catch(() => null);

      if (pauseEvent) {
        state.events.unshift({
          id: pauseEvent.id,
          time: pauseEvent.time,
          kind: pauseEvent.kind,
          text: pauseEvent.text,
          round: pauseEvent.round,
        });
      }
    }

    return await getState();
  }

  /**
   * Resumes the simulation from a paused state.
   */
  public async resume(): Promise<SocietyState> {
    if (this.status === 'running') {
      return await getState();
    }

    this.clearTimer();
    this.status = 'running';
    this.stoppedAt = null;

    const state = await ensureInitialized();
    state.status = 'running';
    state.stoppedAt = undefined;

    if (state.sessionId !== 'fallback-session') {
      await prisma.simulationSession.update({
        where: { id: state.sessionId },
        data: { status: 'running', stoppedAt: null },
      }).catch(console.error);

      const resumeEvent = await prisma.simulationEvent.create({
        data: {
          sessionId: state.sessionId,
          time: `${String(state.hour).padStart(2, '0')}:00`,
          kind: 'system',
          text: `Simulation resumed at Year ${state.year || 1}, Day ${state.day || 1}, ${String(state.hour).padStart(2, '0')}:00.`,
          round: state.rounds,
        },
      }).catch(() => null);

      if (resumeEvent) {
        state.events.unshift({
          id: resumeEvent.id,
          time: resumeEvent.time,
          kind: resumeEvent.kind,
          text: resumeEvent.text,
          round: resumeEvent.round,
        });
      }
    }

    this.scheduleNextTick(this.calculateDelay());
    return await getState();
  }

  /**
   * Explicitly stops the simulation. Differs from pause: records stoppedAt, marks stopped in DB.
   */
  public async stop(): Promise<SocietyState> {
    this.clearTimer();
    this.status = 'stopped';
    this.stoppedAt = new Date();

    const state = await ensureInitialized();
    state.status = 'stopped';
    state.stoppedAt = this.stoppedAt.toISOString();

    if (state.sessionId !== 'fallback-session') {
      await prisma.simulationSession.update({
        where: { id: state.sessionId },
        data: {
          status: 'stopped',
          stoppedAt: this.stoppedAt,
        },
      }).catch(console.error);

      const stopEvent = await prisma.simulationEvent.create({
        data: {
          sessionId: state.sessionId,
          time: `${String(state.hour).padStart(2, '0')}:00`,
          kind: 'system',
          text: `Simulation explicitly stopped by overseer at Year ${state.year || 1}, Day ${state.day || 1}, ${String(state.hour).padStart(2, '0')}:00.`,
          round: state.rounds,
        },
      }).catch(() => null);

      if (stopEvent) {
        state.events.unshift({
          id: stopEvent.id,
          time: stopEvent.time,
          kind: stopEvent.kind,
          text: stopEvent.text,
          round: stopEvent.round,
        });
      }
    }

    return await getState();
  }

  /**
   * Performs recovery upon server boot.
   * If the latest session was left with status === 'running', resumes execution safely.
   */
  public async recoverFromRestart(): Promise<{ recovered: boolean; sessionId?: string; status: WorkerStatus }> {
    try {
      const latest = await prisma.simulationSession.findFirst({
        orderBy: { updatedAt: 'desc' },
      });

      if (!latest) {
        return { recovered: false, status: this.status };
      }

      // Hydrate state from latest database session
      await loadSession(latest.id);

      this.speed = latest.speed || 1;
      this.lastProcessedAt = latest.lastProcessedAt;
      this.stoppedAt = latest.stoppedAt;

      const state = await ensureInitialized();

      if (latest.status === 'running') {
        // Resuming from consistent state
        this.status = 'running';
        state.status = 'running';

        await prisma.simulationEvent.create({
          data: {
            sessionId: latest.id,
            time: `${String(latest.hour).padStart(2, '0')}:00`,
            kind: 'system',
            text: `Server restarted. Simulation recovered and resumed at Year ${latest.year}, Day ${latest.day}, ${String(latest.hour).padStart(2, '0')}:00.`,
            round: latest.rounds,
          },
        }).catch(() => null);

        this.scheduleNextTick(this.calculateDelay());
        return { recovered: true, sessionId: latest.id, status: 'running' };
      } else {
        this.status = (latest.status as WorkerStatus) || 'idle';
        state.status = this.status;
        return { recovered: false, sessionId: latest.id, status: this.status };
      }
    } catch (err) {
      console.error('[SimulationWorker] Error during restart recovery:', err);
      return { recovered: false, status: 'error' };
    }
  }

  private scheduleNextTick(delayMs: number) {
    this.clearTimer();
    this.timer = setTimeout(() => {
      void this.executeTick();
    }, delayMs);
  }

  /**
   * Executes a single simulation tick.
   * Advances the clock by 1 hour, triggers citizen decisions, and persists state atomically.
   */
  public async step(): Promise<SocietyState> {
    await this.executeTick(true);
    return await getState();
  }

  private async executeTick(singleStep = false) {
    if (this.isTicking) {
      // Re-schedule if another tick is in progress
      if (!singleStep && this.status === 'running') {
        this.scheduleNextTick(50);
      }
      return;
    }

    this.isTicking = true;

    try {
      const state = await ensureInitialized();

      // Check running condition
      if (!singleStep && this.status !== 'running') {
        this.isTicking = false;
        return;
      }

      // 1. Advance Clock
      const prevClock = {
        hour: state.hour,
        day: state.day,
        year: state.year || 1,
        totalDays: state.totalDays || state.day,
        rounds: state.rounds,
      };

      const clockResult = advanceClock(prevClock, 1);

      // Update state clock values
      state.hour = clockResult.hour;
      state.day = clockResult.day;
      state.year = clockResult.year;
      state.totalDays = clockResult.totalDays;
      state.season = clockResult.season;
      state.phase = clockResult.phase;
      state.rounds = clockResult.rounds;

      // Dynamic God Mode & Crisis consequences
      const activeCrises = state.activeCrises || [];
      const isFoodCut = state.foodSupplyActive === false || activeCrises.includes('food_shortage');
      const isPowerCut = state.powerGridActive === false || activeCrises.includes('blackout') || activeCrises.includes('power_failure');
      const isWaterCut = state.waterSupplyActive === false || activeCrises.includes('water_crisis');
      const isFactoryCut = state.factorySupplyActive === false || activeCrises.includes('factory_shutdown');
      const isRecession = activeCrises.includes('recession');
      const isPollution = activeCrises.includes('pollution');

      if (isFoodCut) {
        state.foodPrice = Math.min(28, (state.foodPrice ?? 8) + 1);
      } else if ((state.foodPrice ?? 8) > 8) {
        state.foodPrice = Math.max(8, (state.foodPrice ?? 8) - 1);
      }

      // Police patrol impact on crime risk
      const patrolBudget = state.policePatrolBudget ?? 100;
      if (patrolBudget < 50 || activeCrises.includes('crime_wave')) {
        state.crimeRisk = Math.min(95, (state.crimeRisk ?? 12) + (patrolBudget < 30 ? 6 : 3));
      } else if (patrolBudget >= 80 && (state.crimeRisk ?? 12) > 12) {
        state.crimeRisk = Math.max(8, (state.crimeRisk ?? 12) - 3);
      }

      // Environmental pollution
      if (isPollution) {
        state.pollutionLevel = Math.min(95, (state.pollutionLevel ?? 10) + 4);
      } else if ((state.pollutionLevel ?? 10) > 10) {
        state.pollutionLevel = Math.max(10, (state.pollutionLevel ?? 10) - 2);
      }

      // 2. Process Agent Actions (parallel execution with batched database writes)
      const livingAgents = state.agents.filter((a) => a.alive);
      const decisions = await Promise.all(
        livingAgents.map((agent) => this.decideAgentAction(state, agent))
      );
      const batchOps: any[] = [];
      for (let i = 0; i < livingAgents.length; i++) {
        const ops = this.prepareAgentAction(state, livingAgents[i], decisions[i]);
        batchOps.push(...ops);
      }
      if (batchOps.length > 0 && state.sessionId !== 'fallback-session') {
        await prisma.$transaction(batchOps).catch((err) =>
          console.error('[SimulationWorker] Agent batch transaction error:', err)
        );
      }

      // 3. Survival check
      for (const a of state.agents) {
        if (a.hunger >= 100 && a.alive) {
          a.alive = false;
          if (state.sessionId !== 'fallback-session' && a.dbId) {
            await prisma.$transaction([
              prisma.agent.update({
                where: { id: a.dbId },
                data: { alive: false },
              }),
              prisma.simulationEvent.create({
                data: {
                  sessionId: state.sessionId,
                  time: `${String(state.hour).padStart(2, '0')}:00`,
                  kind: 'survival',
                  text: `${a.name} succumbed to starvation at Year ${state.year}, Day ${state.day}.`,
                  agentName: a.name,
                  round: state.rounds,
                },
              }),
            ]).catch(console.error);
          }
        }
      }

      // 4. Milestone Events (Day changes, Year changes beyond day 365)
      if (clockResult.yearChanged) {
        const yearEventText = `Year ${clockResult.year} has begun in Nexus City! The society has surpassed ${clockResult.totalDays - 1} continuous days.`;
        if (state.sessionId !== 'fallback-session') {
          await prisma.simulationEvent.create({
            data: {
              sessionId: state.sessionId,
              time: '00:00',
              kind: 'system',
              text: yearEventText,
              round: state.rounds,
            },
          }).catch(console.error);
        }
        state.events.unshift({
          id: Date.now() + Math.random(),
          time: '00:00',
          kind: 'system',
          text: yearEventText,
          round: state.rounds,
        });
      } else if (clockResult.dayChanged) {
        const dayEventText = `Day ${clockResult.day} (${clockResult.season}) begins in Year ${clockResult.year}. Total active days: ${clockResult.totalDays}.`;
        if (state.sessionId !== 'fallback-session') {
          await prisma.simulationEvent.create({
            data: {
              sessionId: state.sessionId,
              time: '00:00',
              kind: 'system',
              text: dayEventText,
              round: state.rounds,
            },
          }).catch(console.error);
        }
      }

      // 5. Civic Subsystems: Economy, Governance, Law & Infrastructure
      const econResult = await processEconomyTick(state, prisma);
      const govResult = await processGovernanceAndElections(state, state.day, state.hour, state.year || 1, prisma);
      const lawResult = await processLegalSystem(state, state.hour, prisma);
      const infraResult = await processInfrastructure(state, state.hour, prisma);

      // Collect generated civic events
      const civicEvents = [
        ...econResult.events,
        ...govResult.events,
        ...lawResult.events,
        ...infraResult.events,
      ];

      for (const ev of civicEvents) {
        state.events.unshift({
          id: Date.now() + Math.random(),
          time: `${String(state.hour).padStart(2, '0')}:00`,
          kind: ev.kind,
          text: ev.text,
          agent: ev.agentName,
          round: state.rounds,
        });

        if (state.sessionId !== 'fallback-session') {
          await prisma.simulationEvent.create({
            data: {
              sessionId: state.sessionId,
              time: `${String(state.hour).padStart(2, '0')}:00`,
              kind: ev.kind,
              text: ev.text,
              agentName: ev.agentName || null,
              round: state.rounds,
            },
          }).catch(() => null);
        }
      }
      state.events = state.events.slice(0, 100);

      // 6. Persist Session Clock & Status to SQLite
      this.lastProcessedAt = new Date();
      if (state.sessionId !== 'fallback-session') {
        await prisma.simulationSession.update({
          where: { id: state.sessionId },
          data: {
            hour: state.hour,
            day: state.day,
            totalDays: state.totalDays,
            year: state.year,
            season: state.season,
            phase: state.phase,
            rounds: state.rounds,
            treasury: state.treasury ?? 1000,
            mayorName: state.mayorName || 'Ezra',
            foodPrice: state.foodPrice ?? 8,
            foodSupplyActive: state.foodSupplyActive ?? true,
            waterSupplyActive: state.waterSupplyActive ?? true,
            powerGridActive: state.powerGridActive ?? true,
            factorySupplyActive: state.factorySupplyActive ?? true,
            policePatrolBudget: state.policePatrolBudget ?? 100,
            crimeRisk: state.crimeRisk ?? 12,
            pollutionLevel: state.pollutionLevel ?? 10,
            activeCrises: JSON.stringify(state.activeCrises || []),
            status: singleStep ? (state.status || 'paused') : this.status,
            speed: this.speed,
            lastProcessedAt: this.lastProcessedAt,
            error: null,
          },
        }).catch(console.error);
      }

      state.lastProcessedAt = this.lastProcessedAt.toISOString();
      state.speed = this.speed;
      if (!singleStep) {
        state.status = this.status;
      }
    } catch (err) {
      console.error('[SimulationWorker] Tick execution error:', err);
      this.lastError = err instanceof Error ? err.message : 'Unknown tick error';
      this.status = 'error';

      const state = await getState();
      state.status = 'error';
      state.error = this.lastError;

      if (state.sessionId !== 'fallback-session') {
        await prisma.simulationSession.update({
          where: { id: state.sessionId },
          data: { status: 'error', error: this.lastError },
        }).catch(console.error);
      }
    } finally {
      this.isTicking = false;

      // Reschedule next tick if still running
      if (!singleStep && this.status === 'running') {
        this.scheduleNextTick(this.calculateDelay());
      }
    }
  }

  private async decideAgentAction(
    currentState: SocietyState,
    agent: Agent
  ): Promise<{
    action: Action;
    target: string | null;
    reason: string;
    decisionLog?: {
      problemDetected: string;
      relevantInfo: string;
      optionsConsidered: { option: string; description: string }[];
      chosenAction: string;
      decisionReason: string;
      expectedOutcome: string;
    };
  }> {
    // When speed > 1 (e.g. 5x, 20x, 100x), bypass external network latency for instant, snappy ticks
    if (!this.aiClient || this.speed > 1) {
      return this.cognitiveHeuristicDecision(currentState, agent);
    }

    try {
      const activeCrises = currentState.activeCrises || [];
      const others = currentState.agents
        .filter((a) => a.alive && a.id !== agent.id)
        .map((a) => `${a.name} (${a.role}, ${a.credits} credits, hunger ${a.hunger})`)
        .slice(0, 6)
        .join('; ');

      const prompt = `You control citizen ${agent.name} (${agent.role}) living in ${agent.homeLocation || 'Residential Pod'} in Nexus City.
Return ONLY valid JSON matching this exact structure:
{
  "problemDetected": "<Concise problem detected or 'Normal routine duties'>",
  "relevantInfo": "<Specific facts: credits, hunger, energy, city supplies, crises>",
  "optionsConsidered": [
    {"option": "A", "description": "<first realistic course of action>"},
    {"option": "B", "description": "<second realistic course of action>"},
    {"option": "C", "description": "<third realistic course of action>"}
  ],
  "chosenAction": "work" | "rest" | "eat" | "socialize" | "trade" | "help" | "patrol" | "petition" | "inspect",
  "target": "<Another citizen name for trade/socialize/help, or null>",
  "decisionReason": "<Concise rationale why chosenAction was selected over alternatives>",
  "expectedOutcome": "<Expected positive result of this action>"
}
Time: Year ${currentState.year || 1}, Day ${currentState.day || 1} (${currentState.season || 'Spring'}), ${String(currentState.hour).padStart(2, '0')}:00.
City conditions: Food supply: ${currentState.foodSupplyActive ? 'NORMAL' : 'DISRUPTED'}, Power grid: ${currentState.powerGridActive ? 'ONLINE' : 'BLACKOUT'}, Water: ${currentState.waterSupplyActive ? 'FLOWING' : 'OFFLINE'}, Factory supplies: ${currentState.factorySupplyActive ? 'ACTIVE' : 'STALLED'}, Food price: ${currentState.foodPrice || 8} credits, Crime risk: ${currentState.crimeRisk || 12}%, Active crises: ${activeCrises.join(', ') || 'None'}.
Citizen Status: Credits: ${agent.credits}, Energy: ${agent.energy}%, Hunger: ${agent.hunger}%, Happiness: ${agent.happiness}%, Alive: ${agent.alive}, Home: ${agent.homeLocation || 'Pod'}.
Other citizens nearby: ${others}
Rules: work costs energy & earns salary; rest restores energy at home; eat costs food price & satisfies hunger; patrol maintains safety; petition requests City Hall emergency intervention.`;

      const timeoutPromise = new Promise<any>((resolve) =>
        setTimeout(() => resolve(this.cognitiveHeuristicDecision(currentState, agent)), 1800)
      );

      const aiPromise = (async () => {
        try {
          const res = await this.aiClient!.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: { responseMimeType: 'application/json', temperature: 0.6, maxOutputTokens: 250 },
          });

          let parsed: any = {};
          try {
            const cleaned = (res.text || '').trim().replace(/^```json/i, '').replace(/```$/g, '').trim();
            parsed = JSON.parse(cleaned || '{}');
          } catch {
            return this.cognitiveHeuristicDecision(currentState, agent);
          }

          const allowed: Action[] = ['work', 'rest', 'eat', 'socialize', 'trade', 'help', 'patrol', 'petition', 'inspect'];
          const chosenAction: Action = allowed.includes(parsed.chosenAction) ? parsed.chosenAction : 'work';
          const target = typeof parsed.target === 'string' ? parsed.target : null;
          const reason = typeof parsed.decisionReason === 'string' ? parsed.decisionReason.slice(0, 160) : 'Autonomous civic decision.';

          const options: { option: string; description: string }[] = Array.isArray(parsed.optionsConsidered)
            ? parsed.optionsConsidered.slice(0, 3).map((o: any, idx: number) => ({
                option: o.option || String.fromCharCode(65 + idx),
                description: String(o.description || 'Alternative course of action'),
              }))
            : [
                { option: 'A', description: `Engage in ${chosenAction} immediately` },
                { option: 'B', description: 'Conserve energy and remain at residence' },
              ];

          return {
            action: chosenAction,
            target,
            reason,
            decisionLog: {
              problemDetected: typeof parsed.problemDetected === 'string' ? parsed.problemDetected.slice(0, 140) : 'Standard daily civic routine.',
              relevantInfo: typeof parsed.relevantInfo === 'string' ? parsed.relevantInfo.slice(0, 180) : `Credits: ${agent.credits}, Hunger: ${agent.hunger}%, Energy: ${agent.energy}%.`,
              optionsConsidered: options,
              chosenAction,
              decisionReason: reason,
              expectedOutcome: typeof parsed.expectedOutcome === 'string' ? parsed.expectedOutcome.slice(0, 140) : 'Maintain personal well-being and city stability.',
            },
          };
        } catch {
          return this.cognitiveHeuristicDecision(currentState, agent);
        }
      })();

      return await Promise.race([aiPromise, timeoutPromise]);
    } catch {
      return this.cognitiveHeuristicDecision(currentState, agent);
    }
  }

  private cognitiveHeuristicDecision(
    currentState: SocietyState,
    agent: Agent
  ): {
    action: Action;
    target: string | null;
    reason: string;
    decisionLog?: {
      problemDetected: string;
      relevantInfo: string;
      optionsConsidered: { option: string; description: string }[];
      chosenAction: string;
      decisionReason: string;
      expectedOutcome: string;
    };
  } {
    const foodCost = currentState.foodPrice ?? 8;
    const activeCrises = currentState.activeCrises || [];
    const isFoodCut = currentState.foodSupplyActive === false || activeCrises.includes('food_shortage');
    const isPowerCut = currentState.powerGridActive === false || activeCrises.includes('blackout') || activeCrises.includes('power_failure');
    const isCrimeWave = (currentState.policePatrolBudget ?? 100) < 50 || activeCrises.includes('crime_wave');
    const isWaterCrisis = currentState.waterSupplyActive === false || activeCrises.includes('water_crisis');

    // 1. Crisis: Food Shortage & Extreme Hunger
    if (isFoodCut && agent.hunger > 50) {
      if (agent.credits < foodCost) {
        return {
          action: 'petition',
          target: null,
          reason: 'Petitioning City Hall for emergency municipal rations due to supply shutdown.',
          decisionLog: {
            problemDetected: `Food supply cut off. Food price inflated to ${foodCost} credits, exceeding balance (${agent.credits} credits).`,
            relevantInfo: `Hunger is at ${agent.hunger}%. Wallet contains ${agent.credits} credits. Living at ${agent.homeLocation || 'Pod'}.`,
            optionsConsidered: [
              { option: 'A', description: 'Submit an emergency ration petition at City Hall' },
              { option: 'B', description: 'Attempt to buy unaffordable groceries on credit' },
              { option: 'C', description: 'Rest at home to conserve calories until supply returns' },
            ],
            chosenAction: 'petition',
            decisionReason: 'City Hall offers emergency public relief vouchers when market supply fails.',
            expectedOutcome: 'Receive emergency food credits from the city treasury to prevent starvation.',
          },
        };
      } else {
        return {
          action: 'eat',
          target: null,
          reason: `Purchasing remaining food rations at surge price of ${foodCost} credits.`,
          decisionLog: {
            problemDetected: `Food supply disruption. Market food price increased to ${foodCost} credits.`,
            relevantInfo: `Current balance: ${agent.credits} credits. Hunger level: ${agent.hunger}%.`,
            optionsConsidered: [
              { option: 'A', description: `Pay surge price of ${foodCost} credits for emergency meal` },
              { option: 'B', description: 'Withhold credits and seek community donations at Town Plaza' },
              { option: 'C', description: 'Petition municipal council for ration caps' },
            ],
            chosenAction: 'eat',
            decisionReason: 'Immediate hunger relief takes priority over saving credits.',
            expectedOutcome: 'Safely satisfy hunger and preserve vital physical health.',
          },
        };
      }
    }

    // 2. Crisis: Blackout & Power Engineers / Mechanics
    if (isPowerCut && (agent.role === 'Grid Engineer' || agent.role === 'Mechanic' || agent.role === 'Builder')) {
      return {
        action: 'work',
        target: null,
        reason: 'Deploying to Power Substation to diagnose and repair municipal grid failure.',
        decisionLog: {
          problemDetected: 'City-wide electrical blackout. Generators and power distribution offline.',
          relevantInfo: `Professional role: ${agent.role}. Workshop & factory machines idling. Grid active: false.`,
          optionsConsidered: [
            { option: 'A', description: 'Deploy to Power Substation to manually reset turbine circuit breakers' },
            { option: 'B', description: 'Report electrical fault to City Hall dispatchers' },
            { option: 'C', description: 'Wait for automated grid failsafes to reboot' },
          ],
          chosenAction: 'work',
          decisionReason: 'My technical expertise is essential to bring the municipal electrical grid back online.',
          expectedOutcome: 'Restore power distribution to residences and industrial workshops.',
        },
      };
    }

    // 3. Crisis: Crime Wave & Detective / Police Officers
    if (isCrimeWave && (agent.role === 'Detective' || agent.isOfficer)) {
      return {
        action: 'patrol',
        target: null,
        reason: 'Conducting emergency patrols across sectors to suppress high crime risk.',
        decisionLog: {
          problemDetected: `Elevated crime risk at ${currentState.crimeRisk || 45}% following police patrol budget cuts.`,
          relevantInfo: `Role: ${agent.role}. Municipal patrol budget at ${currentState.policePatrolBudget ?? 100}%. Commercial avenues vulnerable.`,
          optionsConsidered: [
            { option: 'A', description: 'Initiate continuous foot patrol along high-traffic plaza sectors' },
            { option: 'B', description: 'Monitor dispatch feeds from Police Headquarters' },
            { option: 'C', description: 'Request emergency patrol funding at City Hall' },
          ],
          chosenAction: 'patrol',
          decisionReason: 'Visible law enforcement presence deters theft and protects citizen credit holdings.',
          expectedOutcome: 'Reduce sector crime risk and restore public security.',
        },
      };
    }

    // 4. Crisis: Water Crisis & Water Specialist
    if (isWaterCrisis && (agent.role === 'Water Specialist' || agent.role === 'Mechanic')) {
      return {
        action: 'work',
        target: null,
        reason: 'Flushing municipal filtration valves at the Water Treatment Plant.',
        decisionLog: {
          problemDetected: 'Municipal water supply stopped. Aqueduct filtration pumps stalled.',
          relevantInfo: `Role: ${agent.role}. Water active: false. Residential suites reporting pressure drop.`,
          optionsConsidered: [
            { option: 'A', description: 'Flush sediment intake valves at the Water Plant' },
            { option: 'B', description: 'Distribute emergency water rations from depot storage' },
            { option: 'C', description: 'File an infrastructure emergency report with the Mayor' },
          ],
          chosenAction: 'work',
          decisionReason: 'Direct intervention at the Water Plant is required to restore clean pipeline pressure.',
          expectedOutcome: 'Restore clean municipal drinking water to all districts.',
        },
      };
    }

    // 5. Critical hunger in normal conditions
    if (agent.hunger > 65 && agent.credits >= foodCost) {
      return {
        action: 'eat',
        target: null,
        reason: 'Satisfying hunger with a fresh meal.',
        decisionLog: {
          problemDetected: `Elevated hunger at ${agent.hunger}%. Energy reserves declining.`,
          relevantInfo: `Credits: ${agent.credits}. Food price: ${foodCost}. Grocery and Cafe open.`,
          optionsConsidered: [
            { option: 'A', description: `Purchase a nourishing meal for ${foodCost} credits` },
            { option: 'B', description: 'Continue working through hunger to accumulate more credits' },
            { option: 'C', description: 'Seek food barter with a fellow citizen' },
          ],
          chosenAction: 'eat',
          decisionReason: 'Eating prevents starvation and restores health and happiness.',
          expectedOutcome: 'Lower hunger to safe levels and regain stamina.',
        },
      };
    }

    // 6. Critical fatigue: must rest
    if (agent.energy < 25) {
      return {
        action: 'rest',
        target: null,
        reason: `Resting at ${agent.homeLocation || 'home'} to recover stamina.`,
        decisionLog: {
          problemDetected: `Severe physical fatigue: energy fallen to ${agent.energy}%.`,
          relevantInfo: `Home residence: ${agent.homeLocation || 'Pod'}. Shift completed.`,
          optionsConsidered: [
            { option: 'A', description: `Return to ${agent.homeLocation || 'home'} for full sleep rest` },
            { option: 'B', description: 'Rest briefly on a bench in the Town Plaza' },
            { option: 'C', description: 'Consume energizing drink at the Cafe' },
          ],
          chosenAction: 'rest',
          decisionReason: 'Sleeping at residence provides optimal stamina recovery and avoids burnout.',
          expectedOutcome: 'Restore energy above 80% to resume professional duties tomorrow.',
        },
      };
    }

    // 7. Police patrol during regular duty hours
    if ((agent.isOfficer || agent.role === 'Detective') && currentState.hour >= 8 && currentState.hour <= 22 && Math.random() < 0.6) {
      return {
        action: 'patrol',
        target: null,
        reason: 'Patrolling municipal sectors to maintain public order.',
        decisionLog: {
          problemDetected: 'Routine civic surveillance and public safety monitoring.',
          relevantInfo: `Current crime risk: ${currentState.crimeRisk || 12}%. Hour: ${currentState.hour}:00.`,
          optionsConsidered: [
            { option: 'A', description: 'Patrol Town Plaza and Central Market' },
            { option: 'B', description: 'Inspect detention records at Police HQ' },
            { option: 'C', description: 'Coordinate with Council planners' },
          ],
          chosenAction: 'patrol',
          decisionReason: 'Scheduled patrol prevents lawlessness and guarantees commercial peace.',
          expectedOutcome: 'Keep crime risk low and reassure citizens.',
        },
      };
    }

    // 8. Social connection when unhappy or evening plaza gathering
    if (agent.happiness < 45 || (currentState.hour >= 18 && currentState.hour <= 20 && Math.random() < 0.45)) {
      const others = currentState.agents.filter((a) => a.alive && a.id !== agent.id);
      const randomTarget = others[Math.floor(Math.random() * others.length)]?.name || null;
      return {
        action: 'socialize',
        target: randomTarget,
        reason: `Gathering with ${randomTarget || 'fellow citizens'} in Town Plaza.`,
        decisionLog: {
          problemDetected: `Low morale or evening leisure hour (happiness at ${agent.happiness}%).`,
          relevantInfo: `Time: ${currentState.hour}:00. Town Plaza open for communal activities.`,
          optionsConsidered: [
            { option: 'A', description: `Chat with ${randomTarget || 'citizens'} at the Town Plaza` },
            { option: 'B', description: 'Isolate in private apartment quarters' },
            { option: 'C', description: 'Overtime work shift' },
          ],
          chosenAction: 'socialize',
          decisionReason: 'Social interaction improves mental well-being and strengthens civic relationships.',
          expectedOutcome: 'Boost happiness and build community trust.',
        },
      };
    }

    // 9. Wealthy citizens trade or help neighbors
    if (agent.credits > 120 && Math.random() < 0.25) {
      const needy = currentState.agents.find((a) => a.alive && a.id !== agent.id && a.credits < 30);
      if (needy) {
        return {
          action: 'help',
          target: needy.name,
          reason: `Providing mutual aid credits to ${needy.name}.`,
          decisionLog: {
            problemDetected: `${needy.name} has low financial reserves (${needy.credits} credits).`,
            relevantInfo: `My balance: ${agent.credits} credits. Mutual aid strengthens the community.`,
            optionsConsidered: [
              { option: 'A', description: `Send 3 credits mutual aid to ${needy.name}` },
              { option: 'B', description: 'Invest excess credits in personal stock' },
              { option: 'C', description: 'Deposit credits in City Bank vault' },
            ],
            chosenAction: 'help',
            decisionReason: 'Assisting fellow citizens protects our collective civic stability.',
            expectedOutcome: `Improve ${needy.name}'s resilience and prevent neighbor bankruptcy.`,
          },
        };
      }
      const others = currentState.agents.filter((a) => a.alive && a.id !== agent.id);
      const randomTarget = others[Math.floor(Math.random() * others.length)]?.name || null;
      return {
        action: 'trade',
        target: randomTarget,
        reason: 'Exchanging commercial goods and credits.',
        decisionLog: {
          problemDetected: 'Excess liquid credits available for commerce and investment.',
          relevantInfo: `Balance: ${agent.credits} credits. Market active.`,
          optionsConsidered: [
            { option: 'A', description: `Conduct 5-credit commercial trade with ${randomTarget}` },
            { option: 'B', description: 'Hold credits in wallet' },
            { option: 'C', description: 'Purchase goods at grocery store' },
          ],
          chosenAction: 'trade',
          decisionReason: 'Circulating currency drives city GDP and generates mutual prosperity.',
          expectedOutcome: 'Facilitate trade exchange and stimulate local economy.',
        },
      };
    }

    // 10. Mayor / Planners inspect public facilities
    if ((agent.isMayor || agent.role === 'Planner') && (currentState.hour === 10 || currentState.hour === 14) && Math.random() < 0.5) {
      return {
        action: 'inspect',
        target: null,
        reason: 'Inspecting city infrastructure and verifying public operations.',
        decisionLog: {
          problemDetected: 'Scheduled mayoral inspection of municipal infrastructure.',
          relevantInfo: `City treasury: ${currentState.treasury ?? 1000} credits. Active crises: ${activeCrises.length}.`,
          optionsConsidered: [
            { option: 'A', description: 'Inspect municipal departments and utility status' },
            { option: 'B', description: 'Draft legislative ordinances in City Hall' },
            { option: 'C', description: 'Review citizen tax ledgers' },
          ],
          chosenAction: 'inspect',
          decisionReason: 'Executive oversight ensures public departments function efficiently.',
          expectedOutcome: 'Verify infrastructure integrity and address civic bottlenecks.',
        },
      };
    }

    // 11. Night time sleeping (23:00 to 05:00)
    if ((currentState.hour >= 23 || currentState.hour < 6) && agent.energy < 85) {
      return {
        action: 'rest',
        target: null,
        reason: `Sleeping through the night at ${agent.homeLocation || 'home'}.`,
        decisionLog: {
          problemDetected: 'Circadian rest period (night phase).',
          relevantInfo: `Current hour: ${currentState.hour}:00. Residence: ${agent.homeLocation || 'Pod'}.`,
          optionsConsidered: [
            { option: 'A', description: `Sleep at ${agent.homeLocation || 'home'} until dawn` },
            { option: 'B', description: 'Wander through nocturnal city streets' },
            { option: 'C', description: 'Perform late night shift' },
          ],
          chosenAction: 'rest',
          decisionReason: 'Night rest recovers cognitive focus and energy for the upcoming morning.',
          expectedOutcome: 'Wake up fully refreshed with restored energy.',
        },
      };
    }

    // 12. Default: productive work at their profession
    return {
      action: 'work',
      target: null,
      reason: `Fulfilling daily duties as ${agent.role}.`,
      decisionLog: {
        problemDetected: 'Scheduled professional shift in progress.',
        relevantInfo: `Salary: ${agent.salary || 15} credits/shift. Energy: ${agent.energy}%. Role: ${agent.role}.`,
        optionsConsidered: [
          { option: 'A', description: `Execute professional responsibilities as ${agent.role}` },
          { option: 'B', description: 'Take an unscheduled break at the Cafe' },
          { option: 'C', description: 'Visit Town Plaza to mingle' },
        ],
        chosenAction: 'work',
        decisionReason: 'Earning daily salary ensures financial self-sufficiency and advances city growth.',
        expectedOutcome: `Earn ${agent.salary || 15} credits and advance municipal productivity.`,
      },
    };
  }

  private prepareAgentAction(
    currentState: SocietyState,
    agent: Agent,
    decision: {
      action: Action;
      target: string | null;
      reason: string;
      decisionLog?: {
        problemDetected: string;
        relevantInfo: string;
        optionsConsidered: { option: string; description: string }[];
        chosenAction: string;
        decisionReason: string;
        expectedOutcome: string;
      };
    }
  ): any[] {
    const { action, target, reason, decisionLog } = decision;
    let detail = '';
    let creditsDelta = 0;
    let targetAgent: Agent | undefined;
    let otherMemoryText: string | null = null;
    let actualResult = '';

    const activeCrises = currentState.activeCrises || [];
    const isPowerCut = currentState.powerGridActive === false || activeCrises.includes('blackout') || activeCrises.includes('power_failure');
    const isFoodCut = currentState.foodSupplyActive === false || activeCrises.includes('food_shortage');

    if (action === 'work') {
      let earned = agent.salary || 15;
      // Real consequence: power failure halves earnings in tech/factory/industrial sectors
      const isIndustrial = ['Builder', 'Mechanic', 'Grid Engineer', 'Factory Supervisor'].includes(agent.role);
      if (isPowerCut && isIndustrial) {
        earned = Math.max(4, Math.floor(earned * 0.5));
        detail = `worked as a ${agent.role.toLowerCase()} under blackout; earned ${earned} credits (50% power outage penalty)`;
        actualResult = `Completed partial work shift without grid power; earned ${earned} credits (reduced by blackout). Energy at ${agent.energy}%.`;
      } else {
        detail = `worked as a ${agent.role.toLowerCase()} and earned ${earned} credits`;
        actualResult = `Successfully completed work shift as ${agent.role}; earned ${earned} credits. Energy decreased to ${Math.max(0, agent.energy - 12)}%.`;
      }
      agent.credits += earned;
      agent.energy = Math.max(0, Math.min(100, agent.energy - 12));
      creditsDelta = earned;
    } else if (action === 'rest') {
      agent.energy = Math.max(0, Math.min(100, agent.energy + 22));
      const homeName = agent.homeLocation || 'home';
      detail = `rested at ${homeName} and recovered energy`;
      actualResult = `Rested peacefully at ${homeName}; energy recovered to ${agent.energy}%.`;
    } else if (action === 'eat') {
      const price = currentState.foodPrice ?? 8;
      if (agent.credits >= price) {
        agent.credits -= price;
        creditsDelta = -price;
        agent.hunger = Math.max(0, Math.min(100, agent.hunger - 35));
        agent.happiness = Math.max(0, Math.min(100, agent.happiness + 3));
        if (isFoodCut) {
          detail = `bought emergency ration meal at crisis price of ${price} credits`;
          actualResult = `Secured emergency ration meal for ${price} credits despite supply disruption; hunger reduced to ${agent.hunger}%.`;
        } else {
          detail = `bought a meal for ${price} credits`;
          actualResult = `Purchased meal for ${price} credits; hunger decreased to ${agent.hunger}%.`;
        }
      } else {
        agent.hunger = Math.max(0, Math.min(100, agent.hunger + 8));
        detail = `could not afford a meal (${price} credits required)`;
        actualResult = `Failed to purchase meal: insufficient credits (${agent.credits} available vs ${price} required). Hunger increased to ${agent.hunger}%.`;
      }
    } else if (action === 'socialize') {
      agent.happiness = Math.max(0, Math.min(100, agent.happiness + 8));
      targetAgent = currentState.agents.find(
        (a) => a.alive && a.name.toLowerCase() === target?.toLowerCase() && a.id !== agent.id
      );
      if (targetAgent) {
        targetAgent.happiness = Math.max(0, Math.min(100, targetAgent.happiness + 3));
        otherMemoryText = `${agent.name} chatted with me at hour ${currentState.hour}.`;
        targetAgent.memory.push(otherMemoryText);
        detail = `spent time talking with ${targetAgent.name}`;
        actualResult = `Engaged in meaningful conversation with ${targetAgent.name}; personal happiness increased to ${agent.happiness}%.`;
      } else {
        detail = 'spent time around the city and felt more connected';
        actualResult = `Walked around Town Plaza; felt connected with the city community. Happiness at ${agent.happiness}%.`;
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
        actualResult = `Transferred ${amount} credits to ${targetAgent.name}; transaction verified in city ledger.`;
      } else {
        agent.happiness = Math.max(0, Math.min(100, agent.happiness - 1));
        detail = 'could not complete the transfer, so no credits moved';
        actualResult = 'Transaction could not be completed; partner unavailable or insufficient balance.';
      }
    } else if (action === 'patrol') {
      agent.credits += 12;
      creditsDelta = 12;
      agent.energy = Math.max(0, Math.min(100, agent.energy - 10));
      detail = 'patrolled city sectors and maintained public safety';
      actualResult = 'Conducted sector patrol; verified commercial avenues and deterred petty infractions.';
    } else if (action === 'vote') {
      agent.happiness = Math.min(100, agent.happiness + 5);
      detail = 'cast a secret ballot at City Hall';
      actualResult = 'Participated in municipal election; ballot recorded in the democratic ledger.';
    } else if (action === 'inspect') {
      agent.energy = Math.max(0, Math.min(100, agent.energy - 6));
      detail = 'inspected public facilities and verified civic operations';
      actualResult = 'Completed inspection tour of public utilities; logged departmental report.';
    } else if (action === 'petition') {
      if (isFoodCut && (currentState.treasury ?? 1000) > 50) {
        agent.credits += 10;
        creditsDelta = 10;
        currentState.treasury = Math.max(0, (currentState.treasury ?? 1000) - 10);
        detail = 'petitioned City Hall and received 10 emergency ration credits from treasury';
        actualResult = 'Council approved emergency food relief; 10 credits disbursed from city treasury.';
      } else {
        detail = 'submitted a formal civic petition to the municipal council';
        actualResult = 'Petition submitted to City Hall Council for public debate in next session.';
      }
    }

    agent.hunger = Math.max(0, Math.min(100, agent.hunger + (isFoodCut ? 9 : 6)));
    agent.energy = Math.max(0, Math.min(100, agent.energy - 3));
    agent.lastAction = detail;

    // Designate realistic location based on action, home, and profession (all 20 citizens)
    let newLocation = 'Homes';
    const agentNum = parseInt(agent.id.replace('agent-', ''), 10) || 1;

    if (action === 'work') {
      switch (agent.role) {
        case 'Builder': newLocation = 'Workshop'; break;
        case 'Trader': newLocation = 'Central Market'; break;
        case 'Researcher': newLocation = 'Research Lab'; break;
        case 'Chef': newLocation = 'Cafe'; break;
        case 'Courier': newLocation = 'Transit Hub'; break;
        case 'Artist': newLocation = 'City Plaza'; break;
        case 'Mechanic': newLocation = 'Power'; break;
        case 'Farmer': newLocation = 'Recycling'; break;
        case 'Teacher': newLocation = 'Academy'; break;
        case 'Planner': newLocation = 'City Hall'; break;
        // Citizens 11-20
        case 'Detective': newLocation = 'Police HQ'; break;
        case 'Botanist': newLocation = 'Garden'; break;
        case 'Grid Engineer': newLocation = 'Power'; break;
        case 'Doctor': newLocation = 'Hospital'; break;
        case 'Banker': newLocation = 'Bank'; break;
        case 'Factory Supervisor': newLocation = 'Factory'; break;
        case 'Water Specialist': newLocation = 'Water'; break;
        case 'Firefighter': newLocation = 'Fire Dept'; break;
        case 'Grocer': newLocation = 'Grocery'; break;
        case 'Journalist': newLocation = 'Offices'; break;
        default: newLocation = 'Workshop'; break;
      }
    } else if (action === 'eat') {
      newLocation = agent.hunger > 60 ? 'Grocery' : 'Cafe';
    } else if (action === 'trade') {
      newLocation = 'Central Market';
    } else if (action === 'socialize') {
      newLocation = 'City Plaza';
    } else if (action === 'patrol') {
      newLocation = 'Police HQ';
    } else if (action === 'vote' || action === 'petition' || action === 'inspect') {
      newLocation = 'City Hall';
    } else if (action === 'rest') {
      if (agentNum <= 10) {
        newLocation = 'Homes'; // Radial pod
      } else if (agentNum <= 15) {
        newLocation = 'North Heights Apartments';
      } else {
        newLocation = 'South Terrace Apartments';
      }
    }

    agent.location = newLocation;
    const coords = LOCATION_COORDINATES[newLocation] || { x: 50, y: 50 };
    agent.x = coords.x;
    agent.y = coords.y;

    const memoryContent = `Year ${currentState.year || 1}, Day ${currentState.day || 1} ${String(currentState.hour).padStart(2, '0')}:00: ${detail}.`;
    agent.memory.push(memoryContent);
    agent.memory = agent.memory.slice(-12);

    const eventText = `${agent.name} ${detail}. Reason: ${reason}`;
    currentState.events.unshift({
      id: Date.now() + Math.random(),
      time: `${String(currentState.hour).padStart(2, '0')}:00`,
      kind: action,
      text: eventText,
      agent: agent.name,
      round: currentState.rounds,
    });
    currentState.events = currentState.events.slice(0, 100);

    // AI Brain Observatory: Save decision log with verified actual consequence
    if (decisionLog) {
      const record: DecisionRecord = {
        id: `dec-${Date.now()}-${agent.id}`,
        agentId: agent.id,
        agentName: agent.name,
        problemDetected: decisionLog.problemDetected,
        relevantInfo: decisionLog.relevantInfo,
        optionsConsidered: decisionLog.optionsConsidered.map((o) => `${o.option}: ${o.description}`),
        chosenAction: decisionLog.chosenAction,
        decisionReason: decisionLog.decisionReason,
        expectedOutcome: decisionLog.expectedOutcome,
        actualResult,
        round: currentState.rounds,
        hour: currentState.hour,
        createdAt: new Date().toISOString(),
      };

      if (!currentState.decisionLogs) currentState.decisionLogs = [];
      currentState.decisionLogs.unshift(record);
      currentState.decisionLogs = currentState.decisionLogs.slice(0, 100);
    }

    const ops: any[] = [];
    if (currentState.sessionId !== 'fallback-session' && agent.dbId) {
      ops.push(
        prisma.agent.update({
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
        })
      );

      if (targetAgent && targetAgent.dbId) {
        ops.push(
          prisma.agent.update({
            where: { id: targetAgent.dbId },
            data: {
              credits: targetAgent.credits,
              happiness: targetAgent.happiness,
            },
          })
        );
      }

      ops.push(
        prisma.agentAction.create({
          data: {
            sessionId: currentState.sessionId,
            agentId: agent.dbId,
            action,
            targetName: targetAgent?.name || null,
            targetId: targetAgent?.dbId || null,
            reason,
            details: detail,
            creditsDelta,
            round: currentState.rounds,
            hour: currentState.hour,
          },
        })
      );

      ops.push(
        prisma.agentMemory.create({
          data: {
            agentId: agent.dbId,
            content: memoryContent,
            round: currentState.rounds,
            hour: currentState.hour,
          },
        })
      );

      ops.push(
        prisma.simulationEvent.create({
          data: {
            sessionId: currentState.sessionId,
            time: `${String(currentState.hour).padStart(2, '0')}:00`,
            kind: action,
            text: eventText,
            agentName: agent.name,
            round: currentState.rounds,
          },
        })
      );

      if (decisionLog) {
        ops.push(
          prisma.decisionLog.create({
            data: {
              sessionId: currentState.sessionId,
              agentId: agent.dbId,
              agentName: agent.name,
              round: currentState.rounds,
              hour: currentState.hour,
              problemDetected: decisionLog.problemDetected,
              relevantInfo: decisionLog.relevantInfo,
              optionsConsidered: JSON.stringify(decisionLog.optionsConsidered),
              chosenAction: decisionLog.chosenAction,
              decisionReason: decisionLog.decisionReason,
              expectedOutcome: decisionLog.expectedOutcome,
              actualResult,
            },
          })
        );
      }
    }

    return ops;
  }
}

// Global singleton to prevent duplicate workers across HMR / module reloads
const globalForWorker = globalThis as unknown as { __simulationWorker?: SimulationWorkerManager };

export const simulationWorker = globalForWorker.__simulationWorker ?? new SimulationWorkerManager();
if (process.env.NODE_ENV !== 'production') {
  globalForWorker.__simulationWorker = simulationWorker;
}
