import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FinancialMetricsGrid } from './components/FinancialMetricsGrid';
import { LiveTracker } from './components/LiveTracker';
import { ScopeRiskRadar } from './components/ScopeRiskRadar';
import { SessionList } from './components/SessionList';
import { InvoiceModal } from './components/InvoiceModal';
import { ClientsModal } from './components/ClientsModal';

import { 
  seedInitialDataIfEmpty, 
  getDB 
} from './data/database';
import { sessionRepository } from './data/sessionRepository';
import { projectRepository } from './data/projectRepository';
import { clientRepository } from './data/clientRepository';
import { invoiceRepository } from './data/invoiceRepository';
import { WorkSession, Project, Client, Invoice, ScopeRiskAssessment } from './data/types';
import { calculateFinancialMetrics, GlobalFinancialMetrics } from './services/billingEngine';
import { synthesizeDeliverableWithGemma } from './services/gemmaService';
import { runTabPFNPortfolioAudit } from './services/tabpfnService';

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<ScopeRiskAssessment[]>([]);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isClientsModalOpen, setIsClientsModalOpen] = useState(false);
  const [synthesizingId, setSynthesizingId] = useState<string | null>(null);
  const [isEvaluatingTabPFN, setIsEvaluatingTabPFN] = useState(false);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial load & seed
  useEffect(() => {
    async function loadData() {
      await seedInitialDataIfEmpty();
      await refreshAllData();
    }
    loadData();
  }, []);

  const refreshAllData = async () => {
    const [allSessions, allProjects, allClients, allInvoices] = await Promise.all([
      sessionRepository.getAll(),
      projectRepository.getAll(),
      clientRepository.getAll(),
      invoiceRepository.getAll(),
    ]);

    setSessions(allSessions);
    setProjects(allProjects);
    setClients(allClients);
    setInvoices(allInvoices);

    // Run TabPFN audit
    const assessments = await runTabPFNPortfolioAudit(allProjects, allClients, allSessions);
    setRiskAssessments(assessments);
  };

  const handleRefreshTabPFN = async () => {
    setIsEvaluatingTabPFN(true);
    try {
      const assessments = await runTabPFNPortfolioAudit(projects, clients, sessions);
      setRiskAssessments(assessments);
    } finally {
      setIsEvaluatingTabPFN(false);
    }
  };

  const handleSaveSession = async (newSession: WorkSession) => {
    await sessionRepository.save(newSession);
    await refreshAllData();
  };

  const handleDeleteSession = async (sessionId: string) => {
    await sessionRepository.delete(sessionId);
    await refreshAllData();
  };

  const handleSynthesizeDeliverable = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const project = projects.find(p => p.id === session.projectId);
    setSynthesizingId(sessionId);

    try {
      const { deliverable } = await synthesizeDeliverableWithGemma(session.description, project?.name);
      await sessionRepository.updateDeliverable(sessionId, deliverable);
      await refreshAllData();
    } finally {
      setSynthesizingId(null);
    }
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    await invoiceRepository.save(invoice);
    await sessionRepository.markAsInvoiced(invoice.sessionIds, invoice.id);
    await refreshAllData();
  };

  const handleSaveClient = async (client: Client) => {
    await clientRepository.save(client);
    await refreshAllData();
  };

  const handleSaveProject = async (project: Project) => {
    await projectRepository.save(project);
    await refreshAllData();
  };

  const handleResetDemoData = async () => {
    if (confirm('Reset database with fresh sample freelance projects and sessions?')) {
      const db = await getDB();
      await db.clear('sessions');
      await db.clear('projects');
      await db.clear('clients');
      await db.clear('invoices');
      await seedInitialDataIfEmpty();
      await refreshAllData();
    }
  };

  const metrics: GlobalFinancialMetrics = calculateFinancialMetrics(sessions, projects, clients);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
        onOpenClientsModal={() => setIsClientsModalOpen(true)}
        onResetDemoData={handleResetDemoData}
      />

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        
        {/* Banner / Introduction */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200/50 dark:border-indigo-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div>
            <h1 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
              Autonomous Freelance Revenue Defense
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Zero cloud API leakage. Google Gemma 2 synthesizes deliverable statements, while Prior Labs TabPFN-3.5 forecasts scope creep and unbilled hour loss.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>Hacktoberfest 2026</span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Side Hustle Theme</span>
          </div>
        </div>

        {/* 1. Key Commercial Metrics Grid */}
        <FinancialMetricsGrid
          metrics={metrics}
          riskAssessments={riskAssessments}
        />

        {/* 2. Floating Live Session Tracker */}
        <LiveTracker
          projects={projects}
          clients={clients}
          onSaveSession={handleSaveSession}
        />

        {/* 3. Prior Labs TabPFN Scope Risk Radar */}
        <ScopeRiskRadar
          assessments={riskAssessments}
          onRefreshAssessments={handleRefreshTabPFN}
          isEvaluating={isEvaluatingTabPFN}
        />

        {/* 4. Session List & Gemma 2 Deliverables */}
        <SessionList
          sessions={sessions}
          projects={projects}
          clients={clients}
          onSynthesizeDeliverable={handleSynthesizeDeliverable}
          onDeleteSession={handleDeleteSession}
          synthesizingId={synthesizingId}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 no-print">
        <p>PhyInvoice AI • Built for the Hacktoberfest Open-Source AI Challenge (Week 2: Side Hustle) • 100% Local & Privacy-Preserving</p>
      </footer>

      {/* Modals */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        clients={clients}
        projects={projects}
        sessions={sessions}
        onSaveInvoice={handleSaveInvoice}
      />

      <ClientsModal
        isOpen={isClientsModalOpen}
        onClose={() => setIsClientsModalOpen(false)}
        clients={clients}
        projects={projects}
        onSaveClient={handleSaveClient}
        onSaveProject={handleSaveProject}
      />

    </div>
  );
};
