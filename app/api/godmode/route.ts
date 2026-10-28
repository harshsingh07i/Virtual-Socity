import { NextResponse } from 'next/server';
import {
  ensureInitialized,
  getState,
  updateGodMode,
  triggerCrisisState,
  restoreNormalState,
} from '@/lib/society';
import { simulationWorker } from '@/lib/simulation-worker';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const state = await ensureInitialized();
  return NextResponse.json({
    status: state.status,
    speed: state.speed,
    foodSupplyActive: state.foodSupplyActive ?? true,
    waterSupplyActive: state.waterSupplyActive ?? true,
    powerGridActive: state.powerGridActive ?? true,
    factorySupplyActive: state.factorySupplyActive ?? true,
    policePatrolBudget: state.policePatrolBudget ?? 100,
    crimeRisk: state.crimeRisk ?? 12,
    pollutionLevel: state.pollutionLevel ?? 10,
    foodPrice: state.foodPrice ?? 8,
    incomeTaxRate: state.incomeTaxRate ?? 10,
    salesTaxRate: state.salesTaxRate ?? 5,
    treasury: state.treasury ?? 1000,
    activeCrises: state.activeCrises ?? [],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const state = await ensureInitialized();

    let message = '';

    if (action === 'pause') {
      await simulationWorker.pause();
      message = 'Simulation paused by overseer.';
    } else if (action === 'resume') {
      await simulationWorker.resume();
      message = 'Simulation resumed by overseer.';
    } else if (action === 'set_speed') {
      const speed = Number(body.speed) || 1;
      simulationWorker.setSpeed(speed);
      state.speed = speed;
      message = `Simulation speed set to ${speed}x.`;
    } else if (action === 'toggle_supply') {
      const { supplyType, active } = body;
      const patch: any = {};
      if (supplyType === 'food') patch.foodSupplyActive = Boolean(active);
      if (supplyType === 'water') patch.waterSupplyActive = Boolean(active);
      if (supplyType === 'power') patch.powerGridActive = Boolean(active);
      if (supplyType === 'factory') patch.factorySupplyActive = Boolean(active);

      await updateGodMode(patch);
      message = `${supplyType.toUpperCase()} supply set to ${active ? 'ACTIVE' : 'DISRUPTED'}.`;
    } else if (action === 'set_patrol_budget') {
      const budget = Math.max(0, Math.min(100, Number(body.budget) ?? 100));
      await updateGodMode({ policePatrolBudget: budget });
      message = `Police patrol budget set to ${budget}%.`;
    } else if (action === 'set_taxes_prices') {
      const patch: any = {};
      if (typeof body.incomeTaxRate === 'number') patch.incomeTaxRate = Math.max(0, Math.min(50, body.incomeTaxRate));
      if (typeof body.salesTaxRate === 'number') patch.salesTaxRate = Math.max(0, Math.min(30, body.salesTaxRate));
      if (typeof body.foodPrice === 'number') patch.foodPrice = Math.max(2, Math.min(100, body.foodPrice));

      await updateGodMode(patch);
      message = 'Economic tax and price parameters updated.';
    } else if (action === 'trigger_crisis') {
      const { crisisType } = body;
      if (crisisType) {
        await triggerCrisisState(crisisType);
        message = `Emergency crisis [${crisisType.toUpperCase()}] triggered!`;
      }
    } else if (action === 'restore_normal') {
      await restoreNormalState();
      message = 'All normal city conditions restored: full utilities, 100% patrol, baseline prices.';
    } else {
      return NextResponse.json({ error: `Unknown God Mode action: ${action}` }, { status: 400 });
    }

    const updated = await getState();
    return NextResponse.json({
      success: true,
      message,
      state: updated,
    });
  } catch (err: any) {
    console.error('[API/godmode] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal God Mode error' }, { status: 500 });
  }
}
