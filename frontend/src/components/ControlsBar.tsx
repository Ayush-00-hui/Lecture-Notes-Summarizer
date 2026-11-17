import React from 'react';
import {
  Sliders,
  Languages,
  Users,
  CheckSquare,
  FlaskConical,
  Loader2,
  FileText,
  Layers,
} from 'lucide-react';

interface ControlsBarProps {
  summaryMode: 'short' | 'detailed' | 'custom';
  setSummaryMode: (mode: 'short' | 'detailed' | 'custom') => void;
  targetWords: number;
  setTargetWords: (w: number) => void;
  audienceLevel: 'beginner' | 'intermediate' | 'expert';
  setAudienceLevel: (lvl: 'beginner' | 'intermediate' | 'expert') => void;
  language: string;
  setLanguage: (lang: string) => void;
  generateSummary: boolean;
  setGenerateSummary: (val: boolean) => void;
  generateConcepts: boolean;
  setGenerateConcepts: (val: boolean) => void;
  generateRevision: boolean;
  setGenerateRevision: (val: boolean) => void;
  generateFlashcards: boolean;
  setGenerateFlashcards: (val: boolean) => void;
  onSummarize: () => void;
  onOpenCompare: () => void;
  isProcessing: boolean;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  summaryMode,
  setSummaryMode,
  targetWords,
  setTargetWords,
  audienceLevel,
  setAudienceLevel,
  language,
  setLanguage,
  generateSummary,
  setGenerateSummary,
  generateConcepts,
  setGenerateConcepts,
  generateRevision,
  setGenerateRevision,
  generateFlashcards,
  setGenerateFlashcards,
  onSummarize,
  onOpenCompare,
  isProcessing,
}) => {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/90 transition-colors mb-7">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Summary Length Mode */}
        <div>
          <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
            <Sliders className="h-3 w-3" />
            SUMMARY DEPTH & LENGTH
          </label>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-zinc-200 bg-zinc-100/70 p-1 dark:border-zinc-800 dark:bg-zinc-850">
            <button
              onClick={() => setSummaryMode('short')}
              className={`rounded-md py-1.5 text-xs font-medium transition-all ${
                summaryMode === 'short'
                  ? 'bg-white text-zinc-950 shadow-xs dark:bg-zinc-700 dark:text-zinc-50'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Short (~130w)
            </button>
            <button
              onClick={() => setSummaryMode('detailed')}
              className={`rounded-md py-1.5 text-xs font-medium transition-all ${
                summaryMode === 'detailed'
                  ? 'bg-white text-zinc-950 shadow-xs dark:bg-zinc-700 dark:text-zinc-50'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Detailed (~550w)
            </button>
            <button
              onClick={() => setSummaryMode('custom')}
              className={`rounded-md py-1.5 text-xs font-medium transition-all ${
                summaryMode === 'custom'
                  ? 'bg-white text-zinc-950 shadow-xs dark:bg-zinc-700 dark:text-zinc-50'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Custom length slider */}
          {summaryMode === 'custom' && (
            <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-850">
              <div className="flex justify-between text-xs font-mono text-zinc-600 dark:text-zinc-300 mb-1">
                <span>Target:</span>
                <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {targetWords} words
                </span>
              </div>
              <input
                type="range"
                min={80}
                max={1200}
                step={20}
                value={targetWords}
                onChange={(e) => setTargetWords(parseInt(e.target.value))}
                className="w-full accent-zinc-900 dark:accent-zinc-100 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
              />
            </div>
          )}
        </div>

        {/* Column 2: Audience & Language */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              TARGET AUDIENCE
            </label>
            <select
              value={audienceLevel}
              onChange={(e: any) => setAudienceLevel(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-zinc-800 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-200"
            >
              <option value="beginner">Beginner (Foundational, plain terms)</option>
              <option value="intermediate">Intermediate (Standard academic / college level)</option>
              <option value="expert">Expert (Rigorous formulas, dense theoretical detail)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
              <Languages className="h-3 w-3" />
              OUTPUT LANGUAGE
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-zinc-800 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-200"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
              <option value="German">German (Deutsch)</option>
              <option value="Chinese">Chinese (Mandarin / 简体中文)</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Japanese">Japanese (日本語)</option>
            </select>
          </div>
        </div>

        {/* Column 3: Output Toggles & Actions */}
        <div>
          <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
            <CheckSquare className="h-3 w-3" />
            STUDY PACKAGE DELIVERABLES
          </label>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <label className="flex items-center gap-2 rounded-md border border-zinc-200 p-2 cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60 transition-colors">
              <input
                type="checkbox"
                checked={generateSummary}
                onChange={(e) => setGenerateSummary(e.target.checked)}
                className="rounded accent-zinc-900 dark:accent-zinc-100"
              />
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">Summary</span>
            </label>
            <label className="flex items-center gap-2 rounded-md border border-zinc-200 p-2 cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60 transition-colors">
              <input
                type="checkbox"
                checked={generateConcepts}
                onChange={(e) => setGenerateConcepts(e.target.checked)}
                className="rounded accent-zinc-900 dark:accent-zinc-100"
              />
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">Key Concepts</span>
            </label>
            <label className="flex items-center gap-2 rounded-md border border-zinc-200 p-2 cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60 transition-colors">
              <input
                type="checkbox"
                checked={generateRevision}
                onChange={(e) => setGenerateRevision(e.target.checked)}
                className="rounded accent-zinc-900 dark:accent-zinc-100"
              />
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">Revision Points</span>
            </label>
            <label className="flex items-center gap-2 rounded-md border border-zinc-200 p-2 cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60 transition-colors">
              <input
                type="checkbox"
                checked={generateFlashcards}
                onChange={(e) => setGenerateFlashcards(e.target.checked)}
                className="rounded accent-zinc-900 dark:accent-zinc-100"
              />
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">3D Flashcards</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="mt-3.5 flex items-center gap-2">
            <button
              onClick={onSummarize}
              disabled={isProcessing}
              title="Shortcut: Ctrl+Enter"
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-zinc-950 py-2 px-3 text-xs font-semibold text-white shadow-xs hover:bg-zinc-850 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  <span>Summarize Notes</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenCompare}
              title="Compare Prompt Design A vs B"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <FlaskConical className="h-3.5 w-3.5 text-zinc-500" />
              <span>Compare</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
