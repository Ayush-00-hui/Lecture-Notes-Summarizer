import React from 'react';
import { Layers, ArrowRight, FileCheck, FileCode, Presentation, FileText } from 'lucide-react';
import { ThreeCanvas } from './ThreeCanvas';

interface HeroProps {
  onLoadSample: () => void;
  onExploreCompare: () => void;
  isDark?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onLoadSample, onExploreCompare, isDark = false }) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/60 p-6 sm:p-7 shadow-xs mb-6 transition-colors">
      {/* 3D Interactive Spatial Mesh Background */}
      <ThreeCanvas
        isDark={isDark}
        className="absolute inset-0 h-full w-full opacity-60 dark:opacity-40"
      />

      {/* Gentle gradient overlay to guarantee text legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-zinc-900 dark:via-zinc-900/80 dark:to-transparent" />

      {/* Content Container */}
      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 text-[11px] font-mono font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 mb-3">
          <Layers className="h-3 w-3 text-zinc-500" />
          <span>Academic Knowledge Synthesis Studio</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 leading-snug">
          Transform messy lectures into crisp summaries & exam-ready notes
        </h1>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Ingest slide decks, lecture PDFs, Word files, or raw text. Generate structured executive summaries,
          cited key concepts, revision checklists with likely exam questions, and 3D flashcards.
          Test and compare prompt architectures side-by-side in our built-in Lab.
        </p>

        {/* Minimal Action & Supported Format Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={onLoadSample}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Try Sample Lecture (1-Click)</span>
          </button>

          <button
            onClick={onExploreCompare}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <span>Explore Comparison Lab</span>
            <ArrowRight className="h-3 w-3 text-zinc-400" />
          </button>
        </div>

        {/* Minimalist format tags */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Supported formats:</span>
          <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 font-mono dark:bg-zinc-800/80">
            <FileText className="h-2.5 w-2.5" /> PDF
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 font-mono dark:bg-zinc-800/80">
            <Presentation className="h-2.5 w-2.5" /> PPTX + Notes
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 font-mono dark:bg-zinc-800/80">
            <FileCheck className="h-2.5 w-2.5" /> DOCX
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 font-mono dark:bg-zinc-800/80">
            <FileCode className="h-2.5 w-2.5" /> TXT / MD
          </span>
          <span className="text-zinc-400 dark:text-zinc-500">· Max 20 MB</span>
        </div>
      </div>
    </div>
  );
};
