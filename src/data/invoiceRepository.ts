import { getDB } from './database';
import { Invoice } from './types';

export const invoiceRepository = {
  async getAll(): Promise<Invoice[]> {
    const db = await getDB();
    const invoices = await db.getAll('invoices');
    return invoices.sort((a, b) => b.issueDate - a.issueDate);
  },

  async getById(id: string): Promise<Invoice | undefined> {
    const db = await getDB();
    return db.get('invoices', id);
  },

  async getByClient(clientId: string): Promise<Invoice[]> {
    const db = await getDB();
    return db.getAllFromIndex('invoices', 'by-client', clientId);
  },

  async save(invoice: Invoice): Promise<void> {
    const db = await getDB();
    await db.put('invoices', invoice);
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('invoices', id);
  }
};
