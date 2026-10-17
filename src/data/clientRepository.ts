import { getDB } from './database';
import { Client } from './types';

export const clientRepository = {
  async getAll(): Promise<Client[]> {
    const db = await getDB();
    const clients = await db.getAll('clients');
    return clients.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getById(id: string): Promise<Client | undefined> {
    const db = await getDB();
    return db.get('clients', id);
  },

  async save(client: Client): Promise<void> {
    const db = await getDB();
    await db.put('clients', client);
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('clients', id);
  }
};
