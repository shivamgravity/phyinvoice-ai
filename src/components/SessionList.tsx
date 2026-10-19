import React, { useState } from 'react';
import { Sparkles, Trash2, Clock, CheckCircle, AlertCircle, FileText, Filter } from 'lucide-react';
import { WorkSession, Project, Client } from '../data/types';
import { secondsToHours } from '../services/billingEngine';

interface SessionListProps {
  sessions: WorkSession[];
  projects: Project[];
  clients: Client[];
  onSynthesizeDeliverable: (sessionId: string) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  synthesizingId?: string | null;
  selectedModel?: string;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  projects,
  clients,
  onSynthesizeDeliverable,
  onDeleteSession,
  synthesizingId,
  selectedModel,
}) => {
  const [filterProjectId, setFilterProjectId] = useState<string>('all');
  const [filterBilled, setFilterBilled] = useState<string>('all');

  const projectMap = new Map<string, Project>(projects.map(p => [p.id, p]));
  const clientMap = new Map<string, Client>(clients.map(c => [c.id, c]));

  const filteredSessions = sessions.filter(session => {
    if (filterProjectId !== 'all' && session.projectId !== filterProjectId) return false;
    if (filterBilled !== 'all' && session.billedStatus !== filterBilled) return false;
    return true;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm no-print">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Work Sessions & Deliverables
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredSessions.length} sessions
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Raw developer logs transformed into client-ready deliverable line items via Google Gemma.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Filter:</span>
          </div>

          <select
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
            className="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={filterBilled}
            onChange={(e) => setFilterBilled(e.target.value)}
            className="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="unbilled">Unbilled</option>
            <option value="invoiced">Invoiced</option>
          </select>
        </div>
      </div>

      {/* Sessions Table / List */}
      <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/80">
        {filteredSessions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No work sessions found matching the selected filters.
          </div>
        ) : (
          filteredSessions.map((session) => {
            const project = session.projectId ? projectMap.get(session.projectId) : undefined;
            const client = project ? clientMap.get(project.clientId) : undefined;
            const isSynthesizing = synthesizingId === session.id;

            const actualHrs = secondsToHours(session.duration);
            const billableHrs = secondsToHours(session.roundedDuration || session.duration);
            const rate = project?.hourlyRate || client?.defaultHourlyRate || 75;
            const lineAmount = Number((billableHrs * rate).toFixed(2));

            return (
              <div key={session.id} className="py-4 flex flex-col md:flex-row md:items-start justify-between gap-4 group">
                
                {/* Left: Metadata & Descriptions */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {project?.name || 'Unassigned Project'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {client?.name || 'Client'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400">
                      {formatDate(session.startTime)}
                    </span>
                    
                    {session.billedStatus === 'invoiced' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> Invoiced
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                        Unbilled
                      </span>
                    )}
                  </div>

                  {/* Raw developer note */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-baseline gap-1.5 font-mono">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Raw:</span>
                    <span>"{session.description}"</span>
                  </div>

                  {/* Gemma 2 Polished Deliverable */}
                  {session.clientDeliverable ? (
                    <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300 mr-1.5">
                          Client Deliverable:
                        </span>
                        <span>{session.clientDeliverable}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>No polished deliverable yet. Click "Polish" to synthesize with local model.</span>
                    </div>
                  )}
                </div>

                {/* Right: Hours, Amount, Actions */}
                <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-end shrink-0 gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/80">
                  <div className="text-left md:text-right">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      ${lineAmount}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {billableHrs}h billable {billableHrs !== actualHrs && `(${actualHrs}h actual)`}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const modelLabel = selectedModel && selectedModel !== 'offline-fallback'
                        ? selectedModel.split(':')[0]
                        : 'AI';
                      return (
                        <button
                          onClick={() => onSynthesizeDeliverable(session.id)}
                          disabled={isSynthesizing}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 transition disabled:opacity-50"
                          title={`Rewrite raw note with ${selectedModel || 'local model'}`}
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
                          <span>{isSynthesizing ? 'Polishing...' : `Polish (${modelLabel})`}</span>
                        </button>
                      );
                    })()}

                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </section>
  );
};
