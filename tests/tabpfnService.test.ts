import { describe, it, expect } from 'vitest';
import { extractTabularFeatures, evaluateScopeRiskWithTabPFN } from '../src/services/tabpfnService';
import { Project, Client, WorkSession } from '../src/data/types';

describe('TabPFN Tabular Feature Extraction & Scope Risk Scoring', () => {
  const dummyClient: Client = {
    id: 'c1',
    name: 'Acme Corp',
    email: 'acme@test.com',
    currency: 'USD',
    defaultHourlyRate: 85,
    roundingRule: '15min',
    paymentTermsDays: 14,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const dummyProject: Project = {
    id: 'p1',
    clientId: 'c1',
    name: 'Core API Integration',
    billingType: 'hourly',
    hourlyRate: 85,
    budgetHours: 20,
    budgetAmount: 1700,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const sessionsWithScopeCreep: WorkSession[] = [
    {
      id: 's1',
      description: 'debugging oauth login',
      startTime: new Date('2026-10-14T10:00:00Z').getTime(), // weekday 10 AM (normal)
      endTime: new Date('2026-10-14T12:00:00Z').getTime(),
      duration: 7200, // 2h
      roundedDuration: 7200,
      projectId: 'p1',
      clientId: 'c1',
      isBillable: true,
      billedStatus: 'unbilled',
      classificationStatus: 'assigned',
      classificationConfidence: 0.95,
      embedding: null,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 's2',
      description: 'unplanned emergency client request: investigating webhook payload changes',
      startTime: new Date('2026-10-17T22:00:00Z').getTime(), // Saturday 10 PM (weekend + off-hours)
      endTime: new Date('2026-10-18T04:00:00Z').getTime(),
      duration: 21600, // 6h (huge spike)
      roundedDuration: 21600,
      projectId: 'p1',
      clientId: 'c1',
      isBillable: true,
      billedStatus: 'unbilled',
      classificationStatus: 'assigned',
      classificationConfidence: 0.9,
      embedding: null,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 's3',
      description: 'extra revisions: adjusting dark mode contrast per client slack message',
      startTime: new Date('2026-10-18T05:00:00Z').getTime(), // Sunday morning (weekend)
      endTime: new Date('2026-10-18T16:00:00Z').getTime(),
      duration: 39600, // 11h
      roundedDuration: 39600,
      projectId: 'p1',
      clientId: 'c1',
      isBillable: true,
      billedStatus: 'unbilled',
      classificationStatus: 'assigned',
      classificationConfidence: 0.85,
      embedding: null,
      createdAt: 1000,
      updatedAt: 1000,
    }
  ];

  it('should extract tabular features detecting off-hours, duration variance, and unplanned scope keywords', () => {
    const features = extractTabularFeatures(dummyProject, dummyClient, sessionsWithScopeCreep);

    expect(features.sessionCount).toBe(3);
    expect(features.loggedHours).toBe(19); // 2h + 6h + 11h = 19h
    expect(features.budgetUtilization).toBe(0.95); // 19h / 20h budget = 95%
    expect(features.offHoursRatio).toBeGreaterThan(0.5); // 2 out of 3 were off-hours
    expect(features.unplannedTaskRatio).toBeGreaterThan(0.5); // 2 out of 3 had keywords
    expect(features.durationVariance).toBeGreaterThan(10); // huge variance in session lengths
  });

  it('should assign a high overrun risk and predict revenue loss on high-variance projects', async () => {
    const features = extractTabularFeatures(dummyProject, dummyClient, sessionsWithScopeCreep);
    const assessment = await evaluateScopeRiskWithTabPFN(features, dummyProject.name, dummyClient.name);

    expect(assessment.riskLevel).toBe('high');
    expect(assessment.riskScore).toBeGreaterThanOrEqual(70);
    expect(assessment.projectedOverrunHours).toBeGreaterThan(0);
    expect(assessment.projectedRevenueLoss).toBeGreaterThan(0);
    expect(assessment.recommendations.length).toBeGreaterThan(0);
  });
});
