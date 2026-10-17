import { BillingRoundingRule, WorkSession, Project, Client } from '../data/types';

/**
 * Rounds a duration in seconds based on the specified billing rounding rule:
 * - 'exact': returns exact seconds
 * - '6min': rounds UP to nearest 6 minutes (360 seconds / 0.1h), standard agency/legal tenth-hour
 * - '15min': rounds UP to nearest 15 minutes (900 seconds / 0.25h), standard freelance quarter-hour
 */
export function roundDuration(seconds: number, rule: BillingRoundingRule): number {
  if (seconds <= 0) return 0;
  
  if (rule === '6min') {
    const increment = 6 * 60; // 360 seconds
    return Math.ceil(seconds / increment) * increment;
  }
  
  if (rule === '15min') {
    const increment = 15 * 60; // 900 seconds
    return Math.ceil(seconds / increment) * increment;
  }
  
  return seconds;
}

/**
 * Converts seconds to billable decimal hours (e.g. 5400s -> 1.5h), rounded to 2 decimal places.
 */
export function secondsToHours(seconds: number): number {
  return Number((seconds / 3600).toFixed(2));
}

export interface ProjectFinancialSummary {
  projectId: string;
  projectName: string;
  clientName: string;
  hourlyRate: number;
  budgetHours: number;
  budgetAmount: number;
  actualLoggedSeconds: number;
  roundedBillableSeconds: number;
  actualHours: number;
  billableHours: number;
  billableAmount: number;
  unbilledHours: number;
  unbilledAmount: number;
  effectiveHourlyRate: number; // billableAmount / actualHours
  budgetUsedPercent: number;
}

export interface GlobalFinancialMetrics {
  totalLoggedHours: number;
  totalBillableHours: number;
  totalBillableRevenue: number;
  totalUnbilledRevenue: number;
  overallEffectiveHourlyRate: number;
  activeProjectsCount: number;
  projectSummaries: ProjectFinancialSummary[];
}

export function calculateFinancialMetrics(
  sessions: WorkSession[],
  projects: Project[],
  clients: Client[]
): GlobalFinancialMetrics {
  const clientMap = new Map<string, Client>(clients.map(c => [c.id, c]));
  const projectMap = new Map<string, Project>(projects.map(p => [p.id, p]));

  const projectSummariesMap = new Map<string, {
    actualSeconds: number;
    billableSeconds: number;
    unbilledSeconds: number;
  }>();

  for (const p of projects) {
    projectSummariesMap.set(p.id, {
      actualSeconds: 0,
      billableSeconds: 0,
      unbilledSeconds: 0,
    });
  }

  for (const session of sessions) {
    if (!session.projectId) continue;
    const summary = projectSummariesMap.get(session.projectId);
    if (!summary) continue;

    summary.actualSeconds += session.duration;
    if (session.isBillable) {
      summary.billableSeconds += (session.roundedDuration || session.duration);
      if (session.billedStatus === 'unbilled') {
        summary.unbilledSeconds += (session.roundedDuration || session.duration);
      }
    }
  }

  let totalLoggedSec = 0;
  let totalBillableSec = 0;
  let totalBillableRev = 0;
  let totalUnbilledRev = 0;

  const projectSummaries: ProjectFinancialSummary[] = [];

  for (const project of projects) {
    const client = clientMap.get(project.clientId);
    const rate = project.hourlyRate || client?.defaultHourlyRate || 75;
    const stats = projectSummariesMap.get(project.id) || { actualSeconds: 0, billableSeconds: 0, unbilledSeconds: 0 };

    const actualHrs = secondsToHours(stats.actualSeconds);
    const billableHrs = secondsToHours(stats.billableSeconds);
    const unbilledHrs = secondsToHours(stats.unbilledSeconds);
    
    const billableAmount = Number((billableHrs * rate).toFixed(2));
    const unbilledAmount = Number((unbilledHrs * rate).toFixed(2));
    const ehr = actualHrs > 0 ? Number((billableAmount / actualHrs).toFixed(2)) : rate;

    const budgetHrs = project.budgetHours || 0;
    const budgetPercent = budgetHrs > 0 ? Number(((actualHrs / budgetHrs) * 100).toFixed(1)) : 0;

    totalLoggedSec += stats.actualSeconds;
    totalBillableSec += stats.billableSeconds;
    totalBillableRev += billableAmount;
    totalUnbilledRev += unbilledAmount;

    projectSummaries.push({
      projectId: project.id,
      projectName: project.name,
      clientName: client?.name || 'Unknown Client',
      hourlyRate: rate,
      budgetHours: budgetHrs,
      budgetAmount: project.budgetAmount || (budgetHrs * rate),
      actualLoggedSeconds: stats.actualSeconds,
      roundedBillableSeconds: stats.billableSeconds,
      actualHours: actualHrs,
      billableHours: billableHrs,
      billableAmount,
      unbilledHours: unbilledHrs,
      unbilledAmount,
      effectiveHourlyRate: ehr,
      budgetUsedPercent: budgetPercent,
    });
  }

  const totalLoggedHours = secondsToHours(totalLoggedSec);
  const totalBillableHours = secondsToHours(totalBillableSec);
  const overallEHR = totalLoggedHours > 0 ? Number((totalBillableRev / totalLoggedHours).toFixed(2)) : 0;

  return {
    totalLoggedHours,
    totalBillableHours,
    totalBillableRevenue: Number(totalBillableRev.toFixed(2)),
    totalUnbilledRevenue: Number(totalUnbilledRev.toFixed(2)),
    overallEffectiveHourlyRate: overallEHR,
    activeProjectsCount: projects.filter(p => !p.isArchived).length,
    projectSummaries,
  };
}
