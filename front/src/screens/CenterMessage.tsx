interface Props {
  title: string;
  message?: string;
  spinner?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export function CenterMessage({ title, message, spinner, actionLabel, onAction }: Props) {
  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, maxWidth: 340 }}>
        {spinner && <div className="spin" aria-hidden />}
        <h2 style={{ margin: 0, font: '600 24px/1.2 var(--font)', color: 'var(--q-navy)' }}>{title}</h2>
        {message && <p style={{ margin: 0, font: '400 15px/1.5 var(--font)', color: 'var(--ink-60)' }}>{message}</p>}
        {actionLabel && onAction && (
          <button
            className="qbtn qbtn--navy"
            style={{ height: 52, padding: '0 28px', width: 'auto', font: '600 16px/1 var(--font)' }}
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
