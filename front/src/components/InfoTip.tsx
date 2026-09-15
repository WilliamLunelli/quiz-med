import { useEffect, useState } from 'react';

interface Props {
  text: string;
  /** Ancoragem horizontal do balão, para não sair da tela perto das bordas. */
  align?: 'left' | 'center' | 'right';
  label?: string;
}

/**
 * Tooltip que funciona no celular (toque abre/fecha) e no desktop (hover).
 * Um "?" pequeno; ao tocar, mostra o balão; toque fora fecha.
 */
export function InfoTip({ text, align = 'center', label = 'Mais informação' }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const id = window.setTimeout(() => document.addEventListener('click', close), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('click', close);
    };
  }, [open]);

  return (
    <span className="infotip">
      <button
        type="button"
        className="infotip-dot"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        ?
      </button>
      {open && (
        <span className="infotip-bubble" data-align={align} role="tooltip">
          {text}
        </span>
      )}
    </span>
  );
}
