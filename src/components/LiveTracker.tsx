import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Clock, Sparkles, Check, ChevronDown } from 'lucide-react';
import { Project, Client, WorkSession } from '../data/types';
import { roundDuration, secondsToHours } from '../services/billingEngine';

interface LiveTrackerProps {
  projects: Project[];
  clients: Client[];
  onSaveSession: (session: WorkSession) => Promise<void>;
  isSynthesizing?: boolean;
}

export const LiveTracker: React.FC<LiveTrackerProps> = ({
  projects,
  clients,
  onSaveSession,
}) => {
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [isBillable, setIsBillable] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Sync selected project if projects array changes
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Timer interval
  useEffect(() => {
    if (isTracking) {
      startTimeRef.current = Date.now() - elapsedSeconds * 1000;
      timerRef.current = window.setInterval(() => {
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(secs);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTracking]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedClient = clients.find(c => c.id === selectedProject?.clientId);
  const hourlyRate = selectedProject?.hourlyRate || selectedClient?.defaultHourlyRate || 75;
  const roundingRule = selectedClient?.roundingRule || '15min';

  // Format timer HH:MM:SS
  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const roundedSeconds = roundDuration(elapsedSeconds || 60, roundingRule);
  const billableHours = secondsToHours(roundedSeconds);
  const projectedEarnings = Number((billableHours * hourlyRate).toFixed(2));

  const handleStart = () => {
    if (!description.trim()) {
      setDescription('Unspecified client task');
    }
    setElapsedSeconds(0);
    setIsTracking(true);
  };

  const handleStop = async () => {
    setIsTracking(false);
    const finalSeconds = elapsedSeconds > 0 ? elapsedSeconds : 60; // minimum 1 min
    const finalRounded = roundDuration(finalSeconds, roundingRule);

    const newSession: WorkSession = {
      id: `sess-${Date.now()}`,
      description: description.trim() || 'General software development',
      startTime: Date.now() - finalSeconds * 1000,
      endTime: Date.now(),
      duration: finalSeconds,
      roundedDuration: finalRounded,
      projectId: selectedProjectId || null,
      clientId: selectedProject?.clientId || null,
      isBillable,
      billedStatus: 'unbilled',
      classificationStatus: 'assigned',
      classificationConfidence: 0.95,
      embedding: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await onSaveSession(newSession);
    setDescription('');
    setElapsedSeconds(0);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm no-print">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        
        {/* Task Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you building or debugging right now? (e.g. 'Investigating Apple Pay webhook timeout')"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Project Selector */}
        <div className="w-full sm:w-60 relative">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full appearance-none px-3.5 py-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
          >
            {projects.map((p) => {
              const client = clients.find(c => c.id === p.clientId);
              return (
                <option key={p.id} value={p.id}>
                  {p.name} ({client?.name || 'Client'})
                </option>
              );
            })}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
        </div>

        {/* Billable Toggle & Rounding Rule Info */}
        <div className="flex items-center gap-3 px-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Billable
            </span>
          </label>

          <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ${hourlyRate}/h • {roundingRule}
          </span>
        </div>

        {/* Live Timer Display & Start/Stop Controls */}
        <div className="flex items-center gap-3">
          <div className={`font-mono text-lg font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition ${
            isTracking
              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          {isTracking ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/30 transition shrink-0"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop & Save</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Timer</span>
            </button>
          )}
        </div>

      </div>

      {/* Real-time rounding and earnings preview when tracking */}
      {isTracking && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            Active Session on <strong>{selectedProject?.name}</strong>
          </span>
          <span className="font-medium">
            Rounded to <strong className="text-slate-900 dark:text-white">{billableHours}h</strong> ({roundingRule}) = <strong className="text-emerald-600 dark:text-emerald-400">${projectedEarnings}</strong>
          </span>
        </div>
      )}
    </div>
  );
};
