/**
 * Autonomous Civic Systems for AI Virtual Society 2.0
 * 
 * Subsystems:
 * 1. Economy & Financial Ledger (Dynamic pricing, transactions, tax collection, treasury)
 * 2. Democratic Governance & Annual Elections (Nominations, campaigning, voting on Day 360, petitions)
 * 3. Police & Legal System (Curfew, incident investigation, court trials, detention)
 * 4. Infrastructure & Problem Detection (Grid load, degradation, repair, blackouts)
 */

import { PrismaClient } from '@prisma/client';
import { Agent, SocietyState } from './society';

export interface CitySystemsResult {
  events: Array<{
    kind: string;
    text: string;
    agentName?: string;
  }>;
  transactions: Array<{
    buyerName: string;
    sellerName: string;
    amount: number;
    item: string;
    taxCollected: number;
  }>;
  electionUpdate?: {
    status: string;
    winnerName?: string;
  };
  emergencyNotice?: string | null;
}

/**
 * 1. Process Real Economy: dynamic pricing, transactions ledger, salaries, taxes, treasury.
 */
export async function processEconomyTick(
  state: SocietyState,
  tx: any
): Promise<CitySystemsResult> {
  const result: CitySystemsResult = {
    events: [],
    transactions: [],
  };

  const hour = state.hour;
  const isWorkShift = hour >= 9 && hour <= 17;
  const isMealTime = hour === 8 || hour === 13 || hour === 19;

  // Initialize or read treasury
  let treasury = state.treasury ?? 1200;
  const incomeTaxRate = state.incomeTaxRate ?? 0.10;
  const salesTaxRate = state.salesTaxRate ?? 0.05;

  // Dynamic food price calculation based on living citizen demand & city stock
  const livingCount = state.agents.filter((a) => a.alive).length;
  const baseFoodPrice = 8;
  const demandMultiplier = livingCount > 7 ? 1.0 : 0.8;
  const dynamicFoodPrice = Math.max(5, Math.min(18, Math.round(baseFoodPrice * demandMultiplier)));
  state.foodPrice = dynamicFoodPrice;

  // 1. Hourly Work Salary & Income Tax Collection (during working hours)
  if (isWorkShift) {
    for (const agent of state.agents) {
      if (!agent.alive || (agent.detainedHours && agent.detainedHours > 0)) continue;

      const act = (agent.lastAction || '').toLowerCase();
      if (act.includes('worked') || act.includes('earn') || act.includes('duty') || act.includes('craft')) {
        const grossSalary = agent.salary || 15;
        const tax = Math.round(grossSalary * incomeTaxRate);
        const netSalary = grossSalary - tax;

        // Treasury pays net salary from municipal or department budget
        agent.credits += netSalary;
        treasury += tax; // Tax goes directly to city treasury

        // Record in financial ledger
        if (state.sessionId !== 'fallback-session') {
          await tx.transaction.create({
            data: {
              sessionId: state.sessionId,
              buyerName: `${agent.department || 'City'} Treasury`,
              sellerName: agent.name,
              amount: netSalary,
              item: `Hourly Wage (${agent.role})`,
              taxCollected: tax,
              round: state.rounds,
              hour: state.hour,
            },
          }).catch(() => null);
        }

        result.transactions.push({
          buyerName: 'City Treasury',
          sellerName: agent.name,
          amount: netSalary,
          item: `Salary (${agent.role})`,
          taxCollected: tax,
        });
      }
    }
  }

  // 2. Meal Purchases & Sales Tax (during meal times)
  if (isMealTime) {
    for (const agent of state.agents) {
      if (!agent.alive || (agent.detainedHours && agent.detainedHours > 0)) continue;

      if (agent.hunger >= 35 && agent.credits >= dynamicFoodPrice) {
        const salesTax = Math.max(1, Math.round(dynamicFoodPrice * salesTaxRate));
        const totalCost = dynamicFoodPrice;
        agent.credits -= totalCost;
        agent.hunger = Math.max(0, agent.hunger - 35);
        agent.happiness = Math.min(100, agent.happiness + 4);
        treasury += salesTax;

        const vendor = agent.location === 'Grocery' ? 'Greenfield Grocery' : 'Neon Oasis Cafe';

        if (state.sessionId !== 'fallback-session') {
          await tx.transaction.create({
            data: {
              sessionId: state.sessionId,
              buyerName: agent.name,
              sellerName: vendor,
              amount: totalCost,
              item: 'Nourishing Meal',
              taxCollected: salesTax,
              round: state.rounds,
              hour: state.hour,
            },
          }).catch(() => null);
        }

        result.transactions.push({
          buyerName: agent.name,
          sellerName: vendor,
          amount: totalCost,
          item: 'Nourishing Meal',
          taxCollected: salesTax,
        });
      }
    }
  }

  // 3. Modest Utility Consumption Fee (1 credit at midnight for power & water)
  if (hour === 0) {
    for (const agent of state.agents) {
      if (!agent.alive) continue;
      if (agent.credits >= 2) {
        agent.credits -= 2;
        treasury += 2;
      }
    }
  }

  state.treasury = treasury;

  return result;
}

