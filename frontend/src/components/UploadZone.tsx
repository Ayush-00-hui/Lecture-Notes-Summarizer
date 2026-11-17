import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Clipboard,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  FileText,
  FileCode,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { formatBytes } from '../lib/utils';
import { DocumentPreview } from '../types';

interface UploadZoneProps {
  onDocumentLoaded: (doc: DocumentPreview) => void;
  onUploadFile: (file: File) => Promise<DocumentPreview>;
  onPasteText: (title: string, text: string) => Promise<DocumentPreview>;
  isLoading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onDocumentLoaded,
  onUploadFile,
  onPasteText,
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

  // Drag and drop handlers
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
    // Validate size (20MB)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg(`File size (${formatBytes(file.size)}) exceeds the 20 MB limit.`);
      return;
    }

    // Validate type
    const validExtensions = ['.pdf', '.pptx', '.ppt', '.docx', '.txt', '.md', '.markdown'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));
    if (!hasValidExt) {
      setErrorMsg('Unsupported format. Please upload PDF, PPTX, DOCX, TXT, or MD files.');
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
      setTimeout(() => setUploadProgress(null), 500);
      onDocumentLoaded(doc);
    } catch (err: any) {
      setUploadProgress(null);
      setErrorMsg(err.message || 'Failed to process document');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
      e.target.value = '';
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteContent.trim()) {
      setErrorMsg('Please paste some lecture notes text before continuing.');
      return;
    }
    setErrorMsg(null);
    try {
      setUploadProgress(50);
      const effectiveTitle = pasteTitle.trim() || 'Pasted Lecture Notes';
      const doc = await onPasteText(effectiveTitle, pasteContent.trim());
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 400);
      onDocumentLoaded(doc);
    } catch (err: any) {
      setUploadProgress(null);
      setErrorMsg(err.message || 'Failed to process pasted text');
    }
  };

  // Live stats for pasted text
  const pastedWords = pasteContent.trim() ? pasteContent.trim().split(/\s+/).length : 0;
  const pastedChars = pasteContent.length;
  const estReadingMinutes = (pastedWords / 200).toFixed(1);

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/90 transition-colors">
      {/* Segmented Ingestion Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-5">
        <button
          onClick={() => {
            setActiveTab('upload');
            setErrorMsg(null);
          }}
          className={`flex items-center gap-2 border-b-2 py-2 px-4 text-xs font-semibold tracking-tight transition-colors ${
            activeTab === 'upload'
              ? 'border-zinc-950 text-zinc-950 dark:border-zinc-100 dark:text-zinc-50'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <UploadCloud className="h-3.5 w-3.5" />
          <span>Upload Document</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('paste');
            setErrorMsg(null);
          }}
          className={`flex items-center gap-2 border-b-2 py-2 px-4 text-xs font-semibold tracking-tight transition-colors ${
            activeTab === 'paste'
              ? 'border-zinc-950 text-zinc-950 dark:border-zinc-100 dark:text-zinc-50'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Clipboard className="h-3.5 w-3.5" />
          <span>Paste Notes Text</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-rose-50/80 p-3 text-xs text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Tab 1: File Upload */}
      {activeTab === 'upload' ? (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 sm:p-11 text-center transition-all duration-200 ${
              isDragging
                ? 'border-zinc-950 bg-zinc-50 dark:border-zinc-200 dark:bg-zinc-800/60 scale-[1.005]'
                : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50/50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-850/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.pptx,.ppt,.docx,.txt,.md"
              className="hidden"
            />

            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100/80 text-zinc-700 group-hover:scale-105 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 transition-transform">
              {isLoading || uploadProgress !== null ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <UploadCloud className="h-5 w-5" />
              )}
            </div>

            <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Drag & drop lecture files here, or{' '}
              <span className="font-semibold underline underline-offset-2 text-zinc-950 dark:text-zinc-50">
                browse files
              </span>
            </p>

            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Supports PDF, PPTX (slides & speaker notes), Word (.docx), TXT, and Markdown up to 20 MB.
            </p>

            {/* Badges of supported formats */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300">
                PDF
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300">
                PPTX (with Notes)
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300">
                DOCX
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300">
                TXT / MD
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {uploadProgress !== null && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                <span>Extracting document structure...</span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full bg-zinc-950 transition-all duration-300 dark:bg-zinc-100 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: Paste Text */
        <div>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Lecture Title (Optional)
            </label>
            <input
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="e.g. CS244: Advanced Computer Networks — BGP & OSPF"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-850 dark:text-white dark:placeholder:text-zinc-500"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between mb-1 gap-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Notes Content (Markdown & Slide Delimiters Supported)
              </label>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <span>{pastedChars.toLocaleString()} chars</span>
                <span>•</span>
                <span>{pastedWords.toLocaleString()} words</span>
                <span>•</span>
                <span>~{estReadingMinutes} min read</span>
              </div>
            </div>
            <textarea
              rows={8}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste raw lecture notes, slide transcripts, or markdown here... Denominate slides using '--- Slide X ---' or '### Slide X'."
              className="w-full font-mono text-xs sm:text-sm rounded-lg border border-zinc-300 bg-white p-3.5 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-100 dark:placeholder:text-zinc-500 leading-relaxed"
            />
          </div>

          <div className="mt-4 flex items-center justify-end">
            <button
              onClick={handlePasteSubmit}
              disabled={isLoading || !pasteContent.trim()}
              className="flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>Process Pasted Notes</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
