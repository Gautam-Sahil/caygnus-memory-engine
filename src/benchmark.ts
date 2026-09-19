import * as fs from 'fs';
import * as path from 'path';
import { MemoryEngine } from './MemoryEngine';
import { MemoryStore } from './MemoryStore';

interface BenchmarkData {
  memories: Array<{
    id: string;
    fact: string;
    topic: string;
    entityKey: string;
    sourceId: string;
    supersedes?: string;
    isAmbiguous?: boolean;
  }>;
  deletions: string[];
  queries: Array<{
    id: string;
    query: string;
    expectIncluded: string[];
    expectExcluded: string[];
  }>;
}

export function runBenchmark(): boolean {
  const fixturePath = path.join(__dirname, '../fixtures/benchmark-dataset.json');
  const rawData = fs.readFileSync(fixturePath, 'utf-8');
  const fixture: BenchmarkData = JSON.parse(rawData);

  const store = new MemoryStore();
  const engine = new MemoryEngine(store);

  const idMap: Map<string, string> = new Map();

  for (const item of fixture.memories) {
    const isExplicit = Boolean(item.supersedes);
    const res = engine.ingest(
      item.fact,
      item.topic,
      item.entityKey,
      item.sourceId,
      isExplicit
    );
    idMap.set(item.id, res.memory.id);

    if (item.supersedes && res.supersededMemory) {
      idMap.set(item.supersedes, res.supersededMemory.id);
    }
  }

  for (const delId of fixture.deletions) {
    const actualId = idMap.get(delId);
    if (actualId) {
      engine.deleteMemory(actualId);
    }
  }

  let passedQueries = 0;
  const totalQueries = fixture.queries.length;
  let allPass = true;

  console.log('\n======================================================');
  console.log('       CAYGNUS MEMORY ENGINE VERIFICATION BENCHMARK    ');
  console.log('======================================================\n');

  for (const q of fixture.queries) {
    const results = engine.retrieve(q.query, 5, 0.1);
    const retrievedIds = results.map(r => r.memory.id);

    let queryPassed = true;
    const failures: string[] = [];

    for (const expInc of q.expectIncluded) {
      const realId = idMap.get(expInc);
      if (!realId || !retrievedIds.includes(realId)) {
        queryPassed = false;
        failures.push(`Missing expected memory [${expInc}]`);
      }
    }

    for (const expExc of q.expectExcluded) {
      const realId = idMap.get(expExc);
      if (realId && retrievedIds.includes(realId)) {
        queryPassed = false;
        failures.push(`Leaked excluded memory [${expExc}]`);
      }
    }

    if (queryPassed) {
      passedQueries++;
      console.log(`[PASS] ${q.id}: "${q.query}"`);
    } else {
      allPass = false;
      console.error(`[FAIL] ${q.id}: "${q.query}"`);
      failures.forEach(f => console.error(`       -> ${f}`));
    }
  }

  console.log('\n------------------------------------------------------');
  console.log(`Results: ${passedQueries}/${totalQueries} queries passed.`);
  console.log(`Status:  ${allPass ? 'PASSED (100% Deterministic)' : 'FAILED'}`);
  console.log('------------------------------------------------------\n');

  return allPass;
}

if (require.main === module) {
  const success = runBenchmark();
  process.exit(success ? 0 : 1);
}