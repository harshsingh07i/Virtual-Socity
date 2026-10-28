import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getState, ensureInitialized } from '@/lib/society';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await ensureInitialized();
    const sessionId = state.sessionId;

    if (sessionId === 'fallback-session') {
      return NextResponse.json({
        treasury: 1200,
        mayorName: 'Ezra',
        foodPrice: 8,
        transactions: [],
        complaints: [],
        elections: [],
        legalCases: [],
      });
    }

    const [transactions, complaints, elections, legalCases, session] = await Promise.all([
      prisma.transaction.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: 60,
      }),
      prisma.complaint.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.election.findMany({
        where: { sessionId },
        orderBy: { year: 'desc' },
        take: 10,
      }),
      prisma.legalIncident.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.simulationSession.findUnique({
        where: { id: sessionId },
        select: {
          treasury: true,
          mayorName: true,
          foodPrice: true,
          activeEmergency: true,
          incomeTaxRate: true,
          salesTaxRate: true,
        },
      }),
    ]);

    return NextResponse.json({
      treasury: session?.treasury ?? state.treasury ?? 1200,
      mayorName: session?.mayorName ?? state.mayorName ?? 'Ezra',
      foodPrice: session?.foodPrice ?? state.foodPrice ?? 8,
      activeEmergency: session?.activeEmergency ?? state.activeEmergency ?? null,
      incomeTaxRate: session?.incomeTaxRate ?? 0.10,
      salesTaxRate: session?.salesTaxRate ?? 0.05,
      transactions,
      complaints,
      elections,
      legalCases,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch civic data.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, scenario, complaintId, agentId } = body;
    const state = await ensureInitialized();

    // 1. Scenario Injection
    if (action === 'inject_scenario') {
      let eventText = '';
      if (scenario === 'famine') {
        state.foodPrice = 18;
        state.agents.forEach((a) => {
          a.hunger = Math.min(100, a.hunger + 25);
        });
        eventText = 'CRISIS: Food supply disruption reported! Food prices surged to 18 credits.';
      } else if (scenario === 'blackout') {
        state.activeEmergency = 'Power Grid Failure';
        eventText = 'EMERGENCY: Power substation tripped! Solar and nuclear grid down for maintenance.';
      } else if (scenario === 'boom') {
        state.treasury = (state.treasury ?? 1000) + 500;
        state.agents.forEach((a) => {
          a.credits += 25;
          a.happiness = Math.min(100, a.happiness + 15);
        });
        eventText = 'ECONOMIC BOOM: Technological innovation grant injected 500 credits into the city treasury!';
      } else if (scenario === 'curfew') {
        state.activeEmergency = 'Civic Curfew Enacted';
        eventText = 'CIVIC DIRECTIVE: Mayor enacted nighttime security patrols and public order checks.';
      } else if (scenario === 'election') {
        // Trigger election advance
        state.day = 360;
        eventText = 'SPECIAL ELECTION: General Election Day initiated by emergency civic decree.';
      }

      if (eventText) {
        state.events.unshift({
          id: Date.now() + Math.random(),
          time: `${String(state.hour).padStart(2, '0')}:00`,
          kind: 'system',
          text: eventText,
          round: state.rounds,
        });

        if (state.sessionId !== 'fallback-session') {
          await prisma.simulationEvent.create({
            data: {
              sessionId: state.sessionId,
              time: `${String(state.hour).padStart(2, '0')}:00`,
              kind: 'system',
              text: eventText,
              round: state.rounds,
            },
          }).catch(() => null);

          await prisma.simulationSession.update({
            where: { id: state.sessionId },
            data: {
              foodPrice: state.foodPrice,
              activeEmergency: state.activeEmergency,
              treasury: state.treasury,
            },
          }).catch(() => null);
        }
      }

      return NextResponse.json({ message: `Injected scenario: ${scenario}`, state });
    }

    // 2. Resolve Complaint
    if (action === 'resolve_complaint' && complaintId) {
      await prisma.complaint.update({
        where: { id: complaintId },
        data: { status: 'addressed' },
      }).catch(() => null);

      return NextResponse.json({ message: 'Complaint marked as addressed.' });
    }

    // 3. Pardon Detainee
    if (action === 'pardon_detainee' && agentId) {
      const agent = state.agents.find((a) => a.id === agentId || a.dbId === agentId);
      if (agent) {
        agent.detainedHours = 0;
        agent.location = 'Homes';
        if (state.sessionId !== 'fallback-session' && agent.dbId) {
          await prisma.agent.update({
            where: { id: agent.dbId },
            data: { detainedHours: 0, location: 'Homes' },
          }).catch(() => null);
        }
      }
      return NextResponse.json({ message: 'Citizen pardoned and released.' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error processing civic action.' },
      { status: 500 }
    );
  }
}
