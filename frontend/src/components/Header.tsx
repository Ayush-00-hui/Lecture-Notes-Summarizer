import React from 'react';
import {
  FileText,
  FlaskConical,
  FolderArchive,
  Settings as SettingsIcon,
  HelpCircle,
  Sun,
  Moon,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'compare' | 'library';
  setActiveTab: (tab: 'studio' | 'compare' | 'library') => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onLoadSample: () => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenAbout,
  onLoadSample,
  isDark,
  setIsDark,
  hasApiKey,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/85 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Monogram & Name */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('studio')}
            className="flex items-center gap-3 text-left focus:outline-none group"
            aria-label="NoteNest Home"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900/10 dark:bg-zinc-100 dark:text-zinc-950 group-hover:scale-105 transition-transform duration-200">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-sans text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  NoteNest
                </span>
                <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.2 text-[10px] font-mono font-medium tracking-tight text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  v1.0
                </span>
              </div>
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Lecture Notes Summarizer & Prompt Lab
              </span>
            </div>
          </button>

          {/* Engine Status Badge */}
          <div className="hidden lg:flex items-center">
            {hasApiKey ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                </span>
                <span>Gemini API Connected</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100/80 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"></span>
                </span>
                <Cpu className="h-3 w-3 text-zinc-500" />
                <span>Offline NLP Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* Primary Segmented Navigation Pills */}
        <nav
          className="flex items-center rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1 dark:border-zinc-800 dark:bg-zinc-900/70"
          role="tablist"
        >
          <button
            onClick={() => setActiveTab('studio')}
            role="tab"
            aria-selected={activeTab === 'studio'}
            className={`relative flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'studio'
                ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            role="tab"
            aria-selected={activeTab === 'compare'}
            className={`relative flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'compare'
                ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>Comparison Lab</span>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            role="tab"
            aria-selected={activeTab === 'library'}
            className={`relative flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'library'
                ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <FolderArchive className="h-3.5 w-3.5" />
            <span>Library</span>
          </button>
        </nav>

        {/* Right Utility Bar */}
        <div className="flex items-center gap-2">
          {/* Quick Demo Pill */}
          <button
            onClick={onLoadSample}
            title="Load Sample Distributed Systems Lecture"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-zinc-300/80 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <Layers className="h-3.5 w-3.5 text-zinc-500" />
            <span>Try Sample Lecture</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-850 dark:hover:text-white transition-colors"
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-850 dark:hover:text-white transition-colors"
          >
            <SettingsIcon className="h-3.5 w-3.5" />
          </button>

          {/* About / FAQ */}
          <button
            onClick={onOpenAbout}
            aria-label="About & FAQ"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-850 dark:hover:text-white transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
