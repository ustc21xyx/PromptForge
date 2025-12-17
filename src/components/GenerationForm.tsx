'use client';

import { useState, useEffect, useCallback } from 'react';
import { GenerationMode, GenerationParams, SIZE_PRESETS, DEFAULTS } from '@/types';
import { getPrefs, savePrefs, GenerationPrefs } from '@/lib/settings';

// Common samplers for Stable Diffusion
const SAMPLERS = [
  'euler',
  'euler_ancestral',
  'heun',
  'dpm_2',
  'dpm_2_ancestral',
  'lms',
  'dpm_fast',
  'dpm_adaptive',
  'dpmpp_2s_ancestral',
  'dpmpp_sde',
  'dpmpp_2m',
  'dpmpp_2m_sde',
  'dpmpp_3m_sde',
  'ddim',
  'uni_pc',
];

// Common schedulers
const SCHEDULERS = [
  'normal',
  'karras',
  'exponential',
  'sgm_uniform',
  'simple',
  'ddim_uniform',
];

interface GenerationFormProps {
  onSubmit: (prompt: string, mode: GenerationMode, params: GenerationParams) => void;
  comfyuiUrl?: string;
}

export default function GenerationForm({
  onSubmit,
  comfyuiUrl = '',
}: GenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>('enhance');
  const [sizeIndex, setSizeIndex] = useState(0);
  const [steps, setSteps] = useState(DEFAULTS.steps);
  const [cfg, setCfg] = useState(DEFAULTS.cfg);
  const [seed, setSeed] = useState(DEFAULTS.seed);
  const [model, setModel] = useState('');
  const [sampler, setSampler] = useState(DEFAULTS.sampler);
  const [scheduler, setScheduler] = useState(DEFAULTS.scheduler);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState(DEFAULTS.negativePrompt);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    const prefs = getPrefs();
    setSizeIndex(prefs.sizeIndex);
    setSampler(prefs.sampler);
    setScheduler(prefs.scheduler);
    setSteps(prefs.steps);
    setCfg(prefs.cfg);
    setPrefsLoaded(true);
  }, []);

  // Save preferences when they change
  const saveCurrentPrefs = useCallback(() => {
    if (!prefsLoaded) return;
    const prefs: GenerationPrefs = {
      sizeIndex,
      sampler,
      scheduler,
      steps,
      cfg,
    };
    savePrefs(prefs);
  }, [prefsLoaded, sizeIndex, sampler, scheduler, steps, cfg]);

  useEffect(() => {
    saveCurrentPrefs();
  }, [saveCurrentPrefs]);

  // Fetch available models from ComfyUI
  const fetchModels = useCallback(async () => {
    if (!comfyuiUrl) {
      setModelsError('请先配置 ComfyUI URL');
      return;
    }

    setModelsLoading(true);
    setModelsError(null);

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comfyuiUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '获取模型列表失败');
      }

      setAvailableModels(data.checkpoints || []);

      // If no model selected and we have models, select the first one
      if (!model && data.checkpoints?.length > 0) {
        setModel(data.checkpoints[0]);
      }
    } catch (error) {
      setModelsError(error instanceof Error ? error.message : '获取模型列表失败');
    } finally {
      setModelsLoading(false);
    }
  }, [comfyuiUrl, model]);

  // Auto-fetch models when comfyuiUrl is available
  useEffect(() => {
    if (comfyuiUrl && availableModels.length === 0) {
      fetchModels();
    }
  }, [comfyuiUrl, availableModels.length, fetchModels]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const selectedSize = SIZE_PRESETS[sizeIndex];
    onSubmit(prompt, mode, {
      width: selectedSize.width,
      height: selectedSize.height,
      steps,
      cfg,
      seed,
      model,
      sampler,
      scheduler,
      negativePrompt,
    });
  };

  const modes: { key: GenerationMode; label: string; desc: string }[] = [
    { key: 'translate', label: '翻译', desc: '仅翻译成英文' },
    { key: 'enhance', label: '完善', desc: '翻译并补充细节' },
    { key: 'creative', label: '创意', desc: 'AI 自由发挥' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          描述你想要的图像
        </label>
        <textarea
          className="textarea-field"
          placeholder="例如：一个穿着白色连衣裙的少女站在樱花树下，阳光透过花瓣洒落..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />
      </div>

      {/* Mode Selection - Compact */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          处理模式
        </label>
        <div className="flex gap-2">
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`mode-btn-compact flex-1 ${mode === m.key ? 'active' : ''}`}
              onClick={() => setMode(m.key)}
              title={m.desc}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Checkpoint 模型
        </label>
        <div className="flex gap-2">
          {availableModels.length > 0 ? (
            <select
              className="select-field flex-1"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="input-field flex-1"
              placeholder="例如：animagineXL.safetensors"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          )}
          <button
            type="button"
            className="btn-secondary px-3"
            onClick={fetchModels}
            disabled={modelsLoading || !comfyuiUrl}
            title="刷新模型列表"
          >
            {modelsLoading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>
        {modelsError && (
          <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{modelsError}</p>
        )}
        {!modelsError && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {availableModels.length > 0
              ? `已加载 ${availableModels.length} 个模型`
              : comfyuiUrl
                ? '点击刷新按钮获取模型列表'
                : '请先配置 ComfyUI URL'}
          </p>
        )}
      </div>

      {/* Advanced Settings (Collapsible) */}
      <div>
        <button
          type="button"
          className="collapsible-header w-full"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            参数设置
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--color-primary)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showAdvanced && (
          <div className="mt-4 p-4 rounded-xl space-y-5" style={{ background: 'rgba(255, 107, 157, 0.03)' }}>
            {/* Size Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                图像尺寸
              </label>
              <select
                className="select-field"
                value={sizeIndex}
                onChange={(e) => setSizeIndex(Number(e.target.value))}
              >
                {SIZE_PRESETS.map((size, index) => (
                  <option key={index} value={index}>
                    {size.label} ({size.width}×{size.height})
                  </option>
                ))}
              </select>
            </div>

            {/* Steps, CFG, Seed */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  采样步数: {steps}
                </label>
                <input
                  type="range"
                  min="20"
                  max="50"
                  value={steps}
                  onChange={(e) => setSteps(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  CFG Scale: {cfg}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={cfg}
                  onChange={(e) => setCfg(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  随机种子
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="input-field text-sm"
                    value={seed === -1 ? '' : seed}
                    placeholder="随机"
                    onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : -1)}
                  />
                  <button
                    type="button"
                    className="btn-secondary text-sm px-3"
                    onClick={() => setSeed(-1)}
                    title="设为随机"
                  >
                    🎲
                  </button>
                </div>
              </div>
            </div>

            {/* Sampler and Scheduler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  采样器
                </label>
                <select
                  className="select-field"
                  value={sampler}
                  onChange={(e) => setSampler(e.target.value)}
                >
                  {SAMPLERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  调度器
                </label>
                <select
                  className="select-field"
                  value={scheduler}
                  onChange={(e) => setScheduler(e.target.value)}
                >
                  {SCHEDULERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                负向提示词
              </label>
              <textarea
                className="textarea-field text-sm"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!prompt.trim()}
        className="btn-primary w-full py-3"
      >
        开始生成
      </button>
    </form>
  );
}
