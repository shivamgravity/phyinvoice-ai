import { getDB } from './database';
import { WorkSession } from './types';

export const sessionRepository = {
  async getAll(): Promise<WorkSession[]> {
    const db = await getDB();
    const sessions = await db.getAll('sessions');
    return sessions.sort((a, b) => b.startTime - a.startTime);
  },

  async getById(id: string): Promise<WorkSession | undefined> {
    const db = await getDB();
    return db.get('sessions', id);
  },

  async getByProject(projectId: string): Promise<WorkSession[]> {
    const db = await getDB();
    return db.getAllFromIndex('sessions', 'by-project', projectId);
  },

  async getByClient(clientId: string): Promise<WorkSession[]> {
    const db = await getDB();
    return db.getAllFromIndex('sessions', 'by-client', clientId);
  },

  async getUnbilledByClient(clientId: string): Promise<WorkSession[]> {
    const db = await getDB();
    const all = await db.getAllFromIndex('sessions', 'by-client', clientId);
    return all.filter(s => s.isBillable && s.billedStatus === 'unbilled');
  },

  async save(session: WorkSession): Promise<void> {
    const db = await getDB();
    await db.put('sessions', session);
  },

  async updateDeliverable(id: string, deliverable: string): Promise<void> {
    const db = await getDB();
    const session = await db.get('sessions', id);
    if (session) {
      session.clientDeliverable = deliverable;
      session.updatedAt = Date.now();
      await db.put('sessions', session);
    }
  },

  async markAsInvoiced(sessionIds: string[], invoiceId: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('sessions', 'readwrite');
    for (const id of sessionIds) {
      const session = await tx.store.get(id);
      if (session) {
        session.billedStatus = 'invoiced';
        session.invoiceId = invoiceId;
        session.updatedAt = Date.now();
        await tx.store.put(session);
      }
    }
    await tx.done;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('sessions', id);
  }
};
