import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { UploadZone } from './components/UploadZone';
import { DocumentPreview } from './components/DocumentPreview';
import { ControlsBar } from './components/ControlsBar';
import { ResultsView } from './components/ResultsView';
import { CompareLab } from './components/CompareLab';
import { HistorySidebar } from './components/HistorySidebar';
import { SettingsModal } from './components/SettingsModal';
import { AboutModal } from './components/AboutModal';
import { api } from './lib/api';
import { SAMPLE_LECTURE_TITLE, SAMPLE_LECTURE_TEXT } from './lib/sampleLecture';
import {
  DocumentPreview as IDocumentPreview,
  DocumentListItem,
  StudyPackageOutput,
  CompareResponse,
  PromptTemplateDTO,
  SettingsDTO,
} from './types';
import { Loader2, AlertCircle, Sparkles, BookOpen, Layers } from 'lucide-react';

export const App: React.FC = () => {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem('notenest_theme') === 'dark' ||
      (!('notenest_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('notenest_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('notenest_theme', 'light');
    }
  }, [isDark]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'studio' | 'compare' | 'library'>('studio');

  // Core Data State
  const [currentDocument, setCurrentDocument] = useState<IDocumentPreview | null>(null);
  const [summaryOutput, setSummaryOutput] = useState<StudyPackageOutput | null>(null);
  const [comparisonOutput, setComparisonOutput] = useState<CompareResponse | null>(null);
  const [historyDocs, setHistoryDocs] = useState<DocumentListItem[]>([]);
  const [prompts, setPrompts] = useState<PromptTemplateDTO[]>([]);
  const [settings, setSettings] = useState<SettingsDTO>({
    has_gemini_api_key: false,
    gemini_api_key_masked: '',
    active_model: 'gemini-1.5-flash',
    temperature: 0.2,
    default_summary_mode: 'short',
    default_audience: 'intermediate',
    offline_available: true,
    available_models: [],
  });

  // Controls State
  const [summaryMode, setSummaryMode] = useState<'short' | 'detailed' | 'custom'>('short');
  const [targetWords, setTargetWords] = useState<number>(200);
  const [audienceLevel, setAudienceLevel] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');
  const [language, setLanguage] = useState<string>('English');
  const [generateSummary, setGenerateSummary] = useState(true);
  const [generateConcepts, setGenerateConcepts] = useState(true);
  const [generateRevision, setGenerateRevision] = useState(true);
  const [generateFlashcards, setGenerateFlashcards] = useState(true);

  // Status & Modals
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastLatency, setLastLatency] = useState<number | undefined>(undefined);
  const [lastProvider, setLastProvider] = useState<string | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Load initial settings, history, and prompts
  const refreshHistory = async () => {
    try {
      const docs = await api.listHistory();
      setHistoryDocs(docs);
    } catch (e) {
      console.error(e);
    }
  };

  const loadInitialData = async () => {
    try {
      const [s, h, p] = await Promise.all([
        api.getSettings(),
        api.listHistory(),
        api.getPrompts(),
      ]);
      setSettings(s);
      setHistoryDocs(h);
      setPrompts(p);
    } catch (e) {
      console.error('Error loading initial data:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Keyboard shortcut: Ctrl+Enter (or Cmd+Enter) to summarize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (currentDocument && !isProcessing) {
          handleSummarize();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDocument, isProcessing, summaryMode, targetWords, audienceLevel, language, generateSummary, generateConcepts, generateRevision, generateFlashcards]);

  // Load sample lecture
  const handleLoadSample = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const doc = await api.pasteText(SAMPLE_LECTURE_TITLE, SAMPLE_LECTURE_TEXT);
      setCurrentDocument(doc);
      await refreshHistory();
      setActiveTab('studio');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load sample lecture');
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload handler
  const handleUploadFile = async (file: File) => {
    const doc = await api.uploadFile(file);
    setCurrentDocument(doc);
    await refreshHistory();
    return doc;
  };

  // Paste handler
  const handlePasteText = async (title: string, text: string) => {
    const doc = await api.pasteText(title, text);
    setCurrentDocument(doc);
    await refreshHistory();
    return doc;
  };

  // Update text handler
  const handleUpdateText = async (docId: string, updatedText: string) => {
    const updated = await api.updateDocumentText(docId, updatedText);
    setCurrentDocument(updated);
  };

  // Summarize handler
  const handleSummarize = async () => {
    if (!currentDocument) {
      setErrorMessage('Please upload or select a lecture document first.');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await api.summarize({
        document_id: currentDocument.id,
        title: currentDocument.title,
        summary_mode: summaryMode,
        target_words: summaryMode === 'custom' ? targetWords : undefined,
        audience_level: audienceLevel,
        language: language,
        generate_summary: generateSummary,
        generate_concepts: generateConcepts,
        generate_revision_points: generateRevision,
        generate_flashcards: generateFlashcards,
        temperature: settings.temperature,
      });
      setSummaryOutput(res.output);
      setLastLatency(res.latency_ms);
      setLastProvider(res.provider_type);
      await refreshHistory();
    } catch (err: any) {
      setErrorMessage(err.message || 'Summarization failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Compare Lab handler
  const handleRunComparison = async () => {
    if (!currentDocument) {
      setErrorMessage('Please upload or select a lecture document first.');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await api.compare({
        document_id: currentDocument.id,
        title: currentDocument.title,
        summary_mode: summaryMode,
        target_words: summaryMode === 'custom' ? targetWords : undefined,
        audience_level: audienceLevel,
        language: language,
        run_llm_judge: settings.has_gemini_api_key,
      });
      setComparisonOutput(res);
      setActiveTab('compare');
      await refreshHistory();
    } catch (err: any) {
      setErrorMessage(err.message || 'Comparison run failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Select document from library
  const handleSelectHistoryDocument = async (docId: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const doc = await api.getDocument(docId);
      setCurrentDocument({
        id: doc.id,
        title: doc.title,
        filename: doc.filename,
        file_type: doc.file_type,
        file_size: doc.file_size,
        page_count: doc.page_count,
        word_count: doc.word_count,
        est_reading_time_minutes: doc.est_reading_time_minutes,
        pages: doc.pages,
        warnings: [],
      });

      if (doc.latest_summary) {
        setSummaryOutput({
          summary: doc.latest_summary.summary_text,
          key_concepts: JSON.parse(doc.latest_summary.key_concepts || '[]'),
          revision_points: JSON.parse(doc.latest_summary.revision_points || '[]'),
          flashcards: JSON.parse(doc.latest_summary.flashcards || '[]'),
        });
      } else {
        setSummaryOutput(null);
      }

      if (doc.latest_comparison) {
        setComparisonOutput({
          id: doc.latest_comparison.id,
          document_id: doc.latest_comparison.document_id,
          prompt_a_name: doc.latest_comparison.prompt_a_name,
          prompt_b_name: doc.latest_comparison.prompt_b_name,
          output_a: JSON.parse(doc.latest_comparison.output_a || '{}'),
          output_b: JSON.parse(doc.latest_comparison.output_b || '{}'),
          metrics_a: JSON.parse(doc.latest_comparison.metrics_a || '{}'),
          metrics_b: JSON.parse(doc.latest_comparison.metrics_b || '{}'),
          diff_data: JSON.parse(doc.latest_comparison.diff_data || '[]'),
          llm_judge: JSON.parse(doc.latest_comparison.llm_judge || '{}'),
          verdict_summary: doc.latest_comparison.verdict_summary || '',
          user_votes: JSON.parse(doc.latest_comparison.user_votes || '{}'),
          created_at: doc.latest_comparison.created_at,
        });
      }

      setActiveTab('studio');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to open document');
    } finally {
      setIsProcessing(false);
    }
  };

  // Document Library operations
  const handlePinDoc = async (id: string) => {
    await api.togglePin(id);
    await refreshHistory();
  };

  const handleRenameDoc = async (id: string, title: string) => {
    await api.renameDocument(id, title);
    if (currentDocument?.id === id) {
      setCurrentDocument((prev) => (prev ? { ...prev, title } : null));
    }
    await refreshHistory();
  };

  const handleDeleteDoc = async (id: string) => {
    await api.deleteDocument(id);
    if (currentDocument?.id === id) {
      setCurrentDocument(null);
      setSummaryOutput(null);
      setComparisonOutput(null);
    }
    await refreshHistory();
  };

  // Export handlers
  const handleExportSingle = async (format: 'markdown' | 'docx' | 'pdf' | 'json') => {
    if (!summaryOutput || !currentDocument) return;
    await api.exportFile(format, currentDocument.title, 'study_package', summaryOutput);
  };

  const handleExportComparison = async (format: 'markdown' | 'docx' | 'pdf' | 'json') => {
    if (!comparisonOutput || !currentDocument) return;
    await api.exportFile(format, `${currentDocument.title} - Prompt Comparison`, 'comparison_report', comparisonOutput);
  };

  // Prompt update handlers
  const handleUpdatePrompt = async (name: string, system: string, user: string) => {
    await api.updatePrompt(name, { system_prompt: system, user_template: user });
    const updated = await api.getPrompts();
    setPrompts(updated);
  };

  const handleResetPrompts = async () => {
    await api.resetPrompts();
    const updated = await api.getPrompts();
    setPrompts(updated);
  };

  // Settings update
  const handleUpdateSettings = async (payload: any) => {
    const updated = await api.updateSettings(payload);
    setSettings((prev) => ({
      ...prev,
      has_gemini_api_key: updated.has_gemini_api_key,
      gemini_api_key_masked: updated.gemini_api_key_masked,
      active_model: updated.active_model,
      temperature: updated.temperature,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
        onLoadSample={handleLoadSample}
        isDark={isDark}
        setIsDark={setIsDark}
        hasApiKey={settings.has_gemini_api_key}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mb-6 rounded-xl bg-rose-50 p-4 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* VIEW 1: STUDIO (SUMMARIZER) */}
        {activeTab === 'studio' && (
          <div>
            {!currentDocument && (
              <Hero
                onLoadSample={handleLoadSample}
                onExploreCompare={() => {
                  if (currentDocument) {
                    handleRunComparison();
                  } else {
                    handleLoadSample();
                  }
                }}
              />
            )}

            {/* Document Input Section */}
            {!currentDocument ? (
              <UploadZone
                onDocumentLoaded={(doc) => setCurrentDocument(doc)}
                onUploadFile={handleUploadFile}
                onPasteText={handlePasteText}
                isLoading={isProcessing}
              />
            ) : (
              <DocumentPreview
                document={currentDocument}
                onUpdateText={handleUpdateText}
                onClearDocument={() => {
                  setCurrentDocument(null);
                  setSummaryOutput(null);
                }}
              />
            )}

            {/* Controls Bar */}
            {currentDocument && (
              <ControlsBar
                summaryMode={summaryMode}
                setSummaryMode={setSummaryMode}
                targetWords={targetWords}
                setTargetWords={setTargetWords}
                audienceLevel={audienceLevel}
                setAudienceLevel={setAudienceLevel}
                language={language}
                setLanguage={setLanguage}
                generateSummary={generateSummary}
                setGenerateSummary={setGenerateSummary}
                generateConcepts={generateConcepts}
                setGenerateConcepts={setGenerateConcepts}
                generateRevision={generateRevision}
                setGenerateRevision={setGenerateRevision}
                generateFlashcards={generateFlashcards}
                setGenerateFlashcards={setGenerateFlashcards}
                onSummarize={handleSummarize}
                onOpenCompare={handleRunComparison}
                isProcessing={isProcessing}
              />
            )}

            {/* Study Results View */}
            {summaryOutput && currentDocument && (
              <ResultsView
                output={summaryOutput}
                docTitle={currentDocument.title}
                onExport={handleExportSingle}
                onRegenerate={handleSummarize}
                onSimplify={() => {
                  setSummaryMode('short');
                  handleSummarize();
                }}
                onExpand={() => {
                  setSummaryMode('detailed');
                  handleSummarize();
                }}
                latencyMs={lastLatency}
                providerType={lastProvider}
              />
            )}
          </div>
        )}

        {/* VIEW 2: PROMPT COMPARISON LAB */}
        {activeTab === 'compare' && (
          <div>
            {!comparisonOutput ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950 shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 mb-4">
                  <Layers className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  No Active Comparison Run
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                  Run Prompt Design A vs Prompt Design B on a lecture document to benchmark coverage, readability, latency, and faithfulness side by side.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={async () => {
                      if (!currentDocument) await handleLoadSample();
                      handleRunComparison();
                    }}
                    className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-colors"
                  >
                    <Layers className="h-4 w-4" />
                    Run Lab on Sample Lecture
                  </button>
                  <button
                    onClick={() => setActiveTab('studio')}
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    Back to Studio
                  </button>
                </div>
              </div>
            ) : (
              <CompareLab
                comparison={comparisonOutput}
                docTitle={currentDocument?.title || 'Lecture Document'}
                onExportReport={handleExportComparison}
                onSubmitVote={api.submitVote}
                prompts={prompts}
                onUpdatePrompt={handleUpdatePrompt}
                onResetPrompts={handleResetPrompts}
                onRerunComparison={handleRunComparison}
                isProcessing={isProcessing}
              />
            )}
          </div>
        )}

        {/* VIEW 3: DOCUMENT LIBRARY */}
        {activeTab === 'library' && (
          <HistorySidebar
            documents={historyDocs}
            onSelectDocument={handleSelectHistoryDocument}
            onPinDocument={handlePinDoc}
            onRenameDocument={handleRenameDoc}
            onDeleteDocument={handleDeleteDoc}
          />
        )}
      </main>

      {/* Modals */}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-950 transition-colors mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-800 dark:text-zinc-200">NoteNest</span>
            <span>•</span>
            <span>Academic Lecture Synthesis Studio & Prompt Comparison Lab</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setAboutOpen(true)} className="hover:text-zinc-800 dark:hover:text-zinc-200">
              Methodology & FAQ
            </button>
            <button onClick={() => setSettingsOpen(true)} className="hover:text-zinc-800 dark:hover:text-zinc-200">
              API Settings
            </button>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
