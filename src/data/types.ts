export type BillingRoundingRule = 'exact' | '6min' | '15min';

export type BillingType = 'hourly' | 'fixed' | 'non_billable';

export type BilledStatus = 'unbilled' | 'invoiced' | 'paid';

export type ClassificationStatus = 'pending' | 'assigned' | 'needs_review' | 'unclassified';

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  currency: string; // e.g. 'USD', 'EUR', 'GBP', 'INR'
  defaultHourlyRate: number;
  roundingRule: BillingRoundingRule;
  paymentTermsDays: number; // e.g. 14, 30
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  billingType: BillingType;
  hourlyRate: number;
  budgetHours?: number;
  budgetAmount?: number;
  isArchived?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkSession {
  id: string;
  description: string;
  clientDeliverable?: string; // Synthesized by Google Gemma
  startTime: number;
  endTime: number | null;
  duration: number; // in seconds
  roundedDuration: number; // in seconds after applying client/project rounding rule
  
  projectId: string | null;
  clientId: string | null;
  isBillable: boolean;
  billedStatus: BilledStatus;
  invoiceId?: string;

  classificationStatus: ClassificationStatus;
  classificationConfidence: number | null;
  embedding: number[] | null;

  createdAt: number;
  updatedAt: number;
}

export interface InvoiceItem {
  id: string;
  sessionId?: string;
  date: number;
  description: string; // Polished deliverable
  hours: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  issueDate: number;
  dueDate: number;
  currency: string;
  items: InvoiceItem[];
  totalHours: number;
  subtotal: number;
  taxRate: number; // percentage, e.g. 10 for 10%
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  status: 'draft' | 'issued' | 'paid';
  sessionIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ScopeRiskAssessment {
  projectId: string;
  projectName: string;
  clientName: string;
  budgetHours: number;
  loggedHours: number;
  projectedTotalHours: number;
  projectedOverrunHours: number;
  hourlyRate: number;
  projectedRevenueLoss: number; // Unbilled leakage if fixed fee or rejected
  riskScore: number; // 0 - 100
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  recommendations: string[];
}

export interface ClassificationFeedback {
  id: string;
  sessionId: string;
  previousProjectId: string | null;
  correctedProjectId: string;
  createdAt: number;
}
