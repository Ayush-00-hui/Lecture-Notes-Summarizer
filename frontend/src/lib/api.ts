import {
  DocumentPreview,
  DocumentListItem,
  SummarizeResponse,
  CompareResponse,
  PromptTemplateDTO,
  SettingsDTO,
  StudyPackageOutput,
} from '../types';

const BASE_URL = '/api';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Upload & Ingestion
  async uploadFile(file: File): Promise<DocumentPreview> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async pasteText(title: string, text: string): Promise<DocumentPreview> {
    const res = await fetch(`${BASE_URL}/upload/paste`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Text processing failed' }));
      throw new Error(err.detail || 'Text processing failed');
    }
    return res.json();
  },

  async updateDocumentText(docId: string, fullText: string): Promise<DocumentPreview> {
    const res = await fetch(`${BASE_URL}/upload/${docId}/text`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_text: fullText }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Update failed' }));
      throw new Error(err.detail || 'Update failed');
    }
    return res.json();
  },

  // Summarize
  async summarize(payload: {
    document_id?: string;
    raw_text?: string;
    title?: string;
    summary_mode: 'short' | 'detailed' | 'custom';
    target_words?: number;
    audience_level: 'beginner' | 'intermediate' | 'expert';
    language: string;
    generate_summary: boolean;
    generate_concepts: boolean;
    generate_revision_points: boolean;
    generate_flashcards: boolean;
    temperature?: number;
  }): Promise<SummarizeResponse> {
    const res = await fetch(`${BASE_URL}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Summarization failed' }));
      throw new Error(err.detail || 'Summarization failed');
    }
    return res.json();
  },

  // Compare
  async compare(payload: {
    document_id?: string;
    raw_text?: string;
    title?: string;
    summary_mode: 'short' | 'detailed' | 'custom';
    target_words?: number;
    audience_level: 'beginner' | 'intermediate' | 'expert';
    language: string;
    custom_prompt_a?: string;
    custom_prompt_b?: string;
    run_llm_judge?: boolean;
  }): Promise<CompareResponse> {
    const res = await fetch(`${BASE_URL}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Comparison run failed' }));
      throw new Error(err.detail || 'Comparison run failed');
    }
    return res.json();
  },

  async submitVote(vote: {
    comparison_id: string;
    better_coverage?: 'A' | 'B' | 'Tie';
    better_conciseness?: 'A' | 'B' | 'Tie';
    better_clarity?: 'A' | 'B' | 'Tie';
    overall_winner?: 'A' | 'B' | 'Tie';
    feedback_notes?: string;
  }) {
    const res = await fetch(`${BASE_URL}/compare/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vote),
    });
    if (!res.ok) throw new Error('Failed to record vote');
    return res.json();
  },

  // History
  async listHistory(search?: string): Promise<DocumentListItem[]> {
    const url = search ? `${BASE_URL}/history?search=${encodeURIComponent(search)}` : `${BASE_URL}/history`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  async getDocument(id: string) {
    const res = await fetch(`${BASE_URL}/history/${id}`);
    if (!res.ok) throw new Error('Failed to fetch document');
    return res.json();
  },

  async togglePin(id: string) {
    const res = await fetch(`${BASE_URL}/history/${id}/pin`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle pin');
    return res.json();
  },

  async renameDocument(id: string, title: string) {
    const res = await fetch(`${BASE_URL}/history/${id}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Failed to rename document');
    return res.json();
  },

  async deleteDocument(id: string) {
    const res = await fetch(`${BASE_URL}/history/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  // Prompts
  async getPrompts(): Promise<PromptTemplateDTO[]> {
    const res = await fetch(`${BASE_URL}/prompts`);
    if (!res.ok) throw new Error('Failed to fetch prompts');
    return res.json();
  },

  async updatePrompt(name: string, payload: { system_prompt: string; user_template: string }) {
    const res = await fetch(`${BASE_URL}/prompts/${name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update prompt');
    return res.json();
  },

  async resetPrompts() {
    const res = await fetch(`${BASE_URL}/prompts/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset prompts');
    return res.json();
  },

  // Export
  async exportFile(
    format: 'markdown' | 'docx' | 'pdf' | 'json',
    title: string,
    type: 'study_package' | 'comparison_report',
    data: StudyPackageOutput | CompareResponse
  ) {
    const res = await fetch(`${BASE_URL}/export/${format}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, type, data }),
    });
    if (!res.ok) throw new Error(`Export to ${format.toUpperCase()} failed`);
    
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    // Extract filename from header or fallback
    const disposition = res.headers.get('content-disposition');
    let filename = `notenest_${type}.${format === 'markdown' ? 'md' : format}`;
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },

  // Settings
  async getSettings(): Promise<SettingsDTO> {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(payload: {
    gemini_api_key?: string;
    default_model?: string;
    temperature?: number;
  }) {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },
};
