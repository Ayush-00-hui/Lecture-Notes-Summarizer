import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Cpu,
  Thermometer,
  ShieldCheck,
  Check,
  X,
  Zap,
} from 'lucide-react';
import { SettingsDTO } from '../types';

interface SettingsModalProps {
  settings: SettingsDTO;
  onUpdateSettings: (payload: {
    gemini_api_key?: string;
    default_model?: string;
    temperature?: number;
  }) => Promise<void>;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(settings.active_model);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings({
        gemini_api_key: apiKey.trim() ? apiKey.trim() : undefined,
        default_model: model,
        temperature: temperature,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      setApiKey('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-w-lg w-full rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3.5 dark:border-zinc-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Application Settings
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure LLM providers, API keys, and model parameters.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* API Key Status Banner */}
          <div className="rounded-xl border p-3.5 flex items-center justify-between bg-zinc-50 border-zinc-200 dark:bg-zinc-900/60 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              {settings.has_gemini_api_key ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Zap className="h-5 w-5 text-zinc-500 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {settings.has_gemini_api_key ? 'Gemini API Configured' : 'Offline Mode Active'}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                  {settings.has_gemini_api_key
                    ? `Key: ${settings.gemini_api_key_masked}`
                    : 'Running local extractive NLP (TextRank + YAKE)'}
                </div>
              </div>
            </div>
          </div>

          {/* Gemini API Key Input */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-zinc-400" />
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={settings.has_gemini_api_key ? '•••••••••••••••••••••••• (Leave blank to keep current)' : 'AIzaSy...'}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 font-mono"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              Get an API key for free at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-zinc-700 dark:text-zinc-300 underline font-medium">Google AI Studio</a>.
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-zinc-400" />
              Active LLM Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-zinc-800 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {settings.available_models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Thermometer className="h-3.5 w-3.5 text-zinc-400" />
                Temperature / Creativity
              </span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">{temperature}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-zinc-900 dark:accent-zinc-100 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-800"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1 font-mono">
              <span>0.0 (Deterministic / Exact)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          {savedSuccess && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mr-2">
              <Check className="h-3.5 w-3.5" /> Settings Saved!
            </span>
          )}
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-sm"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};