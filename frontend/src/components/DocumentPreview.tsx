import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Layers,
  Edit3,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Save,
  Presentation,
} from 'lucide-react';
import { DocumentPreview as IDocumentPreview } from '../types';

interface DocumentPreviewProps {
  document: IDocumentPreview;
  onUpdateText: (docId: string, updatedFullText: string) => Promise<void>;
  onClearDocument: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  onUpdateText,
  onClearDocument,
}) => {
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [editedPages, setEditedPages] = useState<{ [pageNum: number]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state when document changes
  useEffect(() => {
    setCurrentPageIdx(0);
    const initialEdits: { [pageNum: number]: string } = {};
    document.pages.forEach((p) => {
      initialEdits[p.page_number] = p.text;
    });
    setEditedPages(initialEdits);
  }, [document.id]);

  const currentPage = document.pages[currentPageIdx] || {
    page_number: 1,
    title: 'Page 1',
    text: document.pages[0]?.text || '',
  };

  const currentText = editedPages[currentPage.page_number] ?? currentPage.text;

  const handleTextChange = (text: string) => {
    setEditedPages((prev) => ({
      ...prev,
      [currentPage.page_number]: text,
    }));
    setSaveSuccess(false);
  };

  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      // Reconstruct full text from edited pages
      const fullTextParts = document.pages.map((p) => {
        const text = editedPages[p.page_number] ?? p.text;
        const titleTag = p.title ? `--- ${p.title} ---` : `--- Page ${p.page_number} ---`;
        return `${titleTag}\n${text}`;
      });
      const reconstructed = fullTextParts.join('\n\n');
      await onUpdateText(document.id, reconstructed);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/90 transition-colors mb-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-4 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              <FileText className="h-4 w-4" />
            </span>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {document.title}
            </h3>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            {document.filename} ({document.file_type})
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-mono font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-850 dark:text-zinc-300">
            <Layers className="h-3.5 w-3.5 text-zinc-500" />
            {document.page_count} {document.file_type.includes('presentation') ? 'Slides' : 'Pages / Chunks'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-mono font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-850 dark:text-zinc-300">
            <Edit3 className="h-3.5 w-3.5 text-zinc-500" />
            {document.word_count.toLocaleString()} words
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-mono font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-850 dark:text-zinc-300">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            ~{document.est_reading_time_minutes} min read
          </span>

          <button
            onClick={onClearDocument}
            className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
          >
            Change File
          </button>
        </div>
      </div>

      {/* Warnings Banner if any */}
      {document.warnings && document.warnings.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50/80 p-3 text-xs text-amber-900 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold">Document Notice: </span>
              {document.warnings.join(' ')}
            </div>
          </div>
        </div>
      )}

      {/* Slide / Page Carousel Selector */}
      {document.pages.length > 1 && (
        <div className="mt-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[calc(100%-80px)]">
            {document.pages.map((p, idx) => (
              <button
                key={p.page_number}
                onClick={() => setCurrentPageIdx(idx)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  currentPageIdx === idx
                    ? 'bg-zinc-950 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                {p.title || `Part ${p.page_number}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setCurrentPageIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentPageIdx === 0}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 disabled:opacity-30 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 px-1">
              {currentPageIdx + 1}/{document.pages.length}
            </span>
            <button
              onClick={() => setCurrentPageIdx((prev) => Math.min(document.pages.length - 1, prev + 1))}
              disabled={currentPageIdx === document.pages.length - 1}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 disabled:opacity-30 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Editable Extracted Text per Page */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Edit3 className="h-3.5 w-3.5 text-zinc-400" />
            Extracted Content ({currentPage.title || `Slide ${currentPage.page_number}`})
            <span className="text-zinc-400 font-normal"> — Editable before summarizing</span>
          </span>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="h-3.5 w-3.5" /> Saved!
              </span>
            )}
            <button
              onClick={handleSaveEdits}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Edits</span>
            </button>
          </div>
        </div>

        <textarea
          rows={7}
          value={currentText}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full font-mono text-xs sm:text-sm rounded-lg border border-zinc-300 bg-zinc-50/60 p-3.5 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:focus:bg-zinc-900 leading-relaxed"
        />

        {currentPage.notes && (
          <div className="mt-2.5 rounded-md border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-850 dark:text-zinc-300">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">[Speaker Notes]: </span>
            {currentPage.notes}
          </div>
        )}
      </div>
    </div>
  );
};
