export type LifecycleState = 'active' | 'superseded' | 'deleted';

export type ResolutionPolicy = 'explicit_supersede' | 'ambiguous_coexist' | 'rejected';

export interface Memory {
  id: string;
  fact: string;
  topic: string;
  entityKey: string;
  sourceId: string;
  createdAt: string;
  updatedAt: string;
  state: LifecycleState;
  supersededBy?: string;
  supersedes?: string;
  isAmbiguous?: boolean;
}

export interface RetrievalEvidence {
  score: number;
  matchedTerms: string[];
  matchedEntityKey: boolean;
  rule: string;
}

export interface RetrievalResult {
  memory: Memory;
  evidence: RetrievalEvidence;
}

export interface IngestionResult {
  memory: Memory;
  supersededMemory?: Memory;
  status: 'created' | 'superseded' | 'coexisting_ambiguity';
}