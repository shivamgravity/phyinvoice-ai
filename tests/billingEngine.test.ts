import { describe, it, expect } from 'vitest';
import { roundDuration, secondsToHours, calculateFinancialMetrics } from '../src/services/billingEngine';
import { WorkSession, Project, Client } from '../src/data/types';

describe('Billing Engine Rounding Logic', () => {
  it('should preserve exact duration when rule is exact', () => {
    expect(roundDuration(125, 'exact')).toBe(125);
    expect(roundDuration(3600, 'exact')).toBe(3600);
    expect(roundDuration(0, 'exact')).toBe(0);
  });

  it('should correctly round up to 6-minute (360s / 0.1h) tenth-hour increments', () => {
    expect(roundDuration(0, '6min')).toBe(0);
    expect(roundDuration(1, '6min')).toBe(360);      // 1 sec rounds up to 6 min
    expect(roundDuration(360, '6min')).toBe(360);    // exactly 6 min
    expect(roundDuration(361, '6min')).toBe(720);    // 6 min 1 sec rounds up to 12 min
    expect(roundDuration(1800, '6min')).toBe(1800);  // 30 min stays 30 min
  });

  it('should correctly round up to 15-minute (900s / 0.25h) quarter-hour increments', () => {
    expect(roundDuration(0, '15min')).toBe(0);
    expect(roundDuration(10, '15min')).toBe(900);     // 10 sec rounds up to 15 min
    expect(roundDuration(900, '15min')).toBe(900);    // exactly 15 min
    expect(roundDuration(901, '15min')).toBe(1800);   // 15 min 1 sec rounds up to 30 min
    expect(roundDuration(3600, '15min')).toBe(3600);  // 1 hour stays 1 hour
  });

  it('should convert seconds to hours with 2 decimal precision', () => {
    expect(secondsToHours(3600)).toBe(1.0);
    expect(secondsToHours(5400)).toBe(1.5);
    expect(secondsToHours(900)).toBe(0.25);
  });
});

describe('Financial Metrics Calculation', () => {
  const dummyClient: Client = {
    id: 'c1',
    name: 'Test Client',
    email: 'client@test.com',
    currency: 'USD',
    defaultHourlyRate: 100,
    roundingRule: '15min',
    paymentTermsDays: 14,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const dummyProject: Project = {
    id: 'p1',
    clientId: 'c1',
    name: 'Website Redesign',
    billingType: 'hourly',
    hourlyRate: 100,
    budgetHours: 10,
    budgetAmount: 1000,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const sessions: WorkSession[] = [
    {
      id: 's1',
      description: 'task 1',
      startTime: 1000,
      endTime: 4600,
      duration: 3600, // 1 hour
      roundedDuration: 3600,
      projectId: 'p1',
      clientId: 'c1',
      isBillable: true,
      billedStatus: 'unbilled',
      classificationStatus: 'assigned',
      classificationConfidence: 0.9,
      embedding: null,
      createdAt: 1000,
      updatedAt: 4600,
    },
    {
      id: 's2',
      description: 'task 2',
      startTime: 5000,
      endTime: 6200,
      duration: 1200, // 20 min -> rounds up to 30 min (1800s)
      roundedDuration: 1800,
      projectId: 'p1',
      clientId: 'c1',
      isBillable: true,
      billedStatus: 'unbilled',
      classificationStatus: 'assigned',
      classificationConfidence: 0.9,
      embedding: null,
      createdAt: 5000,
      updatedAt: 6200,
    }
  ];

  it('should accurately compute billable hours, unbilled revenue, and effective hourly rate', () => {
    const metrics = calculateFinancialMetrics(sessions, [dummyProject], [dummyClient]);

    // Total actual hours = 1h + 0.33h = 1.33h
    // Total rounded billable hours = 1h + 0.5h = 1.5h
    // Billable revenue = 1.5h * $100 = $150
    expect(metrics.totalBillableHours).toBe(1.5);
    expect(metrics.totalBillableRevenue).toBe(150);
    expect(metrics.totalUnbilledRevenue).toBe(150);
    
    // Effective hourly rate = $150 / 1.33h = ~$112.78/hr (higher than nominal $100/hr due to rounding!)
    expect(metrics.overallEffectiveHourlyRate).toBeGreaterThan(100);
  });
});
