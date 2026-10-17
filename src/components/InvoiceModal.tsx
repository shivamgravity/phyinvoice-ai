import React, { useState, useEffect } from 'react';
import { X, Printer, Check, FileText, Calendar, DollarSign, Sparkles } from 'lucide-react';
import { Client, Project, WorkSession, Invoice, InvoiceItem } from '../data/types';
import { secondsToHours } from '../services/billingEngine';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  projects: Project[];
  sessions: WorkSession[];
  onSaveInvoice: (invoice: Invoice) => Promise<void>;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  clients,
  projects,
  sessions,
  onSaveInvoice,
}) => {
  if (!isOpen) return null;

  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());
  const [taxRate, setTaxRate] = useState<number>(0);
  const [notes, setNotes] = useState<string>('Payment due within 14 days. Thank you for your business!');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [isSaved, setIsSaved] = useState(false);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const projectMap = new Map<string, Project>(projects.map(p => [p.id, p]));

  // Find all unbilled sessions for selected client
  const clientProjects = projects.filter(p => p.clientId === selectedClientId);
  const clientProjectIds = new Set(clientProjects.map(p => p.id));
  
  const eligibleSessions = sessions.filter(
    s => s.isBillable && s.billedStatus === 'unbilled' && s.projectId && clientProjectIds.has(s.projectId)
  );

  // Initialize selected session IDs when client changes
  useEffect(() => {
    setSelectedSessionIds(new Set(eligibleSessions.map(s => s.id)));
    setIsSaved(false);
  }, [selectedClientId, sessions]);

  const toggleSession = (id: string) => {
    const next = new Set(selectedSessionIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSessionIds(next);
  };

  // Build line items
  const lineItems: InvoiceItem[] = eligibleSessions
    .filter(s => selectedSessionIds.has(s.id))
    .map(s => {
      const proj = s.projectId ? projectMap.get(s.projectId) : undefined;
      const rate = proj?.hourlyRate || selectedClient?.defaultHourlyRate || 75;
      const hours = secondsToHours(s.roundedDuration || s.duration);
      return {
        id: `item-${s.id}`,
        sessionId: s.id,
        date: s.startTime,
        description: s.clientDeliverable || s.description,
        hours,
        rate,
        amount: Number((hours * rate).toFixed(2)),
      };
    });

  const totalHours = lineItems.reduce((acc, it) => acc + it.hours, 0);
  const subtotal = lineItems.reduce((acc, it) => acc + it.amount, 0);
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));

  const handleSaveAndMarkInvoiced = async () => {
    if (!selectedClient) return;

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientEmail: selectedClient.email,
      clientCompany: selectedClient.company,
      issueDate: Date.now(),
      dueDate: Date.now() + (selectedClient.paymentTermsDays || 14) * 24 * 60 * 60 * 1000,
      currency: selectedClient.currency || 'USD',
      items: lineItems,
      totalHours,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      notes,
      status: 'issued',
      sessionIds: Array.from(selectedSessionIds),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await onSaveInvoice(invoice);
    setIsSaved(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Create Client Invoice
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Controls Bar (no-print) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl no-print">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Select Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.company || 'Direct'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* PRINTABLE INVOICE SHEET */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 invoice-card">
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <span className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                  INVOICE
                </span>
                <p className="text-xs font-mono text-slate-500 mt-1">#{invoiceNumber}</p>
              </div>

              <div className="text-right text-xs space-y-1">
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Due:</strong> {new Date(Date.now() + 14 * 86400000).toLocaleDateString()}</p>
                <p><strong>Terms:</strong> Net 14</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="mt-6 flex justify-between text-xs">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To:</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedClient?.name}</p>
                {selectedClient?.company && <p className="text-slate-600 dark:text-slate-300">{selectedClient.company}</p>}
                <p className="text-slate-500">{selectedClient?.email}</p>
              </div>

              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payable To:</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Independent Freelance Consultant</p>
                <p className="text-slate-500">Autonomous Consulting Services</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mt-6">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="py-2.5 w-8 no-print"></th>
                    <th className="py-2.5">Deliverable Description</th>
                    <th className="py-2.5 text-right w-16">Hours</th>
                    <th className="py-2.5 text-right w-20">Rate</th>
                    <th className="py-2.5 text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {eligibleSessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No unbilled sessions for this client.
                      </td>
                    </tr>
                  ) : (
                    eligibleSessions.map(sess => {
                      const isSelected = selectedSessionIds.has(sess.id);
                      const proj = sess.projectId ? projectMap.get(sess.projectId) : undefined;
                      const rate = proj?.hourlyRate || selectedClient?.defaultHourlyRate || 75;
                      const hours = secondsToHours(sess.roundedDuration || sess.duration);
                      const amt = Number((hours * rate).toFixed(2));

                      return (
                        <tr key={sess.id} className={isSelected ? '' : 'opacity-40 no-print'}>
                          <td className="py-3 no-print">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSession(sess.id)}
                              className="rounded text-indigo-600"
                            />
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {sess.clientDeliverable || sess.description}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(sess.startTime).toLocaleDateString()} • {proj?.name}
                            </p>
                          </td>
                          <td className="py-3 text-right font-mono">{hours}h</td>
                          <td className="py-3 text-right font-mono">${rate}</td>
                          <td className="py-3 text-right font-mono font-semibold">${amt}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal ({totalHours} hrs):</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">${subtotal}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax ({taxRate}%):</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">${taxAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Due:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">${totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <p><strong>Notes / Wire Details:</strong> {notes}</p>
            </div>

          </div>

        </div>

        {/* Modal Footer (no-print) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 no-print">
          <div className="text-xs text-slate-500">
            {selectedSessionIds.size} sessions selected • <strong>${totalAmount}</strong> total
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={lineItems.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>

            <button
              onClick={handleSaveAndMarkInvoiced}
              disabled={lineItems.length === 0 || isSaved}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaved ? 'Invoice Saved & Marked' : 'Save & Mark Invoiced'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
