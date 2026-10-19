import React from 'react';
import { DollarSign, FileText, Users, Moon, Sun, Shield, Sparkles, RefreshCw, Cpu } from 'lucide-react';
import { OllamaModelInfo } from '../services/gemmaService';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenInvoiceModal: () => void;
  onOpenClientsModal: () => void;
  onResetDemoData: () => void;
  availableModels: OllamaModelInfo[];
  selectedModel: string;
  isOllamaConnected: boolean;
  onSelectModel: (modelName: string) => void;
  onRefreshModels: () => void;
  isRefreshingModels?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenInvoiceModal,
  onOpenClientsModal,
  onResetDemoData,
  availableModels,
  selectedModel,
  isOllamaConnected,
  onSelectModel,
  onRefreshModels,
  isRefreshingModels = false,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 no-print transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <DollarSign className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-white dark:to-indigo-200 bg-clip-text text-transparent">
                PhyInvoice AI
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> Local-First AI
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
              Freelance Billing, Scope-Creep Defense & Google Gemma Deliverables
            </p>
          </div>
        </div>

        {/* Action Buttons & AI Model Selector */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Local Ollama Model Picker */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-xl px-2 sm:px-2.5 py-1.5 border border-slate-200 dark:border-slate-700/80 text-xs shadow-sm">
            <div 
              className="flex items-center gap-1 cursor-help" 
              title={isOllamaConnected ? 'Local Ollama daemon connected' : 'Ollama daemon offline (using local heuristic enhancer)'}
            >
              <span className={`w-2 h-2 rounded-full ${isOllamaConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            </div>

            {isOllamaConnected && availableModels.length > 0 ? (
              <select
                value={selectedModel}
                onChange={(e) => onSelectModel(e.target.value)}
                className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[80px] sm:max-w-[150px] truncate text-xs"
                title="Select local model for deliverable synthesis"
              >
                {availableModels.map((m) => (
                  <option key={m.name} value={m.name} className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {m.name} {m.parameterSize ? `(${m.parameterSize})` : ''}
                  </option>
                ))}
                <option value="offline-fallback" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  Offline Enhancer (No AI)
                </option>
              </select>
            ) : (
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 hidden xs:inline">
                {isOllamaConnected ? 'No models' : 'Offline'}
              </span>
            )}

            <button
              onClick={onRefreshModels}
              disabled={isRefreshingModels}
              className="p-1 rounded text-slate-400 hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Rescan local Ollama daemon for models"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingModels ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <button
            onClick={onOpenClientsModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
            title="Manage Clients & Hourly Rates"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Clients & Rates</span>
          </button>

          <button
            onClick={onOpenInvoiceModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 transition"
            title="Create New Invoice"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Create Invoice</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={onResetDemoData}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Reset Demo Sample Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle Dark/Light Mode"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </header>
  );
};
