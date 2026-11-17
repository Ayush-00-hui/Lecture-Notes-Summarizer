import React from 'react';
import { FileText, Presentation, Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div className="text-center py-6 sm:py-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100/80 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 mb-3">
        <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
        <span>Instant Lecture Notes & Slide Deck Summarizer</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
        Summarize Your Lecture Notes
      </h1>

      <p className="mt-2.5 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
        Upload your PDF or PPT/PPTX slides to generate a clear, comprehensive summary,
        key takeaways, and revision points—ready to read in-app and download in multiple formats.
      </p>
    </div>
  );
};
