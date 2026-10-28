import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureInitialized, getState, DecisionRecord } from '@/lib/society';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 40));
    const crisisFilter = searchParams.get('crisis');

    const state = await ensureInitialized();

    // Query SQLite database for durable decision logs
    let dbLogs: any[] = [];
    if (state.sessionId !== 'fallback-session') {
      const whereClause: any = { sessionId: state.sessionId };
      if (agentId) {
        // Match either agent.id or agent.dbId
        const matchingAgent = state.agents.find((a) => a.id === agentId || a.dbId === agentId);
        if (matchingAgent?.dbId) {
          whereClause.agentId = matchingAgent.dbId;
        }
      }

      dbLogs = await prisma.decisionLog.findMany({
        where: whereClause,
        include: {
          agent: { select: { id: true, name: true, role: true, color: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }).catch(() => []);
    }

    // Merge SQLite logs with in-memory logs
    const memoryLogs = state.decisionLogs || [];

    const formattedDbLogs: DecisionRecord[] = dbLogs.map((l) => {
      let options: string[] = [];
      try {
        const parsed = JSON.parse(l.optionsConsidered || '[]');
        options = Array.isArray(parsed)
          ? parsed.map((o: any) => typeof o === 'string' ? o : `${o.option}: ${o.description}`)
          : [];
      } catch {
        options = [l.optionsConsidered];
      }

      return {
        id: l.id,
        agentId: l.agent?.id || l.agentId,
        agentName: l.agent?.name || 'Citizen',
        problemDetected: l.problemDetected,
        relevantInfo: l.relevantInfo,
        optionsConsidered: options,
        chosenAction: l.chosenAction,
        decisionReason: l.decisionReason,
        expectedOutcome: l.expectedOutcome,
        actualResult: l.actualResult,
        round: l.round,
        hour: l.hour,
        createdAt: l.createdAt.toISOString(),
      };
    });

    // Combine and deduplicate by id
    const logMap = new Map<string, DecisionRecord>();
    for (const l of memoryLogs) {
      if (l.id) logMap.set(l.id, l);
    }
    for (const l of formattedDbLogs) {
      logMap.set(l.id, l);
    }

    let combined = Array.from(logMap.values());
    if (agentId) {
      combined = combined.filter((l) => l.agentId === agentId || l.agentName.toLowerCase() === agentId.toLowerCase());
    }

    // Sort by hour/round or timestamp descending
    combined.sort((a, b) => {
      if (b.round !== a.round) return b.round - a.round;
      return b.hour - a.hour;
    });

    return NextResponse.json({
      success: true,
      logs: combined.slice(0, limit),
      totalCount: combined.length,
      activeCrises: state.activeCrises ?? [],
      cityStatus: {
        foodSupplyActive: state.foodSupplyActive ?? true,
        powerGridActive: state.powerGridActive ?? true,
        waterSupplyActive: state.waterSupplyActive ?? true,
        factorySupplyActive: state.factorySupplyActive ?? true,
        policePatrolBudget: state.policePatrolBudget ?? 100,
        crimeRisk: state.crimeRisk ?? 12,
        foodPrice: state.foodPrice ?? 8,
      },
    });
  } catch (err: any) {
    console.error('[API/observatory] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch observatory data' }, { status: 500 });
  }
}
