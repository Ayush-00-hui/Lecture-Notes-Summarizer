import React, { useState } from 'react';
import {
  FolderClock,
  Pin,
  Trash2,
  Edit2,
  Search,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { DocumentListItem } from '../types';
import { formatDate } from '../lib/utils';

interface HistorySidebarProps {
  documents: DocumentListItem[];
  onSelectDocument: (docId: string) => void;
  onPinDocument: (docId: string) => Promise<void>;
  onRenameDocument: (docId: string, newTitle: string) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
  onClose?: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  documents,
  onSelectDocument,
  onPinDocument,
  onRenameDocument,
  onDeleteDocument,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filteredDocs = documents.filter((doc) => {
    const q = searchQuery.toLowerCase();
    return doc.title.toLowerCase().includes(q) || doc.filename.toLowerCase().includes(q);
  });

  const handleStartRename = (doc: DocumentListItem) => {
    setEditingId(doc.id);
    setEditingTitle(doc.title);
  };

  const handleSaveRename = async (docId: string) => {
    if (editingTitle.trim()) {
      await onRenameDocument(docId, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <FolderClock className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Document Library & History
          </h3>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 font-mono">
            {documents.length}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search saved lectures..."
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3.5 py-2 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-950"
        />
      </div>

      {/* Document List */}
      <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
        {filteredDocs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            No lecture documents found. Upload a file or try the sample lecture to get started.
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isEditing = editingId === doc.id;

            return (
              <div
                key={doc.id}
                className={`group rounded-xl border p-3.5 transition-all ${
                  doc.is_pinned
                    ? 'border-zinc-400/80 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/70 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 my-1">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="flex-1 rounded-md border border-zinc-500 px-2 py-0.5 text-xs text-zinc-900 dark:bg-zinc-800 dark:text-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(doc.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveRename(doc.id)}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-zinc-400 hover:text-zinc-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => onSelectDocument(doc.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          {doc.is_pinned && (
                            <Pin className="h-3 w-3 fill-zinc-800 text-zinc-800 dark:fill-zinc-200 dark:text-zinc-200 shrink-0" />
                          )}
                          <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-white truncate">
                            {doc.title}
                          </h4>
                        </div>
                        <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-mono">
                          {doc.filename}
                        </p>
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-400 font-mono">
                      <span>{doc.page_count}p</span>
                      <span>•</span>
                      <span>{doc.word_count.toLocaleString()}w</span>
                      <span>•</span>
                      <span>{formatDate(doc.updated_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onPinDocument(doc.id)}
                      title={doc.is_pinned ? 'Unpin Document' : 'Pin to Top'}
                      className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                        doc.is_pinned ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleStartRename(doc)}
                      title="Rename Document"
                      className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 rounded"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete document "${doc.title}"?`)) {
                          onDeleteDocument(doc.id);
                        }
                      }}
                      title="Delete Document"
                      className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => onSelectDocument(doc.id)}
                      title="Re-open in Workspace"
                      className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 rounded"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};