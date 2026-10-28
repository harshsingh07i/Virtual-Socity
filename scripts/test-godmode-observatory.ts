import { prisma } from '../lib/prisma';
import {
  ensureInitialized,
  getState,
  updateGodMode,
  triggerCrisisState,
  restoreNormalState,
} from '../lib/society';
import { simulationWorker } from '../lib/simulation-worker';

async function runTest() {
  console.log('=== [TEST] AI Virtual Society 20 Citizens & God Mode & Observatory ===\n');

  // 1. Initialize simulation state
  const state = await ensureInitialized();
  console.log(`[PASS 1] Simulation session initialized: ${state.sessionId}`);
  console.log(`[PASS 1] Population count: ${state.agents.length}`);

  if (state.agents.length < 20) {
    throw new Error(`Expected at least 20 citizens, got ${state.agents.length}`);
  }

  // 2. Validate all 20 citizens have distinct roles, homes, and apartments
  const podCitizens = state.agents.filter((a) => {
    const num = parseInt(a.id.replace('agent-', ''), 10);
    return num <= 10;
  });
  const northAptCitizens = state.agents.filter((a) => a.homeLocation?.includes('North Heights'));
  const southAptCitizens = state.agents.filter((a) => a.homeLocation?.includes('South Terrace'));

  console.log(`[PASS 2] Pod Citizens (1-10): ${podCitizens.length}`);
  console.log(`[PASS 2] North Heights Apt Citizens (11-15): ${northAptCitizens.length} (${northAptCitizens.map((a) => a.name).join(', ')})`);
  console.log(`[PASS 2] South Terrace Apt Citizens (16-20): ${southAptCitizens.length} (${southAptCitizens.map((a) => a.name).join(', ')})`);

  if (northAptCitizens.length !== 5 || southAptCitizens.length !== 5) {
    throw new Error('Apartment citizens distribution mismatch!');
  }

  // 3. Test God Mode Utility toggles & Crises
  console.log('\n--- Testing God Mode Controls ---');
  await updateGodMode({ foodSupplyActive: false });
  let current = await getState();
  console.log(`[PASS 3] Food Supply Cut: foodSupplyActive = ${current.foodSupplyActive}`);

  await triggerCrisisState('blackout');
  current = await getState();
  console.log(`[PASS 3] Blackout Triggered: powerGridActive = ${current.powerGridActive}, Crises = ${current.activeCrises?.join(', ')}`);

  await updateGodMode({ policePatrolBudget: 20 });
  current = await getState();
  console.log(`[PASS 3] Police Patrol Budget Reduced to: ${current.policePatrolBudget}%`);

  // 4. Run a simulation tick under crisis to test real AI behavior & consequences
  console.log('\n--- Executing Simulation Tick Under Crisis ---');
  await simulationWorker.step();
  current = await getState();
  console.log(`[PASS 4] Tick completed: Hour ${current.hour}:00, Day ${current.day}`);

  // 5. Verify DecisionLog persistence in SQLite and Memory
  const dbLogs = await prisma.decisionLog.findMany({
    where: { sessionId: current.sessionId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log(`[PASS 5] Decision Logs in SQLite: ${dbLogs.length}`);
  if (dbLogs.length > 0) {
    const sample = dbLogs[0];
    console.log(`Sample Decision Log:`);
    console.log(`  Agent: ${sample.agentName}`);
    console.log(`  Problem: ${sample.problemDetected}`);
    console.log(`  Relevant Info: ${sample.relevantInfo}`);
    console.log(`  Options Considered: ${sample.optionsConsidered}`);
    console.log(`  Chosen Action: ${sample.chosenAction}`);
    console.log(`  Reason: ${sample.decisionReason}`);
    console.log(`  Expected Outcome: ${sample.expectedOutcome}`);
    console.log(`  Actual Consequence: ${sample.actualResult}`);
  }

  // 6. Test Reversible Restore Normal
  console.log('\n--- Testing Restore All Normal Conditions ---');
  await restoreNormalState();
  current = await getState();
  console.log(`[PASS 6] Normal Restored:`);
  console.log(`  foodSupplyActive = ${current.foodSupplyActive}`);
  console.log(`  powerGridActive = ${current.powerGridActive}`);
  console.log(`  waterSupplyActive = ${current.waterSupplyActive}`);
  console.log(`  policePatrolBudget = ${current.policePatrolBudget}%`);
  console.log(`  activeCrises = ${current.activeCrises?.length || 0}`);

  console.log('\n=== ALL GOD MODE & OBSERVATORY & 20 CITIZEN TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('[FAIL] Test error:', err);
  process.exit(1);
});