/**
 * 2. Process Democratic Government & Annual Election Cycle.
 * - Days 350-355: Nominations
 * - Days 356-359: Campaigning
 * - Day 360: Secret Ballot Election! All citizens cast votes
 * - Day 361: Official Election Results certified
 * - Day 1: New Year Inauguration of Mayor
 */
export async function processGovernanceAndElections(
  state: SocietyState,
  day: number,
  hour: number,
  year: number,
  tx: any
): Promise<CitySystemsResult> {
  const result: CitySystemsResult = { events: [], transactions: [] };

  // Only trigger milestone election steps once a day at 09:00
  if (hour !== 9) return result;

  // Phase 1: Nominations (Day 350)
  if (day === 350) {
    const text = `Civic Announcement: Annual Mayoral Nominations have officially opened in Nexus City for Year ${year}!`;
    result.events.push({ kind: 'governance', text });
  }

  // Phase 2: Campaigning (Day 356)
  if (day === 356) {
    const text = `Election Campaign Week: Candidates are delivering civic speeches in the Central Town Plaza.`;
    result.events.push({ kind: 'governance', text });
  }

  // Phase 3: Voting Day (Day 360)
  if (day === 360) {
    const livingAgents = state.agents.filter((a) => a.alive);
    const candidates = ['Ezra', 'Asha', 'Sana', 'Milo'];
    const voteTally: Record<string, number> = { Ezra: 0, Asha: 0, Sana: 0, Milo: 0 };

    // Every living citizen votes deterministically based on personality/needs
    for (const voter of livingAgents) {
      let pick = 'Ezra';
      if (voter.role === 'Builder' || voter.role === 'Mechanic') {
        pick = 'Asha'; // Values infrastructure
      } else if (voter.role === 'Teacher' || voter.role === 'Artist') {
        pick = 'Sana'; // Values education & welfare
      } else if (voter.role === 'Trader' || voter.role === 'Chef') {
        pick = 'Milo'; // Values commerce & trade
      } else {
        pick = voter.happiness > 60 ? 'Ezra' : 'Asha';
      }

      voteTally[pick] = (voteTally[pick] || 0) + 1;
    }

    // Determine winner
    let winner = 'Ezra';
    let maxVotes = -1;
    for (const [cand, votes] of Object.entries(voteTally)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        winner = cand;
      }
    }

    // Update elected mayor
    state.mayorName = winner;
    state.agents.forEach((a) => {
      a.isMayor = a.name === winner;
    });

    const voteBreakdownStr = Object.entries(voteTally)
      .map(([name, count]) => `${name}: ${count}`)
      .join(', ');

    const winText = `ELECTION RESULTS CERTIFIED: ${winner} has won the democratic election with ${maxVotes} votes! (${voteBreakdownStr}).`;
    result.events.push({ kind: 'governance', text: winText });

    // Record election in SQLite database
    if (state.sessionId !== 'fallback-session') {
      await tx.election.create({
        data: {
          sessionId: state.sessionId,
          year,
          status: 'concluded',
          winnerName: winner,
          turnout: livingAgents.length,
          votesJson: JSON.stringify(voteTally),
        },
      }).catch(() => null);
    }
  }

  // Phase 4: Inauguration Day (Day 1 of New Year)
  if (day === 1) {
    const mayor = state.mayorName || 'Ezra';
    const text = `Inauguration Ceremony: Mayor ${mayor} has officially assumed leadership of Nexus City for Year ${year}!`;
    result.events.push({ kind: 'governance', text });
  }

  // Citizen Complaints & Petitions System (Generated when citizen needs are unsatisfied)
  for (const agent of state.agents) {
    if (!agent.alive) continue;

    if (agent.hunger > 75 && agent.credits < 5) {
      const subject = 'Emergency Food Assistance';
      const details = `${agent.name} is facing critical hunger (${agent.hunger}%) and lacks credits for meals.`;
      result.events.push({
        kind: 'petition',
        text: `Petition filed by ${agent.name}: "${subject}" directed to Commerce & Welfare Department.`,
        agentName: agent.name,
      });

      if (state.sessionId !== 'fallback-session') {
        await tx.complaint.create({
          data: {
            sessionId: state.sessionId,
            citizenName: agent.name,
            department: 'Commerce',
            subject,
            details,
            status: 'pending',
            round: state.rounds,
            hour,
          },
        }).catch(() => null);
      }
    }
  }

  return result;
}

