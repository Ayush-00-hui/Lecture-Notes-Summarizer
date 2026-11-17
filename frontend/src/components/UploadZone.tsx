import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  AlertCircle,
  X,
  Loader2,
  FileText,
  Presentation,
  Clipboard,
  Sparkles,
} from 'lucide-react';
import { formatBytes } from '../lib/utils';
import { DocumentPreview } from '../types';

interface UploadZoneProps {
  onDocumentLoaded: (doc: DocumentPreview) => void;
  onUploadFile: (file: File) => Promise<DocumentPreview>;
  onPasteText: (title: string, text: string) => Promise<DocumentPreview>;
  onLoadSample: () => void;
  summaryMode: 'short' | 'detailed';
  setSummaryMode: (mode: 'short' | 'detailed') => void;
  isLoading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onDocumentLoaded,
  onUploadFile,
  onPasteText,
  onLoadSample,
  summaryMode,
  setSummaryMode,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Paste state
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg(`File size (${formatBytes(file.size)}) exceeds the 20 MB limit.`);
      return;
    }

    const validExtensions = ['.pdf', '.pptx', '.ppt', '.docx', '.txt', '.md', '.markdown'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));
    if (!hasValidExt) {
      setErrorMsg('Unsupported file type. Please upload a PDF, PPT/PPTX, DOCX, or TXT file.');
      return;
    }

    try {
      setUploadProgress(25);
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev && prev < 90 ? prev + 20 : prev));
      }, 150);

      const doc = await onUploadFile(file);
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 400);
      onDocumentLoaded(doc);
    } catch (err: any) {
      setUploadProgress(null);
      setErrorMsg(err.message || 'Failed to read document. Please try another file.');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!pasteContent.trim() || pasteContent.trim().length < 20) {
      setErrorMsg('Please paste at least 20 characters of lecture notes.');
      return;
    }

    try {
      const title = pasteTitle.trim() || 'Pasted Lecture Notes';
      const doc = await onPasteText(title, pasteContent.trim());
      onDocumentLoaded(doc);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process pasted text.');
    }
  };

  const wordCount = pasteContent.trim() ? pasteContent.trim().split(/\s+/).length : 0;

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 overflow-hidden transition-colors">
      {/* Top Bar: Mode & Input Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/80 px-5 py-3.5 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40">
        {/* Upload vs Paste Switch */}
        <div className="inline-flex items-center rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800/80 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-zinc-950 shadow-xs dark:bg-zinc-900 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload PPT / PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'paste'
                ? 'bg-white text-zinc-950 shadow-xs dark:bg-zinc-900 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Clipboard className="h-3.5 w-3.5" />
            <span>Paste Text</span>
          </button>
        </div>

        {/* Summary Length Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-zinc-500 dark:text-zinc-400">Length:</span>
          <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setSummaryMode('short')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                summaryMode === 'short'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Short
            </button>
            <button
              type="button"
              onClick={() => setSummaryMode('detailed')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                summaryMode === 'detailed'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Detailed
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mx-6 mt-5 flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-700"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="p-6 sm:p-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all ${
              isDragging
                ? 'border-zinc-900 bg-zinc-100/80 dark:border-zinc-100 dark:bg-zinc-800/70'
                : 'border-zinc-300 bg-zinc-50/50 hover:border-zinc-500 hover:bg-zinc-100/50 dark:border-zinc-700 dark:bg-zinc-950/30 dark:hover:border-zinc-500 dark:hover:bg-zinc-900/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.pptx,.ppt,.docx,.txt,.md,.markdown"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />

            {uploadProgress !== null || isLoading ? (
              <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-800 dark:text-zinc-200" />
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {uploadProgress !== null
                    ? `Uploading & reading document... ${uploadProgress}%`
                    : 'Generating summary...'}
                </p>
                {uploadProgress !== null && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-800 shadow-xs group-hover:scale-105 transition-transform dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-800 shadow-xs group-hover:scale-105 transition-transform dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                    <Presentation className="h-5 w-5" />
                  </div>
                </div>

                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Drop your PPT or PDF here, or click to browse
                </p>
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Supports <span className="font-medium text-zinc-700 dark:text-zinc-300">PDF, PPTX, PPT, DOCX, TXT</span> up to 20 MB
                </p>

                <button
                  type="button"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Choose File</span>
                </button>
              </>
            )}
          </div>

          {/* Quick sample button */}
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={onLoadSample}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Don't have a file handy? Try with a sample lecture</span>
            </button>
          </div>
        </div>
      )}

      {/* Paste Tab */}
      {activeTab === 'paste' && (
        <form onSubmit={handlePasteSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="paste-title"
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Document Title (optional)
            </label>
            <input
              id="paste-title"
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="e.g., Operating Systems — Week 4"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="paste-content"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Lecture Notes Content
              </label>
              <span className="text-xs text-zinc-400">{wordCount} words</span>
            </div>
            <textarea
              id="paste-content"
              rows={7}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste your lecture slides or notes here..."
              className="w-full rounded-lg border border-zinc-200 bg-white p-3.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 resize-y"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || pasteContent.trim().length < 20}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Summarizing...</span>
                </>
              ) : (
                <span>Summarize Text</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
