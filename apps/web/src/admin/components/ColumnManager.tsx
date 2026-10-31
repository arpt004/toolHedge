import { useEffect, useRef, useState } from 'react';

export interface ColumnDef {
  key: string;
  label: string;
  required?: boolean;
}

interface ColumnManagerProps {
  columns: ColumnDef[];
  visible: string[];
  onToggle: (key: string, required: boolean) => void;
  onReset: () => void;
  syncError?: boolean;
}

export function ColumnManager({ columns, visible, onToggle, onReset, syncError }: ColumnManagerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="admin-column-popover-wrap" ref={wrapRef}>
      <button className="button button-secondary" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        ☰ Columns
      </button>
      {open && (
        <div className="admin-column-popover" role="menu" aria-label="Manage visible columns">
          <h4>Visible columns</h4>
          {columns.map((column) => (
            <label key={column.key}>
              <input
                type="checkbox"
                checked={visible.includes(column.key)}
                disabled={column.required}
                onChange={() => onToggle(column.key, Boolean(column.required))}
              />
              {column.label}
              {column.required && <small style={{ color: '#93a299' }}> (required)</small>}
            </label>
          ))}
          {syncError && (
            <p className="admin-field-hint" style={{ color: '#b23b3b', marginTop: 6 }}>
              Couldn't save to server — showing your change locally; it will retry next edit.
            </p>
          )}
          <div className="admin-column-popover-actions">
            <button onClick={onReset}>Reset to default</button>
            <button onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
