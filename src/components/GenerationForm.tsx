'use client';

import { useState, useEffect } from 'react';
import { GenerationMode, GenerationParams, SIZE_PRESETS, DEFAULTS } from '@/types';

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
  isLoading: boolean;
  defaultModel?: string;
  defaultSampler?: string;
  defaultScheduler?: string;
}

export default function GenerationForm({
  onSubmit,
  isLoading,
  defaultModel = '',
  defaultSampler = DEFAULTS.sampler,
  defaultScheduler = DEFAULTS.scheduler,
}: GenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>('enhance');
  const [sizeIndex, setSizeIndex] = useState(0);
  const [steps, setSteps] = useState(DEFAULTS.steps);
  const [cfg, setCfg] = useState(DEFAULTS.cfg);
  const [seed, setSeed] = useState(DEFAULTS.seed);
  const [model, setModel] = useState(defaultModel);
  const [sampler, setSampler] = useState(defaultSampler);
  const [scheduler, setScheduler] = useState(defaultScheduler);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState(DEFAULTS.negativePrompt);

  // Update defaults when props change
  useEffect(() => {
    if (defaultModel && !model) setModel(defaultModel);
  }, [defaultModel, model]);

  useEffect(() => {
    setSampler(defaultSampler);
  }, [defaultSampler]);

  useEffect(() => {
    setScheduler(defaultScheduler);
  }, [defaultScheduler]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const selectedSize = SIZE_PRESETS[sizeIndex];
    onSubmit(prompt, mode, {
      width: selectedSize.width,
      height: selectedSize.height,
      steps,
      cfg,
      seed,
      model: model || defaultModel,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          描述你想要的图像
        </label>
        <textarea
          className="textarea-field"
          placeholder="例如：一个穿着白色连衣裙的少女站在樱花树下，阳光透过花瓣洒落..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
      </div>

      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
          处理模式
        </label>
        <div className="flex flex-wrap gap-3">
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`mode-btn flex-1 min-w-[100px] ${mode === m.key ? 'active' : ''}`}
              onClick={() => setMode(m.key)}
            >
              <div className="font-semibold">{m.label}</div>
              <div className="text-xs mt-1 opacity-80">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Size Selection */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          图像尺寸
        </label>
        <div className="flex flex-wrap gap-2">
          {SIZE_PRESETS.map((size, index) => (
            <button
              key={index}
              type="button"
              className={`mode-btn text-sm py-2 px-4 ${sizeIndex === index ? 'active' : ''}`}
              onClick={() => setSizeIndex(index)}
            >
              {size.label}
              <span className="text-xs ml-1 opacity-70">
                ({size.width}×{size.height})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Basic Parameters */}
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

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Checkpoint 模型
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="例如：animagineXL.safetensors"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {defaultModel ? `默认: ${defaultModel}` : '请在设置中配置默认模型'}
        </p>
      </div>

      {/* Advanced Settings (Collapsible) */}
      <div>
        <button
          type="button"
          className="collapsible-header w-full"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            高级设置
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
          <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(255, 107, 157, 0.03)' }}>
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
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!prompt.trim() || isLoading}
        className="btn-primary w-full text-lg py-4"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            生成中...
          </span>
        ) : (
          '✨ 开始生成'
        )}
      </button>
    </form>
  );
}
