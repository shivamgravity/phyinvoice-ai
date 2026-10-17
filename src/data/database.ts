import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { WorkSession, Project, Client, Invoice, ClassificationFeedback } from './types';

const DB_NAME = 'phyinvoice_db';
const DB_VERSION = 1;

interface PhyInvoiceDB extends DBSchema {
  sessions: {
    key: string;
    value: WorkSession;
    indexes: {
      'by-project': string;
      'by-client': string;
      'by-start-time': number;
      'by-billed-status': string;
    };
  };
  projects: {
    key: string;
    value: Project;
    indexes: {
      'by-client': string;
    };
  };
  clients: {
    key: string;
    value: Client;
  };
  invoices: {
    key: string;
    value: Invoice;
    indexes: {
      'by-client': string;
      'by-issue-date': number;
    };
  };
  feedback: {
    key: string;
    value: ClassificationFeedback;
    indexes: {
      'by-session': string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<PhyInvoiceDB>> | null = null;

export const getDB = (): Promise<IDBPDatabase<PhyInvoiceDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<PhyInvoiceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Sessions
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-project', 'projectId');
          sessionStore.createIndex('by-client', 'clientId');
          sessionStore.createIndex('by-start-time', 'startTime');
          sessionStore.createIndex('by-billed-status', 'billedStatus');
        }

        // Projects
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('by-client', 'clientId');
        }

        // Clients
        if (!db.objectStoreNames.contains('clients')) {
          db.createObjectStore('clients', { keyPath: 'id' });
        }

        // Invoices
        if (!db.objectStoreNames.contains('invoices')) {
          const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id' });
          invoiceStore.createIndex('by-client', 'clientId');
          invoiceStore.createIndex('by-issue-date', 'issueDate');
        }

        // Feedback
        if (!db.objectStoreNames.contains('feedback')) {
          const feedbackStore = db.createObjectStore('feedback', { keyPath: 'id' });
          feedbackStore.createIndex('by-session', 'sessionId');
        }
      },
    });
  }
  return dbPromise;
};

