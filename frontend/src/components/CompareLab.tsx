import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  Trophy,
  Scale,
  Download,
  Edit,
  RotateCcw,
  Eye,
  EyeOff,
  Vote,
  Gavel,
  Check,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CompareResponse, PromptTemplateDTO } from '../types';

interface CompareLabProps {
  comparison: CompareResponse;
  docTitle: string;
  onExportReport: (format: 'markdown' | 'pdf' | 'docx' | 'json') => void;
  onSubmitVote: (vote: {
    comparison_id: string;
    better_coverage?: 'A' | 'B' | 'Tie';
    better_conciseness?: 'A' | 'B' | 'Tie';
    better_clarity?: 'A' | 'B' | 'Tie';
    overall_winner?: 'A' | 'B' | 'Tie';
    feedback_notes?: string;
  }) => Promise<void>;
  prompts: PromptTemplateDTO[];
  onUpdatePrompt: (name: string, system: string, user: string) => Promise<void>;
  onResetPrompts: () => Promise<void>;
  onRerunComparison: () => void;
  isProcessing: boolean;
}

export const CompareLab: React.FC<CompareLabProps> = ({
  comparison,
  docTitle,
  onExportReport,
  onSubmitVote,
  prompts,
  onUpdatePrompt,
  onResetPrompts,
}) => {
  const [showDiffs, setShowDiffs] = useState(true);
  const [promptEditorOpen, setPromptEditorOpen] = useState(false);
  const [editingPromptName, setEditingPromptName] = useState<'prompt_a_direct' | 'prompt_b_structured'>('prompt_a_direct');
  const [editedSystem, setEditedSystem] = useState('');
  const [editedUser, setEditedUser] = useState('');
  const [editorSuccess, setEditorSuccess] = useState(false);

  // Voting state
  const [votes, setVotes] = useState<{
    better_coverage?: 'A' | 'B' | 'Tie';
    better_conciseness?: 'A' | 'B' | 'Tie';
    better_clarity?: 'A' | 'B' | 'Tie';
    overall_winner?: 'A' | 'B' | 'Tie';
    feedback_notes?: string;
  }>(comparison.user_votes || {});
  const [voteSaved, setVoteSaved] = useState(false);

  const ma = comparison.metrics_a;
  const mb = comparison.metrics_b;

  // Radar chart normalized data
  const radarData = [
    {
      metric: 'Concept Coverage',
      PromptA: Math.round(ma.concept_coverage_pct),
      PromptB: Math.round(mb.concept_coverage_pct),
      fullMark: 100,
    },
    {
      metric: 'Readability',
      PromptA: Math.round(ma.flesch_reading_ease),
      PromptB: Math.round(mb.flesch_reading_ease),
      fullMark: 100,
    },
    {
      metric: 'Conciseness',
      PromptA: Math.min(100, Math.round((1 - Math.min(0.9, ma.compression_ratio)) * 100)),
      PromptB: Math.min(100, Math.round((1 - Math.min(0.9, mb.compression_ratio)) * 100)),
      fullMark: 100,
    },
    {
      metric: 'Low Redundancy',
      PromptA: Math.round(100 - ma.redundancy_score),
      PromptB: Math.round(100 - mb.redundancy_score),
      fullMark: 100,
    },
    {
      metric: 'Fact Grounding',
      PromptA: Math.round(100 - ma.hallucination_risk_pct),
      PromptB: Math.round(100 - mb.hallucination_risk_pct),
      fullMark: 100,
    },
  ];

  const handleVote = async (key: 'better_coverage' | 'better_conciseness' | 'better_clarity' | 'overall_winner', value: 'A' | 'B' | 'Tie') => {
    const updated = { ...votes, [key]: value };
    setVotes(updated);
    try {
      await onSubmitVote({
        comparison_id: comparison.id,
        ...updated,
      });
      setVoteSaved(true);
      setTimeout(() => setVoteSaved(false), 2000);
      if (key === 'overall_winner') {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEditor = (promptName: 'prompt_a_direct' | 'prompt_b_structured') => {
    setEditingPromptName(promptName);
    const tmpl = prompts.find((p) => p.name === promptName);
    if (tmpl) {
      setEditedSystem(tmpl.system_prompt);
      setEditedUser(tmpl.user_template);
    }
    setPromptEditorOpen(true);
  };

  const handleSavePrompt = async () => {
    try {
      await onUpdatePrompt(editingPromptName, editedSystem, editedUser);
      setEditorSuccess(true);
      setTimeout(() => setEditorSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 mb-16">
      {/* Top Banner: Verdict Card */}
      <div className="rounded-2xl bg-zinc-950 text-white dark:bg-zinc-900 border border-zinc-800 p-6 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-800/40 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              <Trophy className="h-3.5 w-3.5 text-zinc-300" />
              Automated Comparative Verdict
            </div>
            <h2 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-zinc-50">
              {comparison.verdict_summary}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Benchmarked on identical input (<span className="text-zinc-200 font-medium">{docTitle}</span>) with synchronized model temperature (0.2). Evaluates concept coverage %, Flesch-Kincaid readability, latency, and grounding support.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onExportReport('pdf')}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-zinc-900 shadow hover:bg-zinc-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF Report
            </button>
            <button
              onClick={() => onExportReport('markdown')}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition-colors border border-zinc-700"
            >
              <Download className="h-3.5 w-3.5" />
              Markdown Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Screen: Side-by-Side Outputs */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 p-5 sm:p-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800 mb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
              <Scale className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Parallel Execution Outputs
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Direct Zero-Shot (Left) vs. Structured Reasoning Scaffold (Right)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Diff Highlight Toggle */}
            <button
              onClick={() => setShowDiffs(!showDiffs)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                showDiffs
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              {showDiffs ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span>{showDiffs ? 'Word Diff Highlighting: ON' : 'Word Diff Highlighting: OFF'}</span>
            </button>

            {/* Prompt Editor Buttons */}
            <button
              onClick={() => handleOpenEditor('prompt_a_direct')}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <Edit className="h-3.5 w-3.5 text-zinc-400" />
              Edit Prompts
            </button>
          </div>
        </div>

        {/* Side-by-Side Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUMN 1: PROMPT DESIGN A (DIRECT) */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-[11px] font-mono font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      Prompt A
                    </span>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Direct (Zero-Shot)
                    </h4>
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Concise zero-shot task instruction with schema constraints.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenEditor('prompt_a_direct')}
                  title="Inspect Prompt A"
                  className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-semibold"
                >
                  View Template
                </button>
              </div>

              {/* Output Content */}
              <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert leading-relaxed">
                {showDiffs ? (
                  <div className="text-xs sm:text-sm font-normal">
                    {comparison.diff_data.map((seg, idx) => {
                      if (seg.type === 'delete') {
                        return (
                          <span
                            key={idx}
                            className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 px-1 py-0.5 rounded mx-0.5"
                            title="Present only in Prompt A"
                          >
                            {seg.text}
                          </span>
                        );
                      }
                      if (seg.type === 'equal') {
                        return <span key={idx}>{seg.text}</span>;
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {comparison.output_a.summary}
                  </ReactMarkdown>
                )}
              </div>

              {/* Concepts preview for Prompt A */}
              {comparison.output_a.key_concepts && comparison.output_a.key_concepts.length > 0 && (
                <div className="mt-5 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                  <h5 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                    Key Concepts Identified ({comparison.output_a.key_concepts.length})
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {comparison.output_a.key_concepts.map((c, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-white border border-zinc-200 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                        title={c.definition}
                      >
                        <b>{c.term}</b>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats Pill */}
            <div className="mt-6 flex items-center justify-between rounded-lg bg-white p-2.5 border border-zinc-200 text-xs text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
              <span className="font-mono">{ma.word_count} words • {ma.latency_ms} ms</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Coverage: {ma.concept_coverage_pct}%
              </span>
            </div>
          </div>

          {/* COLUMN 2: PROMPT DESIGN B (STRUCTURED) */}
          <div className="rounded-xl border border-zinc-300 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900/60 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-2 py-0.5 text-[11px] font-mono font-semibold">
                      Prompt B
                    </span>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Structured (Master Tutor Scaffold)
                    </h4>
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Master Tutor persona, 4-phase cognitive reasoning, slide citations & few-shot demonstration.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenEditor('prompt_b_structured')}
                  title="Inspect Prompt B"
                  className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-semibold"
                >
                  View Template
                </button>
              </div>

              {/* Output Content */}
              <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert leading-relaxed">
                {showDiffs ? (
                  <div className="text-xs sm:text-sm font-normal">
                    {comparison.diff_data.map((seg, idx) => {
                      if (seg.type === 'insert') {
                        return (
                          <span
                            key={idx}
                            className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 px-1 py-0.5 rounded font-medium mx-0.5"
                            title="Present only in Prompt B"
                          >
                            {seg.text}
                          </span>
                        );
                      }
                      if (seg.type === 'equal') {
                        return <span key={idx}>{seg.text}</span>;
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {comparison.output_b.summary}
                  </ReactMarkdown>
                )}
              </div>

              {/* Concepts preview for Prompt B with citations */}
              {comparison.output_b.key_concepts && comparison.output_b.key_concepts.length > 0 && (
                <div className="mt-5 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                  <h5 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                    Key Concepts with Citations ({comparison.output_b.key_concepts.length})
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {comparison.output_b.key_concepts.map((c, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-zinc-50 border border-zinc-200 px-2 py-1 text-xs text-zinc-800 dark:bg-zinc-800/80 dark:border-zinc-700 dark:text-zinc-200"
                        title={`${c.definition} [${c.source_reference}]`}
                      >
                        <b>{c.term}</b>{' '}
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                          [{c.source_reference}]
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats Pill */}
            <div className="mt-6 flex items-center justify-between rounded-lg bg-zinc-50 p-2.5 border border-zinc-200 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:border-zinc-750 dark:text-zinc-400">
              <span className="font-mono">{mb.word_count} words • {mb.latency_ms} ms</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Coverage: {mb.concept_coverage_pct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics: Radar Chart & Metrics Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Multi-Dimensional Evaluation Radar
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Normalized score comparison (0 to 100) across Coverage, Readability, Conciseness, Redundancy, and Grounding.
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#71717a" strokeOpacity={0.25} />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#71717a', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#71717a" strokeOpacity={0.3} />
                  <Radar
                    name="Prompt A (Direct)"
                    dataKey="PromptA"
                    stroke="#71717a"
                    fill="#71717a"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="Prompt B (Structured)"
                    dataKey="PromptB"
                    stroke="#18181b"
                    fill="#18181b"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400">Prompt A (Direct)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Prompt B (Structured)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition-colors">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                Objective NLP Metrics Table
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Rigorous algorithmic measurement per prompt design.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  <th className="py-2.5">Metric</th>
                  <th className="py-2.5 text-zinc-600 dark:text-zinc-400">Prompt A</th>
                  <th className="py-2.5 text-zinc-900 dark:text-zinc-100 font-semibold">Prompt B</th>
                  <th className="py-2.5">Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono text-xs">
                <tr>
                  <td className="py-2.5 font-sans font-medium text-zinc-700 dark:text-zinc-300">Word Count</td>
                  <td className="py-2.5">{ma.word_count}</td>
                  <td className="py-2.5">{mb.word_count}</td>
                  <td className="py-2.5 font-sans font-semibold text-zinc-600 dark:text-zinc-400">
                    {ma.word_count < mb.word_count ? 'A (Brevity)' : 'B (Depth)'}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 font-sans font-medium text-zinc-700 dark:text-zinc-300">Compression Ratio</td>
                  <td className="py-2.5">{ma.compression_ratio}</td>
                  <td className="py-2.5">{mb.compression_ratio}</td>
                  <td className="py-2.5 font-sans font-semibold text-zinc-800 dark:text-zinc-200">
                    {ma.compression_ratio < mb.compression_ratio ? 'A (+Dense)' : 'B'}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 font-sans font-medium text-zinc-700 dark:text-zinc-300">Latency</td>
                  <td className="py-2.5">{ma.latency_ms} ms</td>
                  <td className="py-2.5">{mb.latency_ms} ms</td>
                  <td className="py-2.5 font-sans font-semibold text-zinc-700 dark:text-zinc-300">
                    {ma.latency_ms < mb.latency_ms ? 'A (Faster)' : 'B'}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 font-sans font-medium text-zinc-700 dark:text-zinc-300">Concept Coverage</td>
                  <td className="py-2.5 font-bold text-zinc-900 dark:text-white">{ma.concept_coverage_pct}%</td>
                  <td className="py-2.5 font-bold text-zinc-900 dark:text-white">{mb.concept_coverage_pct}%</td>
                  <td className="py-2.5 font-sans font-semibold text-emerald-600 dark:text-emerald-400">
                    {mb.concept_coverage_pct >= ma.concept_coverage_pct ? 'B (Superior)' : 'A'}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 font-sans font-medium text-zinc-700 dark:text-zinc-300">Flesch-Kincaid Grade</td>
                  <td className="py-2.5">Grade {ma.flesch_kincaid_grade}</td>
                  <td className="py-2.5">Grade {mb.flesch_kincaid_grade}</td>
                  <td className="py-2.5 font-sans font-semibold text-zinc-600 dark:text-zinc-400">
                    College Level
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 font-sans font-medium text-zinc-700 dark:text-zinc-300">Redundancy Score</td>
                  <td className="py-2.5">{ma.redundancy_score}%</td>
                  <td className="py-2.5">{mb.redundancy_score}%</td>
                  <td className="py-2.5 font-sans font-semibold text-zinc-600 dark:text-zinc-400">
                    {ma.redundancy_score <= mb.redundancy_score ? 'A (Minimal)' : 'B'}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 font-sans font-medium text-zinc-700 dark:text-zinc-300">Hallucination Risk</td>
                  <td className="py-2.5">{ma.hallucination_risk_pct}%</td>
                  <td className="py-2.5">{mb.hallucination_risk_pct}%</td>
                  <td className="py-2.5 font-sans font-semibold text-emerald-600 dark:text-emerald-400">
                    Grounded
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* LLM Judge & Human Voting Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LLM-as-a-Judge Evaluation */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition-colors">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                LLM-as-a-Judge Assessment
              </h3>
            </div>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-zinc-700 ring-1 ring-inset ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 uppercase tracking-wide">
              Model Evaluated
            </span>
          </div>

          {comparison.llm_judge ? (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 italic bg-zinc-50 p-3 rounded-xl border border-zinc-200/80 dark:bg-zinc-900/60 dark:border-zinc-800">
                "{comparison.llm_judge.comparison_summary}"
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Score A */}
                <div className="rounded-xl border border-zinc-200 p-3 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                    Prompt A Scores (1-5)
                  </div>
                  <div className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                    <div className="flex justify-between"><span>Faithfulness:</span> <span className="font-bold">{comparison.llm_judge.score_a.faithfulness}/5</span></div>
                    <div className="flex justify-between"><span>Coverage:</span> <span className="font-bold">{comparison.llm_judge.score_a.coverage}/5</span></div>
                    <div className="flex justify-between"><span>Clarity:</span> <span className="font-bold">{comparison.llm_judge.score_a.clarity}/5</span></div>
                    <div className="flex justify-between"><span>Conciseness:</span> <span className="font-bold">{comparison.llm_judge.score_a.conciseness}/5</span></div>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                    {comparison.llm_judge.score_a.rationale}
                  </p>
                </div>

                {/* Score B */}
                <div className="rounded-xl border border-zinc-300 p-3 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-900/80">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Prompt B Scores (1-5)
                  </div>
                  <div className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                    <div className="flex justify-between"><span>Faithfulness:</span> <span className="font-bold">{comparison.llm_judge.score_b.faithfulness}/5</span></div>
                    <div className="flex justify-between"><span>Coverage:</span> <span className="font-bold">{comparison.llm_judge.score_b.coverage}/5</span></div>
                    <div className="flex justify-between"><span>Clarity:</span> <span className="font-bold">{comparison.llm_judge.score_b.clarity}/5</span></div>
                    <div className="flex justify-between"><span>Conciseness:</span> <span className="font-bold">{comparison.llm_judge.score_b.conciseness}/5</span></div>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                    {comparison.llm_judge.score_b.rationale}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 p-4 text-center">
              LLM Judge was not requested for this run. Enable "Run LLM Judge" in comparison controls to obtain automated 4-dimension scoring.
            </div>
          )}
        </div>

        {/* Human Rating & Preference Voting Widget */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Vote className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Human Evaluation & Voting
                </h3>
              </div>
              {voteSaved && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Votes Saved!
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              Cast your preference votes between the two designs. Votes are permanently stored in SQLite to build empirical prompt evaluation datasets.
            </p>

            <div className="space-y-3.5">
              {/* Criterion 1: Coverage */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Better Concept Coverage:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleVote('better_coverage', 'A')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      votes.better_coverage === 'A'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Prompt A
                  </button>
                  <button
                    onClick={() => handleVote('better_coverage', 'B')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      votes.better_coverage === 'B'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Prompt B
                  </button>
                  <button
                    onClick={() => handleVote('better_coverage', 'Tie')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      votes.better_coverage === 'Tie'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Tie
                  </button>
                </div>
              </div>

              {/* Criterion 2: Conciseness */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Better Conciseness / Efficiency:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleVote('better_conciseness', 'A')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      votes.better_conciseness === 'A'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Prompt A
                  </button>
                  <button
                    onClick={() => handleVote('better_conciseness', 'B')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      votes.better_conciseness === 'B'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Prompt B
                  </button>
                  <button
                    onClick={() => handleVote('better_conciseness', 'Tie')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      votes.better_conciseness === 'Tie'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Tie
                  </button>
                </div>
              </div>

              {/* Criterion 3: Overall Winner */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  Overall Preferred Output:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleVote('overall_winner', 'A')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      votes.overall_winner === 'A'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Prompt A Wins
                  </button>
                  <button
                    onClick={() => handleVote('overall_winner', 'B')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      votes.overall_winner === 'B'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Prompt B Wins
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Editor Modal */}
      {promptEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-w-2xl w-full rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Edit className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                  Prompt Template Editor
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Variables: <code className="text-zinc-800 dark:text-zinc-200 font-mono">&#123;&#123;notes&#125;&#125;</code>,{' '}
                  <code className="text-zinc-800 dark:text-zinc-200 font-mono">&#123;&#123;length&#125;&#125;</code>,{' '}
                  <code className="text-zinc-800 dark:text-zinc-200 font-mono">&#123;&#123;audience&#125;&#125;</code>,{' '}
                  <code className="text-zinc-800 dark:text-zinc-200 font-mono">&#123;&#123;language&#125;&#125;</code>
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    handleOpenEditor(
                      editingPromptName === 'prompt_a_direct' ? 'prompt_b_structured' : 'prompt_a_direct'
                    );
                  }}
                  className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Switch to {editingPromptName === 'prompt_a_direct' ? 'Prompt B' : 'Prompt A'}
                </button>
                <button
                  onClick={() => setPromptEditorOpen(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  System Instruction / Persona
                </label>
                <textarea
                  rows={4}
                  value={editedSystem}
                  onChange={(e) => setEditedSystem(e.target.value)}
                  className="w-full font-mono text-xs rounded-xl border border-zinc-300 bg-white p-3 text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  User Template
                </label>
                <textarea
                  rows={8}
                  value={editedUser}
                  onChange={(e) => setEditedUser(e.target.value)}
                  className="w-full font-mono text-xs rounded-xl border border-zinc-300 bg-white p-3 text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={async () => {
                    await onResetPrompts();
                    const tmpl = prompts.find((p) => p.name === editingPromptName);
                    if (tmpl) {
                      setEditedSystem(tmpl.system_prompt);
                      setEditedUser(tmpl.user_template);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to Baseline Defaults
                </button>

                <div className="flex items-center gap-2">
                  {editorSuccess && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Saved!
                    </span>
                  )}
                  <button
                    onClick={handleSavePrompt}
                    className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-sm"
                  >
                    Save & Apply Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};