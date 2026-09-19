
import { MemoryEngine } from './MemoryEngine';
import { MemoryStore } from './MemoryStore';

// ANSI Color Codes for beautiful terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const printHeader = (text: string) => {
  console.log(`\n${colors.bright}${colors.blue}========== ${text} ==========${colors.reset}\n`);
};

const store = new MemoryStore();
const engine = new MemoryEngine(store);

printHeader('DEMO 1: INGESTING INITIAL MEMORY (AC1)');
const m1 = engine.ingest('User lives in Pune', 'location', 'user_city', 'chat_msg_001');
console.log(`${colors.green}✔ Memory Stored Successfully${colors.reset}`);
console.table([{ 
  ID: m1.memory.id.split('-')[0] + '...', 
  Fact: m1.memory.fact, 
  State: m1.memory.state,
  Source: m1.memory.sourceId 
}]);

printHeader('DEMO 2: QUERYING CONTEXT (AC2)');
const query1 = 'Where does the user live?';
console.log(`${colors.cyan}Query:${colors.reset} "${query1}"`);
let results = engine.retrieve(query1);
console.log(`${colors.green}✔ Retrieved Best Match:${colors.reset} ${results[0].memory.fact}`);
console.log(`${colors.yellow}Explanation Evidence:${colors.reset}`);
console.table([{
  Score: results[0].evidence.score,
  MatchedTerms: results[0].evidence.matchedTerms.join(', '),
  Rule: results[0].evidence.rule
}]);

printHeader('DEMO 3: EXPLICIT CORRECTION (AC3)');
console.log(`${colors.cyan}User says:${colors.reset} "I moved to Mumbai"`);
const m2 = engine.ingest('User moved to Mumbai', 'location', 'user_city', 'chat_msg_002', true);
console.log(`${colors.green}✔ New Fact Stored:${colors.reset} ${m2.memory.fact}`);

const inspection = engine.inspect(m1.memory.id);
console.log(`${colors.magenta}Old Record (Pune) State updated to:${colors.reset} ${inspection.memory?.state}`);
console.log(`${colors.yellow}Provenance Chain (Audit Trail):${colors.reset}`);
console.table(inspection.provenanceChain.map(m => ({
  Fact: m.fact,
  State: m.state,
  Time: new Date(m.createdAt).toLocaleTimeString()
})));

printHeader('DEMO 4: VERIFY OUTDATED FACT EXCLUDED');
console.log(`${colors.cyan}Query:${colors.reset} "${query1}"`);
results = engine.retrieve(query1);
console.log(`${colors.green}✔ Current Results (Pune is hidden):${colors.reset}`);
console.table(results.map(r => ({ Fact: r.memory.fact, Score: r.evidence.score })));

printHeader('DEMO 5: SOFT DELETION (AC5)');
console.log(`${colors.cyan}Action:${colors.reset} Deleting Mumbai memory...`);
engine.deleteMemory(m2.memory.id);
console.log(`${colors.green}✔ Memory Soft Deleted.${colors.reset}`);

results = engine.retrieve(query1);
console.log(`Results found after deletion: ${colors.bright}${results.length}${colors.reset}`);
console.log('\n');