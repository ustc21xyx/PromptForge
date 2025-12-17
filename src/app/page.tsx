'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import GenerationForm from '@/components/GenerationForm';
import GenerationResult from '@/components/GenerationResult';
import HistoryPanel from '@/components/HistoryPanel';
import TaskQueuePanel from '@/components/TaskQueuePanel';
import SettingsModal from '@/components/SettingsModal';
import { getHistory, addToHistory, updateHistoryItem } from '@/lib/history';
import { getSettings, isSettingsConfigured, UserSettings, DEFAULT_SETTINGS } from '@/lib/settings';
import {
  GenerationMode,
  GenerationParams,
  HistoryItem,
  GenerateResponse,
  StatusResponse,
} from '@/types';

export default function Home() {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'error' | null>(null);
  const [processedPrompt, setProcessedPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  const displayTaskRef = useRef<string | null>(null);
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load settings and history on mount
  useEffect(() => {
    setSettings(getSettings());
    setHistory(getHistory());
  }, []);

  const refreshHistory = useCallback(() => {
    setHistory(getHistory());
  }, []);

  const handleSettingsSave = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingIntervalsRef.current.forEach((interval) => clearInterval(interval));
      pollingIntervalsRef.current.clear();
    };
  }, []);

  const pollStatus = useCallback(
    async (promptId: string, historyId: string, comfyuiUrl: string) => {
      const isDisplayed = displayTaskRef.current === historyId;

      try {
        const response = await fetch('/api/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt_id: promptId, comfyuiUrl }),
        });
        const data: StatusResponse = await response.json();

        if (isDisplayed) {
          setStatus(data.status);
        }

        if (data.status === 'completed' && data.image_url) {
          if (isDisplayed) {
            setImageUrl(data.image_url);
          }
          updateHistoryItem(historyId, {
            status: 'completed',
            imageUrl: data.image_url,
          });
          refreshHistory();
          const interval = pollingIntervalsRef.current.get(promptId);
          if (interval) {
            clearInterval(interval);
            pollingIntervalsRef.current.delete(promptId);
          }
        } else if (data.status === 'error') {
          if (isDisplayed) {
            setError(data.error || '生成失败');
          }
          updateHistoryItem(historyId, { status: 'error' });
          refreshHistory();
          const interval = pollingIntervalsRef.current.get(promptId);
          if (interval) {
            clearInterval(interval);
            pollingIntervalsRef.current.delete(promptId);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
        if (isDisplayed) {
          setError('获取状态失败');
        }
        updateHistoryItem(historyId, { status: 'error' });
        refreshHistory();
        const interval = pollingIntervalsRef.current.get(promptId);
        if (interval) {
          clearInterval(interval);
          pollingIntervalsRef.current.delete(promptId);
        }
      }
    },
    [refreshHistory]
  );

  const handleSubmit = async (
    prompt: string,
    mode: GenerationMode,
    params: GenerationParams
  ) => {
    // Check if settings are configured
    if (!isSettingsConfigured(settings)) {
      setError('请先点击右上角设置按钮配置 API 信息');
      setStatus('error');
      return;
    }

    // Clear previous state for the currently displayed task
    setStatus('pending');
    setProcessedPrompt('');
    setImageUrl(null);
    setError(null);

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
    displayTaskRef.current = historyId;

    try {
      // Submit generation request with config
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mode,
          params,
          config: {
            llmApiUrl: settings.llmApiUrl,
            llmApiKey: settings.llmApiKey,
            llmModel: settings.llmModel,
            llmApiFormat: settings.llmApiFormat,
            customSystemPrompt: settings.customSystemPrompt,
            comfyuiUrl: settings.comfyuiUrl,
            workflowTemplate: settings.workflowTemplate,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '请求失败');
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

      // Start polling for this task
      const interval = setInterval(() => {
        pollStatus(data.prompt_id, historyId, settings.comfyuiUrl);
      }, 2500);
      pollingIntervalsRef.current.set(data.prompt_id, interval);

      // Initial poll
      pollStatus(data.prompt_id, historyId, settings.comfyuiUrl);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      setStatus('error');
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

  const isConfigured = isSettingsConfigured(settings);

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10 relative">
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

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="absolute top-0 right-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              background: isConfigured ? 'rgba(255, 107, 157, 0.1)' : 'rgba(248, 113, 113, 0.2)',
              border: isConfigured ? '2px solid var(--border-soft)' : '2px solid rgba(248, 113, 113, 0.5)',
            }}
            title="设置"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke={isConfigured ? 'var(--color-primary)' : '#f87171'}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </header>

        {/* Config Warning */}
        {!isConfigured && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
            }}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="#f87171" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm" style={{ color: '#dc2626' }}>
              请先点击右上角设置按钮配置 LLM API 和 ComfyUI 地址
            </p>
          </div>
        )}

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generation Form */}
            <div className="space-y-4">
              <div className="glass-card-static p-5">
                <GenerationForm
                  onSubmit={handleSubmit}
                  comfyuiUrl={settings.comfyuiUrl}
                />
              </div>

              <TaskQueuePanel
                history={history}
                onHistoryChange={refreshHistory}
                onSelectItem={handleSelectHistoryItem}
              />

              {/* Processed Prompt - Collapsible */}
              {processedPrompt && (
                <details className="glass-card-static p-3">
                  <summary
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI 处理后的提示词
                  </summary>
                  <p
                    className="mt-2 text-xs leading-relaxed p-2 rounded-lg"
                    style={{
                      background: 'rgba(255, 107, 157, 0.03)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {processedPrompt}
                  </p>
                </details>
              )}
            </div>

            {/* Generation Result */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <GenerationResult
                status={status}
                imageUrl={imageUrl}
                error={error}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 py-6">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Powered by ComfyUI & AI
          </p>
        </footer>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
      />
    </main>
  );
}
