'use client';

import { HistoryItem } from '@/types';
import { clearHistory, removeFromHistory } from '@/lib/history';

interface HistoryPanelProps {
  history: HistoryItem[];
  onHistoryChange: () => void;
  onSelectItem: (item: HistoryItem) => void;
}

export default function HistoryPanel({
  history,
  onHistoryChange,
  onSelectItem,
}: HistoryPanelProps) {
  const handleClearAll = () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      clearHistory();
      onHistoryChange();
    }
  };

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromHistory(id);
    onHistoryChange();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

    return date.toLocaleDateString('zh-CN');
  };

  const modeLabels = {
    translate: '翻译',
    enhance: '完善',
    creative: '创意',
  };

  if (history.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(255, 107, 157, 0.1)' }}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="var(--color-primary)"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>暂无历史记录</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          生成的图像将显示在这里
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          历史记录
        </h2>
        <button
          onClick={handleClearAll}
          className="text-sm px-3 py-1 rounded-lg transition-colors"
          style={{
            color: 'var(--text-muted)',
            background: 'rgba(255, 107, 157, 0.05)',
          }}
        >
          清空全部
        </button>
      </div>

      {/* History List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => (
          <div
            key={item.id}
            className="history-item cursor-pointer group relative"
            onClick={() => onSelectItem(item)}
          >
            {/* Image Preview */}
            {item.imageUrl ? (
              <div className="aspect-square overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt="Generated"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            ) : (
              <div
                className="aspect-square flex items-center justify-center"
                style={{ background: 'rgba(255, 107, 157, 0.05)' }}
              >
                {item.status === 'error' ? (
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="var(--text-muted)"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 animate-spin" fill="none" stroke="var(--color-primary)" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="var(--color-primary)"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
              </div>
            )}

            {/* Info */}
            <div className="p-3">
              <p
                className="text-sm line-clamp-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.originalPrompt}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(255, 107, 157, 0.1)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {modeLabels[item.mode]}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(item.timestamp)}
                </span>
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={(e) => handleRemoveItem(item.id, e)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="var(--text-muted)"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
