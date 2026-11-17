import React from 'react';
import {
  FileText,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Cpu,
} from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenSettings: () => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onOpenSettings,
  isDark,
  setIsDark,
  hasApiKey,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90 transition-colors">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <button
          onClick={onReset}
          className="flex items-center gap-3 text-left focus:outline-none group"
          aria-label="NoteNest Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950 group-hover:scale-105 transition-transform">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
              NoteNest
            </span>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              PPT & PDF Summarizer
            </span>
          </div>
        </button>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <button
            onClick={onOpenSettings}
            title="Configure API Key"
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              hasApiKey
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/70 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                : 'border-zinc-200 bg-zinc-100/80 text-zinc-700 hover:bg-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasApiKey ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-500'
              }`}
            />
            {!hasApiKey && <Cpu className="h-3 w-3 text-zinc-500" />}
            <span>{hasApiKey ? 'Gemini AI Active' : 'Offline Mode'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            aria-label="API Settings"
            title="API Settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white transition-colors"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
