/**
 * Comprehensive Civic Systems & Autonomous Society Test Suite
 * Tests Phase 2, 3, 4, 5, and 6
 */

import { BUILDINGS_LIST } from '../components/city/CityScene';
import {
  processEconomyTick,
  processGovernanceAndElections,
  processLegalSystem,
  processInfrastructure,
} from '../lib/city-systems';
import { createSession, resetActiveSession, getState, stepSimulation } from '../lib/society';
import { prisma } from '../lib/prisma';

let passed = 0;
let failed = 0;

function assert(desc: string, condition: boolean) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${desc}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${desc}`);
  }
}

async function runTests() {
  console.log('=== AI VIRTUAL SOCIETY 2.0: CIVIC & AUTONOMOUS SYSTEMS TEST ===\n');

  // TEST SUITE 1: Visual City Map & Infrastructure Node Definitions (Phase 2)
  console.log('--- TEST SUITE 1: City Map & Infrastructure (24+ Buildings) ---');
  assert('Has at least 24 buildings', BUILDINGS_LIST.length >= 24);
  assert(`Contains all 32 civic & residential buildings (actual: ${BUILDINGS_LIST.length})`, BUILDINGS_LIST.length === 32);

  const categories = new Set(BUILDINGS_LIST.map((b) => b.category));
  assert('Contains housing category', categories.has('housing'));
  assert('Contains government category', categories.has('government'));
  assert('Contains justice category', categories.has('justice'));
  assert('Contains economy category', categories.has('economy'));
  assert('Contains services category', categories.has('services'));

  const cityHall = BUILDINGS_LIST.find((b) => b.type === 'government');
  assert('City Hall exists', cityHall !== undefined && cityHall.name.includes('City Hall'));

  const policeHQ = BUILDINGS_LIST.find((b) => b.type === 'police');
  assert('Police Station exists', policeHQ !== undefined);

  const bank = BUILDINGS_LIST.find((b) => b.type === 'bank');
  assert('Bank exists', bank !== undefined);

  const hospital = BUILDINGS_LIST.find((b) => b.type === 'hospital');
  assert('Hospital exists', hospital !== undefined);

  const residentialHouses = BUILDINGS_LIST.filter((b) => b.type === 'house');
  assert('Has 10 residential pods for 10 citizens', residentialHouses.length === 10);

  const apartments = BUILDINGS_LIST.filter((b) => b.type === 'apartments');
  assert('Has 2 high-density apartment blocks', apartments.length === 2);

  // Check no overlaps
  let overlaps = 0;
  for (let i = 0; i < BUILDINGS_LIST.length; i++) {
    for (let j = i + 1; j < BUILDINGS_LIST.length; j++) {
      const b1 = BUILDINGS_LIST[i];
      const b2 = BUILDINGS_LIST[j];
      const dist = Math.hypot(b1.x - b2.x, b1.y - b2.y);
      if (dist < 35) {
        overlaps++;
        console.warn(`  Overlap warning: ${b1.name} and ${b2.name} are only ${dist.toFixed(1)}px apart`);
      }
    }
  }
  assert('Zero overlapping buildings on the island map', overlaps === 0);

  // TEST SUITE 2: Economy & Real Financial Ledger (Phase 3)
  console.log('\n--- TEST SUITE 2: Real Economy & Financial Ledger ---');
  const session = await createSession('Civic Test Run');
  assert('Session created in SQLite', session.sessionId !== 'fallback-session');

  // Mock mock state for wage processing
  session.hour = 10; // working hour
  session.agents[0].lastAction = 'worked as a builder and earned 16 credits';
  const initialCredits = session.agents[0].credits;
  const initialTreasury = session.treasury ?? 1200;

  const econResult = await processEconomyTick(session, prisma);
  assert('Net salary added to citizen credits', session.agents[0].credits > initialCredits);
  assert('City treasury collected income tax', (session.treasury ?? 0) >= initialTreasury);
  assert('Transaction logged in result', econResult.transactions.length > 0);

  // Verify SQLite persistence of transaction
  const dbTx = await prisma.transaction.findFirst({
    where: { sessionId: session.sessionId },
  });
  assert('Transaction persisted into SQLite Transaction table', dbTx !== null);

  // TEST SUITE 3: Democratic Government & Annual Election (Phase 4)
  console.log('\n--- TEST SUITE 3: Democratic Government & Annual Election ---');
  // Day 350 Nominations
  const nomResult = await processGovernanceAndElections(session, 350, 9, 1, prisma);
  assert('Nominations announced on Day 350', nomResult.events.some((e) => e.text.includes('Nominations')));

  // Day 356 Campaigning
  const campResult = await processGovernanceAndElections(session, 356, 9, 1, prisma);
  assert('Campaign week announced on Day 356', campResult.events.some((e) => e.text.includes('Campaign')));

  // Day 360 Voting Day
  const voteResult = await processGovernanceAndElections(session, 360, 9, 1, prisma);
  assert('Election held on Day 360', voteResult.events.some((e) => e.text.includes('ELECTION RESULTS CERTIFIED')));
  assert('Mayor assigned', typeof session.mayorName === 'string');

  const dbElection = await prisma.election.findFirst({
    where: { sessionId: session.sessionId, year: 1 },
  });
  assert('Election result recorded in SQLite Election table', dbElection !== null && dbElection.status === 'concluded');
  assert('Voter turnout equals living citizen count', dbElection?.turnout === session.agents.filter((a) => a.alive).length);

  // Day 1 Inauguration
  const inauResult = await processGovernanceAndElections(session, 1, 9, 2, prisma);
  assert('Inauguration held on Day 1 of new year', inauResult.events.some((e) => e.text.includes('Inauguration Ceremony')));

  // TEST SUITE 4: Police & Legal System (Phase 5)
  console.log('\n--- TEST SUITE 4: Police & Legal System ---');
  // Detain an agent for testing
  session.agents[1].detainedHours = 1;
  session.agents[1].location = 'Detention';

  const lawResult = await processLegalSystem(session, 12, prisma);
  assert('Sentence served decrements detainedHours to 0', session.agents[1].detainedHours === 0);
  assert('Citizen returned to Homes upon release', session.agents[1].location === 'Homes');
  assert('Release event generated', lawResult.events.some((e) => e.text.includes('completed their sentence')));

  const dbLegal = await prisma.legalIncident.findFirst({
    where: { sessionId: session.sessionId },
  });
  assert('Legal incident recorded in SQLite LegalIncident table', dbLegal !== null);

  // TEST SUITE 5: Problem Detection & Infrastructure (Phase 6)
  console.log('\n--- TEST SUITE 5: Infrastructure & Problem Detection ---');
  const infraResult = await processInfrastructure(session, 6, prisma);
  assert('Infrastructure process completed cleanly', Array.isArray(infraResult.events));

  // TEST SUITE 6: Simulation Step Full Integration
  console.log('\n--- TEST SUITE 6: Simulation Worker Step Integration ---');
  const beforeStep = await getState();
  const stepped = await stepSimulation();
  assert('Stepped simulation successfully', stepped !== null);
  assert('Hour advanced by 1', stepped.hour === (beforeStep.hour + 1) % 24);

  // Summary
  console.log(`\n========================================`);
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test script crashed:', e);
  process.exit(1);
});