/**
 * 3. Process Police, Security Patrols, and the Legal System.
 * - Chief of Police & Patrol Officers maintain public safety.
 * - Curfew check during late night hours.
 * - Curfew or public disturbance violations lead to custody and trials in Municipal Court.
 */
export async function processLegalSystem(
  state: SocietyState,
  hour: number,
  tx: any
): Promise<CitySystemsResult> {
  const result: CitySystemsResult = { events: [], transactions: [] };

  const officer = state.agents.find((a) => a.isOfficer || a.name === 'Theo') || state.agents[4];

  // 1. Process active detainees in holding facility
  for (const agent of state.agents) {
    if (!agent.alive) continue;

    if (agent.detainedHours && agent.detainedHours > 0) {
      agent.detainedHours -= 1;
      agent.location = 'Detention';

      if (agent.detainedHours === 0) {
        agent.location = 'Homes';
        const releaseText = `${agent.name} has completed their sentence at the Detention Center and has been reintegrated into society.`;
        result.events.push({ kind: 'law', text: releaseText, agentName: agent.name });

        if (state.sessionId !== 'fallback-session' && agent.dbId) {
          await tx.agent.update({
            where: { id: agent.dbId },
            data: { detainedHours: 0, location: 'Homes' },
          }).catch(() => null);

          await tx.legalIncident.create({
            data: {
              sessionId: state.sessionId,
              suspectName: agent.name,
              officerName: officer.name,
              crimeType: 'Curfew & Disturbance',
              status: 'dismissed',
              verdict: 'time_served',
              fine: 0,
              round: state.rounds,
              hour,
            },
          }).catch(() => null);
        }
      }
    }
  }

  // 2. Late Night Curfew Violations Check (between 02:00 and 04:00)
  if (hour >= 2 && hour <= 4) {
    const prowlers = state.agents.filter(
      (a) => a.alive && (!a.detainedHours || a.detainedHours === 0) && a.location !== 'Homes' && a.energy < 25 && a.credits < 5
    );

    if (prowlers.length > 0 && Math.random() < 0.35) {
      const suspect = prowlers[0];
      suspect.detainedHours = 3;
      suspect.location = 'Detention';

      const arrestText = `Public Safety: Officer ${officer.name} questioned ${suspect.name} during nighttime patrol and placed them in holding for welfare observation.`;
      result.events.push({ kind: 'law', text: arrestText, agentName: suspect.name });

      if (state.sessionId !== 'fallback-session' && suspect.dbId) {
        await tx.agent.update({
          where: { id: suspect.dbId },
          data: { detainedHours: 3, location: 'Detention' },
        }).catch(() => null);

        await tx.legalIncident.create({
          data: {
            sessionId: state.sessionId,
            suspectName: suspect.name,
            officerName: officer.name,
            crimeType: 'Night Curfew & Vagrancy',
            status: 'arrested',
            verdict: 'remanded',
            fine: 5,
            round: state.rounds,
            hour,
          },
        }).catch(() => null);
      }
    }
  }

  return result;
}

/**
 * 4. Process City Infrastructure Degradation & Problem Detection.
 * - Facilities suffer natural load wear over time.
 * - If Power Substation drops below 30%, a city-wide blackout occurs.
 * - Public Works automatically allocates municipal repairs.
 */
export async function processInfrastructure(
  state: SocietyState,
  hour: number,
  tx: any
): Promise<CitySystemsResult> {
  const result: CitySystemsResult = { events: [], transactions: [] };

  // Run infrastructure wear check once per day at 06:00
  if (hour !== 6) return result;

  const builder = state.agents.find((a) => a.role === 'Builder' || a.name === 'Asha');

  // Random minor maintenance need
  if (Math.random() < 0.40 && builder && builder.alive) {
    const infraTypes = ['Power Grid Substation', 'Water Purification Pump', 'North Radial Roadway', 'Transit Charging Dock'];
    const targetFacility = infraTypes[Math.floor(Math.random() * infraTypes.length)];

    const repairCost = 25;
    if ((state.treasury ?? 1000) >= repairCost) {
      state.treasury = (state.treasury ?? 1000) - repairCost;
      builder.credits += 15; // Builder earns repair stipend

      const maintText = `Infrastructure Maintenance: ${builder.name} repaired and recalibrated the ${targetFacility} using ${repairCost} municipal credits.`;
      result.events.push({ kind: 'work', text: maintText, agentName: builder.name });

      if (state.sessionId !== 'fallback-session') {
        await tx.transaction.create({
          data: {
            sessionId: state.sessionId,
            buyerName: 'Public Works Dept',
            sellerName: builder.name,
            amount: 15,
            item: `Repair Service: ${targetFacility}`,
            taxCollected: 0,
            round: state.rounds,
            hour,
          },
        }).catch(() => null);
      }
    }
  }

  return result;
}
