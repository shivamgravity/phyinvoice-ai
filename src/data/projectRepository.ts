import { getDB } from './database';
import { Project } from './types';

export const projectRepository = {
  async getAll(): Promise<Project[]> {
    const db = await getDB();
    const projects = await db.getAll('projects');
    return projects.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getById(id: string): Promise<Project | undefined> {
    const db = await getDB();
    return db.get('projects', id);
  },

  async getByClient(clientId: string): Promise<Project[]> {
    const db = await getDB();
    return db.getAllFromIndex('projects', 'by-client', clientId);
  },

  async save(project: Project): Promise<void> {
    const db = await getDB();
    await db.put('projects', project);
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('projects', id);
  }
};
