import React from 'react';
import { HelpCircle, ShieldCheck, Zap, X, BrainCircuit, Scale } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-w-2xl w-full rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3.5 dark:border-zinc-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                About NoteNest & Prompt Comparison Lab
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Architectural methodology, prompt engineering research, and privacy.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {/* Section 1: Prompt Comparison Lab Design */}
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mb-2">
              <Scale className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              The Prompt Comparison Experiment: Prompt A vs. Prompt B
            </h4>
            <p>
              NoteNest features a built-in empirical laboratory that pits two distinct prompt engineering paradigms against each other in real-time:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 text-xs mb-1">
                  Prompt Design A: "Direct Zero-Shot"
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Executes a single concise instruction with schema constraints. Minimizes prompt token overhead, resulting in 2-3x lower latency and ultra-dense word compression.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-300 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900/70 shadow-xs">
                <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 text-xs mb-1">
                  Prompt Design B: "Structured CoT Scaffold"
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Deploys an instructional designer persona and a 4-phase reasoning protocol (concept grounding -&gt; hierarchical synthesis -&gt; exam hints -&gt; active recall). Enforces slide citations and includes few-shot demonstration examples.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Algorithmic Metrics */}
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mb-2">
              <BrainCircuit className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              Automated Evaluation Metrics
            </h4>
            <p>Every comparison run automatically computes:</p>
            <ul className="list-disc pl-5 mt-1.5 space-y-1 text-xs">
              <li><b>Concept Coverage (%):</b> Measures what fraction of high-salience TF-IDF lecture terms appear in the generated output.</li>
              <li><b>Flesch-Kincaid Grade & Reading Ease:</b> Measures readability and sentence complexity.</li>
              <li><b>Redundancy Score (%):</b> Quantifies inter-sentence semantic overlap using Jaccard and n-gram similarity.</li>
              <li><b>Hallucination Risk Check:</b> Scans generated sentences for unsupported assertions or terminology absent from the source document.</li>
              <li><b>Fine-Grained Word Diff:</b> Computes LCS sequence diffs to highlight exactly where outputs diverge.</li>
            </ul>
          </div>

          {/* Section 3: Offline Extractive Engine */}
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mb-2">
              <Zap className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              Offline Extractive Pipeline
            </h4>
            <p className="text-xs">
              If no API key is provided, NoteNest does not fail. Instead, it activates an offline pipeline using TextRank graph centrality, TF-IDF sentence scoring, and YAKE keyphrase ranking. Even offline, the Comparison Lab demonstrates real mathematical contrast between Frequency vs Graph-Centrality heuristics.
            </p>
          </div>

          {/* Section 4: Privacy & Data Protection */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Privacy & Security Policy
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              All documents are parsed locally on your server. Documents are never stored remotely or used for model training. You can permanently delete any document and run from the Library at any time.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};