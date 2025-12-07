'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import GenerationForm from '@/components/GenerationForm';
import GenerationResult from '@/components/GenerationResult';
import HistoryPanel from '@/components/HistoryPanel';
import { getHistory, addToHistory, updateHistoryItem } from '@/lib/history';
import {
  GenerationMode,
  GenerationParams,
  HistoryItem,
  GenerateResponse,
  StatusResponse,
} from '@/types';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'error' | null>(null);
  const [processedPrompt, setProcessedPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const currentTaskRef = useRef<{ promptId: string; historyId: string } | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const refreshHistory = useCallback(() => {
    setHistory(getHistory());
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const pollStatus = useCallback(async (promptId: string, historyId: string) => {
    try {
      const response = await fetch(`/api/status?prompt_id=${encodeURIComponent(promptId)}`);
      const data: StatusResponse = await response.json();

      // Check if this is still the current task
      if (currentTaskRef.current?.promptId !== promptId) {
        return;
      }

      setStatus(data.status);

      if (data.status === 'completed' && data.image_url) {
        setImageUrl(data.image_url);
        setIsLoading(false);
        updateHistoryItem(historyId, {
          status: 'completed',
          imageUrl: data.image_url,
        });
        refreshHistory();
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else if (data.status === 'error') {
        setError(data.error || 'Generation failed');
        setIsLoading(false);
        updateHistoryItem(historyId, { status: 'error' });
        refreshHistory();
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, [refreshHistory]);

  const handleSubmit = async (
    prompt: string,
    mode: GenerationMode,
    params: GenerationParams
  ) => {
    // Clear previous state
    setIsLoading(true);
    setStatus('pending');
    setProcessedPrompt('');
    setImageUrl(null);
    setError(null);

    // Stop any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Create history item
    const historyId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const historyItem: HistoryItem = {
      id: historyId,
      timestamp: Date.now(),
      originalPrompt: prompt,
      processedPrompt: '',
      mode,
      params,
      status: 'pending',
    };
    addToHistory(historyItem);
    refreshHistory();

    try {
      // Submit generation request
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode, params }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation request failed');
      }

      const data: GenerateResponse = await response.json();
      setProcessedPrompt(data.processed_prompt);
      setStatus('processing');

      // Update history with processed prompt
      updateHistoryItem(historyId, {
        processedPrompt: data.processed_prompt,
        status: 'processing',
      });
      refreshHistory();

      // Store current task info
      currentTaskRef.current = { promptId: data.prompt_id, historyId };

      // Start polling
      pollingIntervalRef.current = setInterval(() => {
        pollStatus(data.prompt_id, historyId);
      }, 2500);

      // Initial poll
      pollStatus(data.prompt_id, historyId);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
      setIsLoading(false);
      updateHistoryItem(historyId, { status: 'error' });
      refreshHistory();
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setProcessedPrompt(item.processedPrompt);
    setImageUrl(item.imageUrl || null);
    setStatus(item.status);
    setError(null);
    setShowHistory(false);
  };

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <h1
            className="text-4xl md:text-5xl font-bold mb-3"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            PromptForge
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            AI 驱动的图像生成工具 - 将你的想法变成精美图像
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowHistory(false)}
            className={`mode-btn flex-1 ${!showHistory ? 'active' : ''}`}
          >
            创作
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`mode-btn flex-1 ${showHistory ? 'active' : ''}`}
          >
            历史 ({history.length})
          </button>
        </div>

        {/* Content */}
        {showHistory ? (
          <HistoryPanel
            history={history}
            onHistoryChange={refreshHistory}
            onSelectItem={handleSelectHistoryItem}
          />
        ) : (
          <div className="space-y-6">
            {/* Generation Form */}
            <div className="glass-card p-6">
              <GenerationForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>

            {/* Generation Result */}
            <GenerationResult
              status={status}
              processedPrompt={processedPrompt}
              imageUrl={imageUrl}
              error={error}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 py-6">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Powered by ComfyUI & AI
          </p>
        </footer>
      </div>
    </main>
  );
}
