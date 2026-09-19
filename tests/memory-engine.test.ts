import { MemoryEngine } from '../src/MemoryEngine';
import { MemoryStore } from '../src/MemoryStore';

describe('Problem 4: Trustworthy Long-Term Memory Engine', () => {
  let store: MemoryStore;
  let engine: MemoryEngine;

  beforeEach(() => {
    store = new MemoryStore();
    engine = new MemoryEngine(store);
  });

  // AC1: Store with provenance
  test('AC1: Stores memory with stable ID, timestamps, and inspectable source provenance', () => {
    const res = engine.ingest('User lives in Pune', 'location', 'user_city', 'msg_101');

    expect(res.memory.id).toBeDefined();
    expect(res.memory.state).toBe('active');
    expect(res.memory.sourceId).toBe('msg_101');
    expect(res.memory.createdAt).toBeDefined();

    const inspection = engine.inspect(res.memory.id);
    expect(inspection.memory).toBeDefined();
    expect(inspection.provenanceChain[0].sourceId).toBe('msg_101');
  });

  // AC2: Relevant retrieval with evidence
  test('AC2: Bounded retrieval returns relevant memories with explainable evidence', () => {
    engine.ingest('User lives in Pune', 'location', 'user_city', 'msg_101');
    engine.ingest('User owns a MacBook Pro', 'hardware', 'laptop', 'msg_102');

    const results = engine.retrieve('Where does the user live?', 2);

    expect(results.length).toBe(1);
    expect(results[0].memory.fact).toBe('User lives in Pune');
    expect(results[0].evidence.score).toBeGreaterThan(0);
    expect(results[0].evidence.matchedTerms).toContain('live');
    expect(results[0].evidence.rule).toBeDefined();
  });

  // AC3: Explicit correction & supersession
  test('AC3: Explicit correction supersedes old fact and links bidirectionally', () => {
    const mem1 = engine.ingest('User lives in Pune', 'location', 'user_city', 'msg_101').memory;
    const mem2 = engine.ingest('User moved to Mumbai', 'location', 'user_city', 'msg_102', true).memory;

    const storedMem1 = store.get(mem1.id);
    const storedMem2 = store.get(mem2.id);

    expect(storedMem1?.state).toBe('superseded');
    expect(storedMem1?.supersededBy).toBe(mem2.id);
    expect(storedMem2?.state).toBe('active');
    expect(storedMem2?.supersedes).toBe(mem1.id);

    const retrieval = engine.retrieve('Where does user live?');
    expect(retrieval.map(r => r.memory.fact)).toContain('User moved to Mumbai');
    expect(retrieval.map(r => r.memory.fact)).not.toContain('User lives in Pune');
  });

  // AC4: Uncertain contradiction
  test('AC4: Uncertain contradiction coexists conservatively without destroying history', () => {
    engine.ingest('User works remotely on Mondays', 'schedule', 'remote_days', 'msg_201');
    engine.ingest('User might come to office on Monday', 'schedule', 'remote_days', 'msg_202', false);

    const active = store.findByEntityKey('remote_days');
    expect(active.length).toBe(2);
    expect(active.some(m => m.isAmbiguous)).toBe(true);
  });

  // AC5: Deletion semantics
  test('AC5: Soft deletion prevents memory from appearing in retrieval while retaining record', () => {
    const mem = engine.ingest('User drives a Creta car', 'vehicle', 'user_car', 'msg_301').memory;
    
    const deleted = engine.deleteMemory(mem.id);
    expect(deleted).toBe(true);

    const results = engine.retrieve('What car does the user drive?');
    expect(results.length).toBe(0);

    const inspection = engine.inspect(mem.id);
    expect(inspection.memory?.state).toBe('deleted');
  });

  // AC6: Deterministic execution
  test('AC6: Repeated queries produce identical scores and order', () => {
    engine.ingest('User practices intermittent fasting', 'diet', 'fasting', 'msg_401');
    
    const run1 = engine.retrieve('intermittent fasting');
    const run2 = engine.retrieve('intermittent fasting');

    expect(run1).toEqual(run2);
  });
});