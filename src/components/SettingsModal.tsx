'use client';

import { useState, useEffect } from 'react';
import { UserSettings, getSettings, saveSettings, DEFAULT_SETTINGS } from '@/lib/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: UserSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getSettings());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveSettings(settings);
    onSave(settings);
    onClose();
  };

  const handleChange = (key: keyof UserSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card p-6"
        style={{ background: 'rgba(255, 255, 255, 0.95)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            设置
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255, 107, 157, 0.1)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="var(--color-primary)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* LLM Section */}
          <section>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              LLM 配置
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  API URL
                </label>
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="https://api.deepseek.com/v1"
                  value={settings.llmApiUrl}
                  onChange={(e) => handleChange('llmApiUrl', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    className="input-field text-sm pr-10"
                    placeholder="sk-..."
                    value={settings.llmApiKey}
                    onChange={(e) => handleChange('llmApiKey', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showApiKey ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  模型名称
                </label>
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="deepseek-chat"
                  value={settings.llmModel}
                  onChange={(e) => handleChange('llmModel', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* ComfyUI Section */}
          <section>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              ComfyUI 配置
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  ComfyUI URL
                </label>
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="https://your-comfy.example.com"
                  value={settings.comfyuiUrl}
                  onChange={(e) => handleChange('comfyuiUrl', e.target.value)}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  通过 Cloudflare Tunnel 等方式暴露的 ComfyUI 地址
                </p>
              </div>
            </div>
          </section>

          {/* Default Parameters Section */}
          <section>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              默认参数
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  默认 Checkpoint 模型
                </label>
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="animagineXL.safetensors"
                  value={settings.defaultModel}
                  onChange={(e) => handleChange('defaultModel', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                    采样器
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="euler"
                    value={settings.defaultSampler}
                    onChange={(e) => handleChange('defaultSampler', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                    调度器
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="normal"
                    value={settings.defaultScheduler}
                    onChange={(e) => handleChange('defaultScheduler', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="btn-secondary flex-1">
            取消
          </button>
          <button onClick={handleSave} className="btn-primary flex-1">
            保存设置
          </button>
        </div>

        {/* Note */}
        <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          设置保存在浏览器本地，不会上传到服务器
        </p>
      </div>
    </div>
  );
}
