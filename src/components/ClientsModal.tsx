import React, { useState } from 'react';
import { X, Plus, Users, FolderPlus, DollarSign, Clock } from 'lucide-react';
import { Client, Project, BillingRoundingRule } from '../data/types';

interface ClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  projects: Project[];
  onSaveClient: (client: Client) => Promise<void>;
  onSaveProject: (project: Project) => Promise<void>;
}

export const ClientsModal: React.FC<ClientsModalProps> = ({
  isOpen,
  onClose,
  clients,
  projects,
  onSaveClient,
  onSaveProject,
}) => {
  if (!isOpen) return null;

  // New Client Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [defaultRate, setDefaultRate] = useState(85);
  const [roundingRule, setRoundingRule] = useState<BillingRoundingRule>('15min');

  // New Project Form State
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [projectName, setProjectName] = useState('');
  const [projectRate, setProjectRate] = useState(85);
  const [budgetHours, setBudgetHours] = useState(20);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: clientName.trim(),
      email: clientEmail.trim() || 'contact@client.com',
      company: clientCompany.trim() || undefined,
      currency: 'USD',
      defaultHourlyRate: defaultRate,
      roundingRule,
      paymentTermsDays: 14,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await onSaveClient(newClient);
    setClientName('');
    setClientEmail('');
    setClientCompany('');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !selectedClientId) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      clientId: selectedClientId,
      name: projectName.trim(),
      billingType: 'hourly',
      hourlyRate: projectRate,
      budgetHours,
      budgetAmount: projectRate * budgetHours,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await onSaveProject(newProject);
    setProjectName('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Manage Clients & Project Rates
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Add Client Form */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-500" /> Add New Client
            </h3>
            <form onSubmit={handleCreateClient} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Client Name (e.g. John Doe)"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Company (optional)"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="email"
                  placeholder="Billing Email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />

                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-400">$</span>
                  <input
                    type="number"
                    placeholder="Hourly Rate"
                    value={defaultRate}
                    onChange={(e) => setDefaultRate(Number(e.target.value))}
                    className="w-full pl-6 pr-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <select
                  value={roundingRule}
                  onChange={(e) => setRoundingRule(e.target.value as BillingRoundingRule)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="15min">15-min Freelance Rounding</option>
                  <option value="6min">6-min Tenth-Hour Rounding</option>
                  <option value="exact">Exact Seconds</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition"
              >
                Save Client
              </button>
            </form>
          </div>

          {/* Add Project Form */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-indigo-500" /> Add New Project
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Project Name (e.g. Mobile API Redesign)"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-400">$</span>
                  <input
                    type="number"
                    placeholder="Hourly Rate"
                    value={projectRate}
                    onChange={(e) => setProjectRate(Number(e.target.value))}
                    className="w-full pl-6 pr-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="relative">
                  <input
                    type="number"
                    placeholder="Budget Cap (Hours)"
                    value={budgetHours}
                    onChange={(e) => setBudgetHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition"
              >
                Save Project
              </button>
            </form>
          </div>

          {/* Current Clients List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Existing Clients ({clients.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {clients.map(c => {
                const clientProjs = projects.filter(p => p.clientId === c.id);
                return (
                  <div key={c.id} className="p-3 bg-white dark:bg-slate-900 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-slate-500">{c.company || c.email} • {c.roundingRule} rounding</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">${c.defaultHourlyRate}/h</p>
                      <p className="text-[10px] text-slate-400">{clientProjs.length} projects</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
