import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText,
  Download,
  Copy,
  Check,
  Upload,
  Loader2,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCode,
  FileType,
  Braces,
} from 'lucide-react';
import { StudyPackageOutput, DocumentPreview } from '../types';

export type ExportFormat = 'pdf' | 'docx' | 'markdown' | 'txt' | 'json';

interface ResultsViewProps {
  document: DocumentPreview;
  output: StudyPackageOutput;
  summaryMode: 'short' | 'detailed';
  onChangeMode: (mode: 'short' | 'detailed') => void;
  onExport: (format: ExportFormat) => Promise<void>;
  onNewUpload: () => void;
  isRegenerating: boolean;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  document: doc,
  output,
  summaryMode,
  onChangeMode,
  onExport,
  onNewUpload,
  isRegenerating,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFormat | null>(null);
  const [showSourceText, setShowSourceText] = useState(false);

  const handleDownload = async (format: ExportFormat) => {
    try {
      setDownloadingFormat(format);
      await onExport(format);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleCopyAll = () => {
    const parts: string[] = [doc.title, '', 'SUMMARY', output.summary];
    if (output.key_concepts && output.key_concepts.length > 0) {
      parts.push('', 'KEY CONCEPTS');
      output.key_concepts.forEach((c) => {
        const ref = c.source_reference ? ` (${c.source_reference})` : '';
        parts.push(`- ${c.term}${ref}: ${c.definition}`);
      });
    }
    if (output.revision_points && output.revision_points.length > 0) {
      parts.push('', 'KEY REVISION POINTS');
      output.revision_points.forEach((r) => {
        parts.push(`- [${r.topic}] ${r.point}`);
      });
    }
    navigator.clipboard.writeText(parts.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadButtons: { format: ExportFormat; label: string; ext: string; icon: React.ReactNode }[] = [
    { format: 'pdf', label: 'PDF', ext: '.pdf', icon: <FileText className="h-3.5 w-3.5" /> },
    { format: 'docx', label: 'Word', ext: '.docx', icon: <FileType className="h-3.5 w-3.5" /> },
    { format: 'markdown', label: 'Markdown', ext: '.md', icon: <FileCode className="h-3.5 w-3.5" /> },
    { format: 'txt', label: 'Text', ext: '.txt', icon: <FileText className="h-3.5 w-3.5" /> },
    { format: 'json', label: 'JSON', ext: '.json', icon: <Braces className="h-3.5 w-3.5" /> },
  ];

  const unitLabel = doc.file_type.toLowerCase().includes('ppt') ? 'slides' : 'pages';

  return (
    <div className="space-y-5">
      {/* Top File Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-zinc-200/90 bg-white px-5 py-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-mono font-semibold uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {doc.file_type || 'DOC'}
            </span>
            <h2 className="truncate text-base sm:text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              {doc.title}
            </h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {doc.page_count} {unitLabel} · {doc.word_count.toLocaleString()} source words · ~{doc.est_reading_time_minutes} min original read
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Short vs Detailed Toggle */}
          <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              disabled={isRegenerating}
              onClick={() => summaryMode !== 'short' && onChangeMode('short')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                summaryMode === 'short'
                  ? 'bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Short
            </button>
            <button
              type="button"
              disabled={isRegenerating}
              onClick={() => summaryMode !== 'detailed' && onChangeMode('detailed')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                summaryMode === 'detailed'
                  ? 'bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Detailed
            </button>
          </div>

          <button
            type="button"
            onClick={onNewUpload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Another</span>
          </button>
        </div>
      </div>

      {/* Prominent Download / Export Strip */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 sm:px-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <Download className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
            <span>Download Summary</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {downloadButtons.map((btn) => {
              const isBusy = downloadingFormat === btn.format;
              const isPrimary = btn.format === 'pdf';
              return (
                <button
                  key={btn.format}
                  type="button"
                  disabled={downloadingFormat !== null}
                  onClick={() => handleDownload(btn.format)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                    isPrimary
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white shadow-xs'
                      : 'border border-zinc-200 bg-zinc-50/80 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : btn.icon}
                  <span>{btn.label}</span>
                  <span className="opacity-60 font-mono text-[10px]">{btn.ext}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main In-App Summarized Content */}
      <div className="relative rounded-2xl border border-zinc-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 overflow-hidden">
        {isRegenerating && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs dark:bg-zinc-950/80">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-900 dark:text-zinc-100" />
            <p className="mt-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Updating to {summaryMode} summary...
            </p>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Summary */}
          <section>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <FileText className="h-4 w-4 text-zinc-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Summary
              </h3>
            </div>
            <div className="space-y-4 text-sm sm:text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 mt-5 mb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 mt-5 mb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm sm:text-base font-semibold text-zinc-950 dark:text-zinc-50 mt-5 first:mt-0 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3 last:mb-0">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 space-y-2 my-3 text-zinc-700 dark:text-zinc-300">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 space-y-2 my-3 text-zinc-700 dark:text-zinc-300">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => (
                    <strong className="font-semibold text-zinc-950 dark:text-zinc-100">
                      {children}
                    </strong>
                  ),
                }}
              >
                {output.summary}
              </ReactMarkdown>
            </div>
          </section>

          {/* Section 2: Key Concepts */}
          {output.key_concepts && output.key_concepts.length > 0 && (
            <section>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-zinc-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Key Concepts
                  </h3>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {output.key_concepts.length} items
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {output.key_concepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {concept.term}
                      </h4>
                      {concept.source_reference && (
                        <span className="shrink-0 rounded bg-zinc-200/70 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          {concept.source_reference}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {concept.definition}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Key Revision Points */}
          {output.revision_points && output.revision_points.length > 0 && (
            <section>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-zinc-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Key Revision Points
                  </h3>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {output.revision_points.length} points
                </span>
              </div>

              <ul className="space-y-3">
                {output.revision_points.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-zinc-200/70 bg-zinc-50/40 px-4 py-3 dark:border-zinc-800/80 dark:bg-zinc-950/40"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                    <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {item.topic && (
                        <span className="mr-1.5 font-semibold text-zinc-950 dark:text-zinc-50">
                          {item.topic}:
                        </span>
                      )}
                      <span>{item.point}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Collapsible Extracted Source Text (Optional Reference) */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSourceText(!showSourceText)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors"
        >
          <span>View Extracted Source Text ({doc.page_count} {unitLabel})</span>
          {showSourceText ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showSourceText && (
          <div className="border-t border-zinc-200/80 dark:border-zinc-800 p-5 max-h-80 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50 space-y-4">
            {(doc.pages || []).map((page) => (
              <div key={page.page_number} className="space-y-1">
                <p className="text-[11px] font-mono font-semibold uppercase text-zinc-400">
                  {unitLabel === 'slides' ? 'Slide' : 'Page'} {page.page_number}
                  {page.title ? ` — ${page.title}` : ''}
                </p>
                <p className="whitespace-pre-wrap font-sans text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {page.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
