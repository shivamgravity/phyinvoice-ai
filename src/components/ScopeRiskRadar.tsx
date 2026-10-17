import React from 'react';
import { AlertCircle, ShieldAlert, CheckCircle2, TrendingUp, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
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
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm no-print">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Scope Creep & Budget Overrun Radar
            </h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Prior Labs TabPFN-3.5
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Zero-shot tabular foundation model analyzing session duration variance, off-hours firefighting, and task divergence.
          </p>
        </div>

        <button
          onClick={onRefreshAssessments}
          disabled={isEvaluating}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
          <span>{isEvaluating ? 'Evaluating...' : 'Re-Run TabPFN Audit'}</span>
        </button>
      </div>

      {/* Project Assessments Cards */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessments.map((item) => {
          const isHigh = item.riskLevel === 'high';
          const isMed = item.riskLevel === 'medium';
          const budgetPercent = item.budgetHours > 0 ? Math.min(100, Math.round((item.loggedHours / item.budgetHours) * 100)) : 0;

          return (
            <div
              key={item.projectId}
              className={`rounded-xl border p-4.5 transition relative overflow-hidden ${
                isHigh
                  ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                  : isMed
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {/* Card Title & Risk Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.projectName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Client: <span className="font-medium text-slate-700 dark:text-slate-300">{item.clientName}</span>
                  </p>
                </div>

                <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0 ${
                  isHigh
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/70 dark:text-red-200 border border-red-300 dark:border-red-800'
                    : isMed
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                }`}>
                  {isHigh ? <ShieldAlert className="w-3.5 h-3.5" /> : isMed ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{isHigh ? 'High Overrun Risk' : isMed ? 'Moderate Risk' : 'Healthy Velocity'} ({item.riskScore}%)</span>
                </div>
              </div>

              {/* Budget Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                  <span>Logged: <strong className="text-slate-900 dark:text-slate-200">{item.loggedHours}h</strong> / {item.budgetHours}h budget</span>
                  <span className="font-semibold">{budgetPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetPercent >= 90 ? 'bg-red-500' : budgetPercent >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${budgetPercent}%` }}
                  />
                </div>
              </div>

              {/* TabPFN Diagnostic Reasons */}
              <div className="mt-3.5 space-y-1">
                {item.reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className="text-slate-400 dark:text-slate-500 font-bold">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              {/* Financial Risk Projection */}
              {(isHigh || isMed) && (
                <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Projected Unbilled Overrun:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    +{item.projectedOverrunHours} hrs (~${item.projectedRevenueLoss.toLocaleString()} at ${item.hourlyRate}/h)
                  </span>
                </div>
              )}

              {/* Recommended Action */}
              {item.recommendations.length > 0 && (
                <div className="mt-2.5 p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span className="font-medium">{item.recommendations[0]}</span>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </section>
  );
};
