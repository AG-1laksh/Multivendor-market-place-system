import { useEffect, useMemo, useRef, useState } from 'react';

const ChevronIcon = ({ open }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className={`transition-transform ${open ? 'rotate-180' : ''}`}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const CustomSelect = ({ value, onChange, options = [], placeholder = 'Select', className = '' }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const idRef = useRef(`custom-select-${Math.random().toString(36).slice(2, 10)}`);

  const selectedLabel = useMemo(() => {
    const found = options.find((opt) => String(opt.value) === String(value));
    return found?.label ?? placeholder;
  }, [options, placeholder, value]);

  useEffect(() => {
    const onDocClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    const onAnySelectOpen = (event) => {
      if (event.detail !== idRef.current) setOpen(false);
    };

    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('custom-select:open', onAnySelectOpen);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('custom-select:open', onAnySelectOpen);
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative isolate ${open ? 'z-60' : ''} ${className}`}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              window.dispatchEvent(new CustomEvent('custom-select:open', { detail: idRef.current }));
            }
            return next;
          });
        }}
        className="search-glass flex w-full items-center justify-between px-3 py-2 text-left text-white outline-none"
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="amber-text">
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <div className="custom-select-menu absolute left-0 top-[calc(100%+8px)] z-50 max-h-64 w-full overflow-y-auto overflow-x-hidden rounded-xl border border-white/10 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={`${opt.value}-${opt.label}`}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  isSelected
                    ? 'bg-[#3a321f] text-[#FFC107]'
                    : 'text-[#f5f5f3] hover:bg-[#26262b] hover:text-[#FFC107]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
