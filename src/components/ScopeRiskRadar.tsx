import React from 'react';
import { 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  DollarSign, 
  ArrowRight,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { ScopeRiskAssessment } from '../data/types';

interface ScopeRiskRadarProps {
  assessments: ScopeRiskAssessment[];
  onRefreshAssessments: () => void;
  isEvaluating?: boolean;
}

export const ScopeRiskRadar: React.FC<ScopeRiskRadarProps> = ({
  assessments,
  onRefreshAssessments,
  isEvaluating = false,
}) => {
  if (assessments.length === 0) return null;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm no-print transition-colors">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Scope Creep & Budget Overrun Radar
            </h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3 text-purple-500" /> Prior Labs TabPFN-3.5
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Zero-shot tabular foundation model analyzing session duration variance, off-hours firefighting, and task divergence.
          </p>
        </div>

        <button
          onClick={onRefreshAssessments}
          disabled={isEvaluating}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200/60 dark:border-slate-700 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isEvaluating ? 'animate-spin' : ''}`} />
          <span>{isEvaluating ? 'Evaluating...' : 'Re-Run TabPFN Audit'}</span>
        </button>
      </div>

      {/* Project Assessments Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {assessments.map((item) => {
          const isHigh = item.riskLevel === 'high';
          const isMed = item.riskLevel === 'medium';
          const budgetPercent = item.budgetHours > 0 ? Math.min(100, Math.round((item.loggedHours / item.budgetHours) * 100)) : 0;

          return (
            <div
              key={item.projectId}
              className={`rounded-2xl border p-4.5 sm:p-6 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md ${
                isHigh
                  ? 'bg-gradient-to-b from-red-50/50 via-white to-red-50/30 dark:from-red-950/20 dark:via-slate-900 dark:to-red-950/10 border-red-200/90 dark:border-red-900/60'
                  : isMed
                  ? 'bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/10 border-amber-200/90 dark:border-amber-900/60'
                  : 'bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40 dark:from-slate-800/40 dark:via-slate-900 dark:to-slate-800/20 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Card Title & Risk Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      {item.projectName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Client: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.clientName}</span>
                    </p>
                  </div>

                  <div className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm ${
                    isHigh
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/70 dark:text-red-200 border border-red-300 dark:border-red-800'
                      : isMed
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                  }`}>
                    {isHigh ? (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    ) : isMed ? (
                      <AlertCircle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isHigh ? 'High Overrun Risk' : isMed ? 'Moderate Risk' : 'Healthy Velocity'} ({item.riskScore}%)</span>
                  </div>
                </div>

                {/* 1. Budget Progress Container */}
                <div className="mt-5 p-4 rounded-xl bg-white/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Logged: <strong className="text-slate-900 dark:text-slate-100 font-bold">{item.loggedHours}h</strong> / {item.budgetHours}h budget
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                      budgetPercent >= 90
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : budgetPercent >= 75
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}>
                      {budgetPercent}% Used
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        budgetPercent >= 90 ? 'bg-red-500' : budgetPercent >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${budgetPercent}%` }}
                    />
                  </div>
                </div>

                {/* 2. TabPFN Diagnostic Signals */}
                <div className="mt-4.5 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                    TabPFN Diagnostic Signals
                  </span>
                  {item.reasons.map((reason, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/50 dark:bg-slate-950/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50"
                    >
                      <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                        isHigh ? 'text-red-500' : isMed ? 'text-amber-500' : 'text-emerald-500'
                      }`} />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Cards: Financial Impact & Action Playbook */}
              <div className="mt-5 space-y-3 pt-4 border-t border-slate-200/70 dark:border-slate-800">
                {/* Financial Risk Projection Box */}
                {(isHigh || isMed) ? (
                  <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 flex items-center justify-between text-xs shadow-xs">
                    <div className="flex items-center gap-2 text-red-900 dark:text-red-200 font-medium">
                      <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/60 flex items-center justify-center text-red-600 dark:text-red-300 shrink-0">
                        <DollarSign className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <span>Projected Unbilled Overrun</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-red-700 dark:text-red-300 block text-sm">
                        +{item.projectedOverrunHours} hrs
                      </span>
                      <span className="text-[11px] text-red-600/80 dark:text-red-400">
                        ~${item.projectedRevenueLoss.toLocaleString()} at ${item.hourlyRate}/h
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between text-xs">
                    <span className="text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Budget & Margin Tracking
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                      On Target
                    </span>
                  </div>
                )}

                {/* Recommended Action Box */}
                {item.recommendations.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5 shadow-xs">
                    <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
                        Actionable Playbook
                      </span>
                      <p className="font-medium text-slate-700 dark:text-slate-300 leading-snug">
                        {item.recommendations[0]}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
};
