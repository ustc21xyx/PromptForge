'use client';

import { useMemo, useState } from 'react';
import { HistoryItem } from '@/types';
import { removeFromHistory } from '@/lib/history';

interface TaskQueuePanelProps {
  history: HistoryItem[];
  onHistoryChange: () => void;
  onSelectItem: (item: HistoryItem) => void;
  defaultOpen?: boolean;
  maxItems?: number;
}

function countByStatus(items: HistoryItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { pending: 0, processing: 0, completed: 0, error: 0 } as Record<HistoryItem['status'], number>
  );
}

export default function TaskQueuePanel({
  history,
  onHistoryChange,
  onSelectItem,
  defaultOpen = false,
  maxItems = 20,
}: TaskQueuePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  const items = useMemo(() => history.slice(0, maxItems), [history, maxItems]);
  const counts = useMemo(() => countByStatus(history), [history]);
  const activeCount = counts.pending + counts.processing;

  if (history.length === 0) return null;

  return (
    <div className="glass-card-static p-3">
      <button
        type="button"
        className="w-full flex items-center justify-between text-sm font-medium"
        style={{ color: 'var(--text-secondary)' }}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          任务队列
          {activeCount > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255, 107, 157, 0.12)', color: 'var(--color-primary)' }}
            >
              {activeCount} 进行中
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {counts.completed} 已生成 / {counts.error} 失败
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="var(--text-muted)"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer"
              style={{ background: 'rgba(255, 107, 157, 0.04)' }}
              onClick={() => onSelectItem(item)}
              title="点击查看"
            >
              <div
                className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255, 107, 157, 0.06)' }}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : item.status === 'error' ? (
                  <svg className="w-5 h-5" fill="none" stroke="#f87171" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="var(--color-primary)" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                    <path className="opacity-75" fill="var(--color-primary)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.originalPrompt}
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background:
                        item.status === 'completed'
                          ? 'rgba(74, 222, 128, 0.12)'
                          : item.status === 'error'
                            ? 'rgba(248, 113, 113, 0.12)'
                            : 'rgba(255, 179, 71, 0.12)',
                      color:
                        item.status === 'completed'
                          ? '#16a34a'
                          : item.status === 'error'
                            ? '#dc2626'
                            : '#b45309',
                    }}
                  >
                    {item.status === 'pending'
                      ? '排队'
                      : item.status === 'processing'
                        ? '生成中'
                        : item.status === 'completed'
                          ? '完成'
                          : '失败'}
                  </span>
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {new Date(item.timestamp).toLocaleString('zh-CN')}
                </p>
              </div>

              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255, 255, 255, 0.75)' }}
                title="移除"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromHistory(item.id);
                  onHistoryChange();
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {history.length > maxItems && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              仅展示最近 {maxItems} 条，更多请到“历史”查看
            </p>
          )}
        </div>
      )}
    </div>
  );
}

