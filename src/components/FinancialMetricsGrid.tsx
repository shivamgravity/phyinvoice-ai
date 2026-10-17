import React from 'react';
import { DollarSign, Clock, TrendingUp, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { GlobalFinancialMetrics } from '../services/billingEngine';
import { ScopeRiskAssessment } from '../data/types';

interface FinancialMetricsGridProps {
  metrics: GlobalFinancialMetrics;
  riskAssessments: ScopeRiskAssessment[];
  currencySymbol?: string;
}

export const FinancialMetricsGrid: React.FC<FinancialMetricsGridProps> = ({
  metrics,
  riskAssessments,
  currencySymbol = '$',
}) => {
  const highRiskCount = riskAssessments.filter(r => r.riskLevel === 'high').length;
  const projectedLossTotal = riskAssessments.reduce((acc, r) => acc + r.projectedRevenueLoss, 0);

  // Calculate rounding gain (hours gained from 15-min / 6-min billing rules)
  const roundingGainHours = Number((metrics.totalBillableHours - metrics.totalLoggedHours).toFixed(2));
  const roundingGainCash = Number((roundingGainHours * metrics.overallEffectiveHourlyRate).toFixed(2));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
      
      {/* 1. Unbilled Revenue */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Unbilled Revenue
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {currencySymbol}{metrics.totalUnbilledRevenue.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5" /> Ready to Bill
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          From un-invoiced completed work sessions
        </p>
      </div>

      {/* 2. Billable Hours & Agency Rounding Boost */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Billable Hours
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Clock className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {metrics.totalBillableHours} hrs
          </span>
          {roundingGainHours > 0 && (
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              +{roundingGainHours}h ({currencySymbol}{roundingGainCash})
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Tenth-hour & 15-min agency standard increments
        </p>
      </div>

      {/* 3. Effective Hourly Rate */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Effective Hourly Rate
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {currencySymbol}{metrics.overallEffectiveHourlyRate.toFixed(2)}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/hr</span>
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Real cash generated per actual logged hour
        </p>
      </div>

      {/* 4. TabPFN Scope Overrun Risk */}
      <div className={`border rounded-2xl p-5 shadow-sm transition ${
        highRiskCount > 0 
          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60' 
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Scope Creep Alert
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            highRiskCount > 0 
              ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {highRiskCount > 0 ? `${highRiskCount} Project At Risk` : 'All Healthy'}
          </span>
        </div>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 font-medium">
          {highRiskCount > 0 ? `TabPFN: ${currencySymbol}${projectedLossTotal.toLocaleString()} potential unbilled overrun` : 'Prior Labs TabPFN-3.5 monitor active'}
        </p>
      </div>

    </div>
  );
};
