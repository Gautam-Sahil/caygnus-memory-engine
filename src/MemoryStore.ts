import { Memory } from './types';

export class MemoryStore {
  private memories: Map<string, Memory> = new Map();

  save(memory: Memory): void {
    this.memories.set(memory.id, { ...memory });
  }

  get(id: string): Memory | undefined {
    return this.memories.get(id);
  }

  getAll(): Memory[] {
    return Array.from(this.memories.values());
  }

  getAllActive(): Memory[] {
    return Array.from(this.memories.values()).filter(m => m.state === 'active');
  }

  findByEntityKey(entityKey: string): Memory[] {
    return Array.from(this.memories.values()).filter(
      m => m.entityKey === entityKey && m.state === 'active'
    );
  }

  getProvenanceChain(id: string): Memory[] {
    const chain: Memory[] = [];
    let current = this.memories.get(id);

    while (current) {
      chain.push(current);
      if (!current.supersedes) break;
      current = this.memories.get(current.supersedes);
    }
    return chain;
  }

  clear(): void {
    this.memories.clear();
  }
}