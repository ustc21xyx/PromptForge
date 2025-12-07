'use client';

interface GenerationResultProps {
  status: 'pending' | 'processing' | 'completed' | 'error' | null;
  imageUrl: string | null;
  error: string | null;
}

export default function GenerationResult({
  status,
  imageUrl,
  error,
}: GenerationResultProps) {
  // Show placeholder when no generation is in progress
  if (!status) {
    return (
      <div
        className="glass-card p-6 flex flex-col items-center justify-center text-center"
        style={{ minHeight: '280px' }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.1) 0%, rgba(255, 179, 71, 0.1) 100%)',
          }}
        >
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="var(--color-primary)"
            viewBox="0 0 24 24"
            style={{ opacity: 0.6 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
          等待创作
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          图片将显示在这里
        </p>
      </div>
    );
  }

  const statusColors = {
    pending: 'var(--color-accent)',
    processing: 'var(--color-primary)',
    completed: '#4ade80',
    error: '#f87171',
  };

  return (
    <div className="glass-card p-4">
      {/* Status - Loading/Error */}
      {status !== 'completed' && (
        <div className="flex flex-col items-center py-6">
          {(status === 'pending' || status === 'processing') && (
            <>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center loading-glow"
                style={{
                  background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)`,
                }}
              >
                <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
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
              </div>
              <p className="mt-3 font-medium" style={{ color: statusColors[status] }}>
                {status === 'pending' ? '排队中...' : '生成中...'}
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(248, 113, 113, 0.1)' }}
              >
                <svg className="w-8 h-8" fill="none" stroke="#f87171" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-3 font-medium" style={{ color: '#f87171' }}>生成失败</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {error || '请检查连接后重试'}
              </p>
            </>
          )}
        </div>
      )}

      {/* Generated Image */}
      {status === 'completed' && imageUrl && (
        <div>
          <div className="rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-soft)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Generated" className="w-full h-auto block" />
          </div>
          <a
            href={imageUrl}
            download="generated-image.png"
            className="btn-primary w-full text-center mt-3 py-2 text-sm"
          >
            下载图片
          </a>
        </div>
      )}
    </div>
  );
}
