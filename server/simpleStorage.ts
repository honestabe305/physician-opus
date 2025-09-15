// Simple storage factory that ensures production works
import { MemoryStorage } from './memoryStorage';
import type { IStorage } from './storage';

export function createStorage(): IStorage {
  console.log('💾 Using in-memory storage for production deployment');
  return new MemoryStorage();
}

export type { IStorage } from './storage';