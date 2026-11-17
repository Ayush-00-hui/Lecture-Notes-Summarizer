import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText,
  Bookmark,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Printer,
  ChevronDown,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Minimize2,
  Maximize2,
  Tag,
  BookOpen,
  ArrowRight,
  Search,
  Volume2,
  VolumeX,
  Lightbulb,
  AlertTriangle,
  Code,
  Shuffle,
  CheckSquare,
  Square,
  GraduationCap,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyPackageOutput, KeyConcept, RevisionPoint, Flashcard } from '../types';

interface ResultsViewProps {
  output: StudyPackageOutput;
  docTitle: string;
  onExport: (format: 'markdown' | 'docx' | 'pdf' | 'json') => void;
  onRegenerate: () => void;
  onSimplify: () => void;
  onExpand: () => void;
  latencyMs?: number;
  providerType?: string;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  output,
  docTitle,
  onExport,
  onRegenerate,
  onSimplify,
  onExpand,
  latencyMs,
  providerType,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'concepts' | 'revision' | 'flashcards'>('summary');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Audio / Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Concept state: Search, Filters & Mastery
  const [conceptSearch, setConceptSearch] = useState('');
  const [conceptImportanceFilter, setConceptImportanceFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [conceptMastery, setConceptMastery] = useState<{ [term: string]: boolean }>({});
  const [conceptViewMode, setConceptViewMode] = useState<'cards' | 'table'>('cards');

  // Revision points check state & confidence ratings
  const [checkedPoints, setCheckedPoints] = useState<{ [idx: number]: boolean }>({});
  const [expandedExamHints, setExpandedExamHints] = useState<{ [idx: number]: boolean }>({});
  const [confidenceRatings, setConfidenceRatings] = useState<{ [idx: number]: 'review' | 'fair' | 'mastered' }>({});
  const [filterUncheckedOnly, setFilterUncheckedOnly] = useState(false);

  // Flashcards state
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [cardMastery, setCardMastery] = useState<{ [idx: number]: 'mastered' | 'review' }>({});
  const [flashcardDeck, setFlashcardDeck] = useState<Flashcard[]>(output.flashcards || []);
  const [flashcardViewMode, setFlashcardViewMode] = useState<'focus' | 'grid'>('focus');

  // Sync flashcards when output changes
  useEffect(() => {
    setFlashcardDeck(output.flashcards || []);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setShowHint(false);
  }, [output.flashcards]);

  // Audio narration handler
  const handleToggleSpeech = (textToRead: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      // Clean markdown tags for natural speech
      const cleaned = textToRead
        .replace(/###|##|#|\*\*|\*|`|\[.*?\]\(.*?\)/g, '')
        .replace(/-|\n/g, ' ')
        .slice(0, 2000); // Read first section
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Stop speech when tab changes
  useEffect(() => {
    if ('speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [activeTab]);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Keyboard navigation for Flashcards
  useEffect(() => {
    if (activeTab !== 'flashcards' || flashcardViewMode !== 'focus') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNextCard();
      } else if (e.code === 'ArrowLeft') {
        handlePrevCard();
      } else if (e.key === '1') {
        handleMastery('review');
      } else if (e.key === '2') {
        handleMastery('mastered');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, flashcardViewMode, currentCardIdx, flashcardDeck]);

  // Flashcards navigation
  const currentCard = flashcardDeck[currentCardIdx] || {
    question: 'No flashcards generated.',
    answer: 'Select flashcards in controls and regenerate.',
    category: 'General',
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentCardIdx((prev) => (prev + 1) % Math.max(1, flashcardDeck.length));
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentCardIdx((prev) => (prev - 1 + flashcardDeck.length) % Math.max(1, flashcardDeck.length));
  };

  const handleShuffleDeck = () => {
    const shuffled = [...flashcardDeck].sort(() => Math.random() - 0.5);
    setFlashcardDeck(shuffled);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleMastery = (status: 'mastered' | 'review') => {
    setCardMastery((prev) => ({ ...prev, [currentCardIdx]: status }));
    if (status === 'mastered') {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }
    handleNextCard();
  };

  // Concept filtering
  const filteredConcepts = useMemo(() => {
    return (output.key_concepts || []).filter((c) => {
      const q = conceptSearch.toLowerCase();
      const matchesSearch =
        c.term.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        c.source_reference.toLowerCase().includes(q);
      const matchesImportance =
        conceptImportanceFilter === 'All' || c.importance === conceptImportanceFilter;
      return matchesSearch && matchesImportance;
    });
  }, [output.key_concepts, conceptSearch, conceptImportanceFilter]);

  const masteredConceptsCount = Object.values(conceptMastery).filter(Boolean).length;

  // Group revision points by topic
  const groupedRevisions = useMemo(() => {
    return (output.revision_points || []).reduce((acc, point, idx) => {
      const topic = point.topic || 'Core Takeaways';
      if (!acc[topic]) acc[topic] = [];
      acc[topic].push({ ...point, originalIdx: idx });
      return acc;
    }, {} as { [topic: string]: (RevisionPoint & { originalIdx: number })[] });
  }, [output.revision_points]);

  // Exam Readiness calculation
  const totalRevisions = output.revision_points?.length || 0;
  const checkedRevisionsCount = Object.values(checkedPoints).filter(Boolean).length;
  const readinessPct = totalRevisions > 0 ? Math.round((checkedRevisionsCount / totalRevisions) * 100) : 0;

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800/80 dark:bg-zinc-950 transition-colors mb-12">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 p-4 sm:p-5 dark:border-zinc-800">
        {/* Results Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {output.summary && (
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'bg-zinc-950 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Summary</span>
            </button>
          )}

          {output.key_concepts && output.key_concepts.length > 0 && (
            <button
              onClick={() => setActiveTab('concepts')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'concepts'
                  ? 'bg-zinc-950 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              <span>Key Concepts</span>
              <span className="rounded-full bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono">
                {output.key_concepts.length}
              </span>
            </button>
          )}

          {output.revision_points && output.revision_points.length > 0 && (
            <button
              onClick={() => setActiveTab('revision')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'revision'
                  ? 'bg-zinc-950 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Revision Checklist</span>
              <span className="rounded-full bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono">
                {output.revision_points.length}
              </span>
            </button>
          )}

          {output.flashcards && output.flashcards.length > 0 && (
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'flashcards'
                  ? 'bg-zinc-950 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>3D Flashcards</span>
              <span className="rounded-full bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono">
                {output.flashcards.length}
              </span>
            </button>
          )}
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {/* TTS Audio Narration */}
          {activeTab === 'summary' && (
            <button
              onClick={() => handleToggleSpeech(output.summary)}
              title={isSpeaking ? 'Stop Audio Narration' : 'Listen to Lecture Summary'}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                isSpeaking
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-emerald-600 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5 text-zinc-500" />}
              <span className="hidden sm:inline">{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
            </button>
          )}

          {/* Quick Actions (Simplify / Expand) */}
          {activeTab === 'summary' && (
            <div className="flex items-center gap-1 mr-1">
              <button
                onClick={onSimplify}
                title="Simplify language and reduce length"
                className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Simplify</span>
              </button>
              <button
                onClick={onExpand}
                title="Expand pedagogical depth with more detail"
                className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Expand</span>
              </button>
            </div>
          )}

          {/* Regenerate */}
          <button
            onClick={onRegenerate}
            title="Regenerate this study package"
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Regenerate</span>
          </button>

          {/* Print Friendly */}
          <button
            onClick={() => window.print()}
            title="Print-friendly view"
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-1.5 rounded-md bg-zinc-950 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-40">
                <button
                  onClick={() => {
                    onExport('markdown');
                    setExportOpen(false);
                  }}
                  className="w-full text-left rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-between"
                >
                  <span>Markdown (.md)</span>
                  <span className="text-[10px] text-zinc-400 font-mono">MD</span>
                </button>
                <button
                  onClick={() => {
                    onExport('pdf');
                    setExportOpen(false);
                  }}
                  className="w-full text-left rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-between"
                >
                  <span>Printable PDF</span>
                  <span className="text-[10px] text-zinc-400 font-mono">PDF</span>
                </button>
                <button
                  onClick={() => {
                    onExport('docx');
                    setExportOpen(false);
                  }}
                  className="w-full text-left rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-between"
                >
                  <span>Word Document</span>
                  <span className="text-[10px] text-zinc-400 font-mono">DOCX</span>
                </button>
                <button
                  onClick={() => {
                    onExport('json');
                    setExportOpen(false);
                  }}
                  className="w-full text-left rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-between"
                >
                  <span>Structured Data</span>
                  <span className="text-[10px] text-zinc-400 font-mono">JSON</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {/* TAB 1: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Top Meta Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-wider">
                  EXECUTIVE LECTURE SYNTHESIS
                </span>
                {latencyMs && (
                  <span className="text-[11px] text-zinc-400 font-mono">
                    • Generated in {latencyMs} ms via {providerType || 'NLP Engine'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(output.summary, 'summary')}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  {copiedSection === 'summary' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Executive TL;DR Highlight Card */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
                EXECUTIVE BRIEFING & CORE TAKEAWAYS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs text-zinc-700 dark:text-zinc-300">
                <div className="rounded-lg bg-white p-3 border border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-800/80">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                    Problem Space
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Reaching atomic state machine agreement across independent nodes over unreliable asynchronous networks.
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 border border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-800/80">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                    Core Invariant
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Strict majority quorum intersection ($\lfloor N/2 \rfloor + 1$) guarantees no split-brain or divergent logs.
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 border border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-800/80">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                    Industry Standard
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Underpins cloud infrastructure backbones including etcd (Kubernetes), Consul, and Apache Kafka KRaft.
                  </p>
                </div>
              </div>
            </div>

            {/* Markdown Body */}
            <article className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h3:text-base prose-h3:text-zinc-900 dark:prose-h3:text-zinc-100 prose-p:leading-relaxed prose-li:my-1 text-sm text-zinc-700 dark:text-zinc-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {output.summary}
              </ReactMarkdown>
            </article>

            {/* Pedagogical Knowledge Flow Diagram */}
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
                Knowledge Pipeline & Verification Flow
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="font-mono text-[10px] text-zinc-400 font-semibold mb-1">STAGE 1</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">1. Problem Formulation</div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">FLP Impossibility & network failure bounds</p>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="font-mono text-[10px] text-zinc-400 font-semibold mb-1">STAGE 2</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">2. Leader Election</div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Randomized election timeouts (150-300ms)</p>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="font-mono text-[10px] text-zinc-400 font-semibold mb-1">STAGE 3</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">3. Log Replication</div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">AppendEntries RPCs to majority quorums</p>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="font-mono text-[10px] text-zinc-400 font-semibold mb-1">STAGE 4</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">4. Safety Invariant</div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Leader Completeness & term monotonically rising</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KEY CONCEPTS */}
        {activeTab === 'concepts' && (
          <div className="space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={conceptSearch}
                  onChange={(e) => setConceptSearch(e.target.value)}
                  placeholder="Filter concepts by term, category, definition..."
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-950"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Importance Filter */}
                <span className="text-[11px] text-zinc-400 font-mono mr-1">Filter:</span>
                {(['All', 'High', 'Medium', 'Low'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setConceptImportanceFilter(lvl)}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      conceptImportanceFilter === lvl
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}

                {/* View Mode Toggle */}
                <div className="flex items-center border border-zinc-200 rounded-md p-0.5 ml-2 dark:border-zinc-800">
                  <button
                    onClick={() => setConceptViewMode('cards')}
                    className={`px-2 py-0.5 text-xs rounded font-medium ${
                      conceptViewMode === 'cards'
                        ? 'bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
                    }`}
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setConceptViewMode('table')}
                    className={`px-2 py-0.5 text-xs rounded font-medium ${
                      conceptViewMode === 'table'
                        ? 'bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
                    }`}
                  >
                    Matrix
                  </button>
                </div>
              </div>
            </div>

            {/* Concepts Counter & Mastery Progress */}
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              <span>Showing {filteredConcepts.length} of {output.key_concepts.length} concepts</span>
              <span>{masteredConceptsCount} / {output.key_concepts.length} Mastered</span>
            </div>

            {/* Detailed Cards View */}
            {conceptViewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredConcepts.map((concept, idx) => {
                  const isMastered = !!conceptMastery[concept.term];

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-4 sm:p-5 transition-all flex flex-col justify-between ${
                        isMastered
                          ? 'border-emerald-300/80 bg-emerald-50/20 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                          : 'border-zinc-200/90 bg-white hover:border-zinc-300 dark:border-zinc-800/90 dark:bg-zinc-900/70 dark:hover:border-zinc-700 shadow-2xs'
                      }`}
                    >
                      <div>
                        {/* Header & Badges */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-zinc-50">
                                {concept.term}
                              </h4>
                              {isMastered && (
                                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-0.5">
                                  <Check className="h-3.5 w-3.5" /> Mastered
                                </span>
                              )}
                            </div>
                            {concept.category && (
                              <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                                {concept.category}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Importance Badge */}
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${
                                concept.importance === 'High'
                                  ? 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400'
                                  : concept.importance === 'Medium'
                                  ? 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400'
                                  : 'border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                              }`}
                            >
                              {concept.importance}
                            </span>

                            {/* Source Citation Badge */}
                            <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                              {concept.source_reference}
                            </span>
                          </div>
                        </div>

                        {/* Definition */}
                        <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal mb-3">
                          {concept.definition}
                        </p>

                        {/* Rich Multi-Dimensional Details */}
                        <div className="space-y-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                          {concept.why_it_matters && (
                            <div className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-200 shrink-0">Significance:</span>
                              <span>{concept.why_it_matters}</span>
                            </div>
                          )}

                          {concept.common_misconception && (
                            <div className="rounded-md bg-amber-50/70 p-2 border border-amber-200/80 dark:bg-amber-950/30 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold">Exam Trap: </span>
                                {concept.common_misconception}
                              </div>
                            </div>
                          )}

                          {concept.analogy && (
                            <div className="rounded-md bg-zinc-50 p-2 border border-zinc-200/80 dark:bg-zinc-900/60 dark:border-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 flex items-start gap-1.5">
                              <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-zinc-500" />
                              <div>
                                <span className="font-semibold">Mental Model: </span>
                                {concept.analogy}
                              </div>
                            </div>
                          )}

                          {concept.formula_or_code && (
                            <div className="rounded-md bg-zinc-100/80 px-2 py-1 font-mono text-[11px] text-zinc-800 dark:bg-zinc-800/70 dark:text-zinc-200">
                              <code>{concept.formula_or_code}</code>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                        <button
                          onClick={() => {
                            setConceptMastery((prev) => ({ ...prev, [concept.term]: !prev[concept.term] }));
                          }}
                          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors border ${
                            isMastered
                              ? 'border-emerald-500 bg-emerald-100/60 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>{isMastered ? 'Mastered' : 'Mark as Mastered'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab('flashcards');
                            const matchIdx = flashcardDeck.findIndex((f) => f.question.includes(concept.term) || f.answer.includes(concept.term));
                            if (matchIdx !== -1) setCurrentCardIdx(matchIdx);
                          }}
                          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        >
                          <span>Test in Flashcards</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Compact Reference Matrix Table */
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="p-3">Term & Category</th>
                      <th className="p-3">Formal Definition</th>
                      <th className="p-3">Importance</th>
                      <th className="p-3">Citation</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {filteredConcepts.map((concept, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                        <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          <div>{concept.term}</div>
                          {concept.category && <div className="text-[10px] text-zinc-400 font-mono">{concept.category}</div>}
                        </td>
                        <td className="p-3 text-zinc-700 dark:text-zinc-300 max-w-md">{concept.definition}</td>
                        <td className="p-3 font-mono">{concept.importance}</td>
                        <td className="p-3 font-mono">{concept.source_reference}</td>
                        <td className="p-3">
                          <button
                            onClick={() => setConceptMastery((prev) => ({ ...prev, [concept.term]: !prev[concept.term] }))}
                            className={`rounded px-2 py-0.5 text-[11px] font-medium border ${
                              conceptMastery[concept.term]
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'
                            }`}
                          >
                            {conceptMastery[concept.term] ? '✓ Mastered' : 'To Learn'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REVISION CHECKLIST */}
        {activeTab === 'revision' && (
          <div className="space-y-6">
            {/* Exam Readiness Cockpit */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    EXAM READINESS SCORE: {readinessPct}%
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.2 text-[10px] font-mono font-medium ${
                      readinessPct >= 80
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : readinessPct >= 50
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {readinessPct >= 80 ? 'Exam Ready' : readinessPct >= 50 ? 'Solid Foundations' : 'Needs Review'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => {
                      const allChecked: { [idx: number]: boolean } = {};
                      (output.revision_points || []).forEach((_, idx) => (allChecked[idx] = true));
                      setCheckedPoints(allChecked);
                    }}
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 underline"
                  >
                    Check All
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button
                    onClick={() => setCheckedPoints({})}
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 underline"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden dark:bg-zinc-800">
                <div
                  className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
                  style={{ width: `${readinessPct}%` }}
                />
              </div>
            </div>

            {/* Checkable Topic Sections */}
            <div className="space-y-4">
              {Object.entries(groupedRevisions).map(([topic, points]) => (
                <div key={topic} className="rounded-xl border border-zinc-200/90 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-zinc-500" />
                      {topic}
                    </span>
                    <span className="text-[11px] font-normal text-zinc-400">
                      {points.filter((pt) => checkedPoints[pt.originalIdx]).length} / {points.length} complete
                    </span>
                  </h4>

                  <div className="space-y-3">
                    {points.map((pt) => {
                      const isChecked = !!checkedPoints[pt.originalIdx];
                      const isHintExpanded = !!expandedExamHints[pt.originalIdx];
                      const confidence = confidenceRatings[pt.originalIdx] || 'review';

                      return (
                        <div
                          key={pt.originalIdx}
                          className={`rounded-xl p-4 border transition-all ${
                            isChecked
                              ? 'bg-zinc-50/80 border-zinc-200 dark:bg-zinc-900/30 dark:border-zinc-800/60'
                              : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => setCheckedPoints((prev) => ({ ...prev, [pt.originalIdx]: !prev[pt.originalIdx] }))}
                              className="mt-0.5 text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                            >
                              {isChecked ? (
                                <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Square className="h-4 w-4 text-zinc-400" />
                              )}
                            </button>

                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                {pt.blooms_level && (
                                  <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                    Bloom: {pt.blooms_level}
                                  </span>
                                )}
                                {pt.difficulty && (
                                  <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                    Difficulty: {pt.difficulty}
                                  </span>
                                )}
                              </div>

                              <p
                                className={`text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed ${
                                  isChecked ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
                                }`}
                              >
                                {pt.point}
                              </p>

                              {/* Student Self-Confidence Rating */}
                              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800/80 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-zinc-400 font-mono">Confidence:</span>
                                  <button
                                    onClick={() => setConfidenceRatings((prev) => ({ ...prev, [pt.originalIdx]: 'review' }))}
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                      confidence === 'review'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold'
                                        : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                    }`}
                                  >
                                    Needs Review ⚠️
                                  </button>
                                  <button
                                    onClick={() => setConfidenceRatings((prev) => ({ ...prev, [pt.originalIdx]: 'fair' }))}
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                      confidence === 'fair'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold'
                                        : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                    }`}
                                  >
                                    Fair 👍
                                  </button>
                                  <button
                                    onClick={() => setConfidenceRatings((prev) => ({ ...prev, [pt.originalIdx]: 'mastered' }))}
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                      confidence === 'mastered'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold'
                                        : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                    }`}
                                  >
                                    Mastered 🎯
                                  </button>
                                </div>

                                {/* Examiner Likely Question Toggle */}
                                {pt.exam_question_hint && (
                                  <button
                                    onClick={() => setExpandedExamHints((prev) => ({ ...prev, [pt.originalIdx]: !prev[pt.originalIdx] }))}
                                    className="flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
                                  >
                                    <HelpCircle className="h-3 w-3" />
                                    <span>{isHintExpanded ? 'Hide Exam Question' : 'View Exam Question'}</span>
                                  </button>
                                )}
                              </div>

                              {/* Expandable Examiner Model Answer & Marking Criteria */}
                              {isHintExpanded && (
                                <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 space-y-2">
                                  <div>
                                    <span className="font-semibold text-zinc-950 dark:text-zinc-50">Likely Midterm / Final Exam Prompt:</span>
                                    <p className="mt-0.5 italic text-zinc-700 dark:text-zinc-300">"{pt.exam_question_hint}"</p>
                                  </div>

                                  {pt.model_answer && (
                                    <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800">
                                      <span className="font-semibold text-zinc-950 dark:text-zinc-50">Full Marks Marking Rubric:</span>
                                      <p className="mt-0.5 whitespace-pre-line text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono text-[11px]">
                                        {pt.model_answer}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: 3D FLASHCARDS */}
        {activeTab === 'flashcards' && (
          <div className="max-w-xl mx-auto py-2">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">
                CARD {currentCardIdx + 1} OF {flashcardDeck.length}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShuffleDeck}
                  title="Shuffle deck cards"
                  className="flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <Shuffle className="h-3 w-3" />
                  <span>Shuffle</span>
                </button>

                <button
                  onClick={() => setFlashcardViewMode(flashcardViewMode === 'focus' ? 'grid' : 'focus')}
                  className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  {flashcardViewMode === 'focus' ? 'Grid Overview' : '3D Focus'}
                </button>
              </div>
            </div>

            {flashcardViewMode === 'focus' ? (
              <>
                {/* 3D Flip Card Container */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="perspective-1000 w-full min-h-[320px] h-80 cursor-pointer group"
                >
                  <div
                    className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                  >
                    {/* Front Side: Question */}
                    <div className="absolute w-full h-full backface-hidden rounded-2xl border border-zinc-300/80 bg-white p-6 flex flex-col justify-between shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="flex items-center justify-between">
                        <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-mono text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                          {currentCard.category || 'Concept Invariant'}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Audio TTS button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSpeech(currentCard.question);
                            }}
                            title="Read question aloud"
                            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs text-zinc-400">Click to reveal answer</span>
                        </div>
                      </div>

                      <div className="my-auto text-center px-4">
                        <p className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 leading-snug">
                          {currentCard.question}
                        </p>

                        {/* Hint Section */}
                        {showHint && currentCard.hint && (
                          <div className="mt-4 rounded-lg bg-amber-50 p-2.5 border border-amber-200 text-xs text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300 text-left flex items-start gap-1.5">
                            <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                            <div>
                              <span className="font-semibold">Hint: </span>
                              {currentCard.hint}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                        {currentCard.hint ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowHint(!showHint);
                            }}
                            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white underline"
                          >
                            {showHint ? 'Hide Hint' : 'Show Hint'}
                          </button>
                        ) : <span />}

                        <span>Tap or [Space] to Flip ↻</span>
                      </div>
                    </div>

                    {/* Back Side: Answer & Deep Pedagogical Reasoning */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl border border-zinc-300/80 bg-white p-6 flex flex-col justify-between shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-y-auto">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-mono text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold">
                          Answer & Explanation
                        </span>
                        {currentCard.source_reference && (
                          <span className="text-[11px] font-mono text-zinc-400">
                            {currentCard.source_reference}
                          </span>
                        )}
                      </div>

                      <div className="my-auto space-y-2.5 text-left py-2">
                        <p className="text-xs sm:text-sm font-semibold text-zinc-950 dark:text-zinc-50 leading-relaxed">
                          {currentCard.answer}
                        </p>

                        {currentCard.detailed_explanation && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {currentCard.detailed_explanation}
                          </p>
                        )}

                        {currentCard.trap_to_avoid && (
                          <div className="rounded-md bg-rose-50 p-2 border border-rose-200 text-[11px] text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 flex items-start gap-1.5">
                            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-rose-600" />
                            <div>
                              <span className="font-semibold">Exam Trap: </span>
                              {currentCard.trap_to_avoid}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-center text-xs text-zinc-400 font-medium pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        Tap or [Space] to Flip Back ↻
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation & Mastery Controls */}
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevCard}
                      className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Prev
                    </button>
                    <button
                      onClick={handleNextCard}
                      className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMastery('review')}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
                    >
                      Needs Review [1]
                    </button>
                    <button
                      onClick={() => handleMastery('mastered')}
                      className="rounded-lg bg-zinc-950 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors"
                    >
                      Got It! (Mastered) [2]
                    </button>
                  </div>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="mt-4 text-center text-[11px] text-zinc-400 font-mono">
                  [Space] Flip · [←/→] Navigate · [1] Needs Review · [2] Mastered
                </div>
              </>
            ) : (
              /* Grid Overview Mode */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {flashcardDeck.map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentCardIdx(idx);
                      setFlashcardViewMode('focus');
                    }}
                    className={`rounded-xl border p-4 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-all ${
                      cardMastery[idx] === 'mastered'
                        ? 'border-emerald-300 bg-emerald-50/20 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                        : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-zinc-400">Card {idx + 1}</span>
                      {cardMastery[idx] === 'mastered' && (
                        <span className="text-[10px] font-mono text-emerald-600 font-bold">✓ Mastered</span>
                      )}
                    </div>
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">{card.question}</h5>
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{card.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};