// Seed default initial data if database is empty
export async function seedInitialDataIfEmpty(): Promise<void> {
  const db = await getDB();
  const clientCount = await db.count('clients');
  if (clientCount > 0) return;

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const HOUR_MS = 60 * 60 * 1000;

  // 1. Seed Clients
  const client1: Client = {
    id: 'client-acme',
    name: 'Sarah Connor',
    email: 'sarah@acmelabs.io',
    company: 'Acme Labs Inc.',
    currency: 'USD',
    defaultHourlyRate: 85,
    roundingRule: '15min',
    paymentTermsDays: 14,
    createdAt: now - 14 * DAY_MS,
    updatedAt: now - 14 * DAY_MS,
  };

  const client2: Client = {
    id: 'client-nexus',
    name: 'Marcus Brody',
    email: 'marcus@nexusdesign.co',
    company: 'Nexus Design Studio',
    currency: 'USD',
    defaultHourlyRate: 95,
    roundingRule: '6min',
    paymentTermsDays: 30,
    createdAt: now - 10 * DAY_MS,
    updatedAt: now - 10 * DAY_MS,
  };

  await db.put('clients', client1);
  await db.put('clients', client2);

  // 2. Seed Projects
  // Project 1: Approaching scope creep (Budget 25 hrs, has 23.5 logged hrs, lots of variance)
  const project1: Project = {
    id: 'proj-acme-portal',
    clientId: 'client-acme',
    name: 'Customer Portal & Auth System',
    billingType: 'hourly',
    hourlyRate: 85,
    budgetHours: 25,
    budgetAmount: 2125,
    createdAt: now - 12 * DAY_MS,
    updatedAt: now,
  };

  const project2: Project = {
    id: 'proj-nexus-shopify',
    clientId: 'client-nexus',
    name: 'Shopify Checkout Optimization',
    billingType: 'hourly',
    hourlyRate: 95,
    budgetHours: 15,
    budgetAmount: 1425,
    createdAt: now - 8 * DAY_MS,
    updatedAt: now,
  };

  await db.put('projects', project1);
  await db.put('projects', project2);

  // 3. Seed Realistic Sessions
  const sampleSessions: WorkSession[] = [
    {
      id: 'sess-1',
      description: 'debugging JWT refresh token expiry race condition in safari browser',
      clientDeliverable: 'Resolved asynchronous JWT authentication token refresh race condition on WebKit/Safari viewports.',
      startTime: now - 3 * DAY_MS - 4 * HOUR_MS,
      endTime: now - 3 * DAY_MS - 2 * HOUR_MS,
      duration: 7200, // 2 hours
      roundedDuration: 7200,
      projectId: 'proj-acme-portal',
      clientId: 'client-acme',
      isBillable: true,
      billedStatus: 'unbilled',
      classificationStatus: 'assigned',
      classificationConfidence: 0.94,
      embedding: null,
      createdAt: now - 3 * DAY_MS - 4 * HOUR_MS,
      updatedAt: now - 3 * DAY_MS - 2 * HOUR_MS,
    },
    {
      id: 'sess-2',
      description: 'unplanned client emergency: investigated Apple Pay sandbox certificates per Slack thread',
      clientDeliverable: 'Investigated and reconfigured Apple Pay Merchant ID domain verification and merchant certificates.',
      startTime: now - 2 * DAY_MS - 6 * HOUR_MS,
      endTime: now - 2 * DAY_MS - 3 * HOUR_MS,
      duration: 10800, // 3 hours
      roundedDuration: 10800,
      projectId: 'proj-acme-portal',
      clientId: 'client-acme',
      isBillable: true,
      billedStatus: 'unbilled',
      classificationStatus: 'assigned',
      classificationConfidence: 0.88,
      embedding: null,
      createdAt: now - 2 * DAY_MS - 6 * HOUR_MS,
      updatedAt: now - 2 * DAY_MS - 3 * HOUR_MS,
    },
    {
      id: 'sess-3',
      description: 'refactored PostgreSQL order query latency and added composite index',
      clientDeliverable: 'Optimized high-traffic orders database queries, deploying composite indices to eliminate table scan bottlenecks.',
      startTime: now - 2 * DAY_MS - 2 * HOUR_MS,
      endTime: now - 2 * DAY_MS - 30 * 60 * 1000,
      duration: 5400, // 1.5 hours
      roundedDuration: 5400,
      projectId: 'proj-acme-portal',
      clientId: 'client-acme',
      isBillable: true,
      billedStatus: 'unbilled',
      classificationStatus: 'assigned',
      classificationConfidence: 0.91,
      embedding: null,
      createdAt: now - 2 * DAY_MS - 2 * HOUR_MS,
      updatedAt: now - 2 * DAY_MS - 30 * 60 * 1000,
    },
    {
      id: 'sess-4',
      description: 'extra revisions: tweaking dark mode button contrast and border radius per client request',
      clientDeliverable: 'Refined UI component styling system, ensuring WCAG 2.1 AA compliance for dark mode contrast ratios.',
      startTime: now - 1 * DAY_MS - 5 * HOUR_MS,
      endTime: now - 1 * DAY_MS - 2 * HOUR_MS,
      duration: 10800, // 3 hours
      roundedDuration: 10800,
      projectId: 'proj-acme-portal',
      clientId: 'client-acme',
      isBillable: true,
      billedStatus: 'unbilled',
      classificationStatus: 'assigned',
      classificationConfidence: 0.85,
      embedding: null,
      createdAt: now - 1 * DAY_MS - 5 * HOUR_MS,
      updatedAt: now - 1 * DAY_MS - 2 * HOUR_MS,
    },
    {
      id: 'sess-5',
      description: 'audited Shopify liquid cart templates and eliminated layout shift during add-to-cart',
      clientDeliverable: 'Remediated Cumulative Layout Shift (CLS) regressions in Shopify cart templates to improve Core Web Vitals.',
      startTime: now - 1 * DAY_MS - 8 * HOUR_MS,
      endTime: now - 1 * DAY_MS - 6 * HOUR_MS,
      duration: 7200, // 2 hours
      roundedDuration: 7200,
      projectId: 'proj-nexus-shopify',
      clientId: 'client-nexus',
      isBillable: true,
      billedStatus: 'unbilled',
      classificationStatus: 'assigned',
      classificationConfidence: 0.96,
      embedding: null,
      createdAt: now - 1 * DAY_MS - 8 * HOUR_MS,
      updatedAt: now - 1 * DAY_MS - 6 * HOUR_MS,
    },
    {
      id: 'sess-6',
      description: 'configured webhook listener for order fulfillment updates and added signature verification',
      clientDeliverable: 'Implemented HMAC-SHA256 signature verification pipeline for Shopify webhooks to prevent spoofed callbacks.',
      startTime: now - 4 * HOUR_MS,
      endTime: now - 2 * HOUR_MS,
      duration: 7200, // 2 hours
      roundedDuration: 7200,
      projectId: 'proj-nexus-shopify',
      clientId: 'client-nexus',
      isBillable: true,
      billedStatus: 'unbilled',
      classificationStatus: 'assigned',
      classificationConfidence: 0.93,
      embedding: null,
      createdAt: now - 4 * HOUR_MS,
      updatedAt: now - 2 * HOUR_MS,
    }
  ];

  for (const sess of sampleSessions) {
    await db.put('sessions', sess);
  }
}
