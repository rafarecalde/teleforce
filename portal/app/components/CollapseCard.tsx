'use client';

import { useId, useState } from 'react';

export default function CollapseCard({
  id,
  title,
  label,
  children,
}: {
  id?: string;
  title: string;
  /** Short action on the header row, such as Schedule. */
  label?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <section className="card collapse-card" id={id}>
      <h2>
        <button
          type="button"
          className="collapse-head"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="collapse-title">{title}</span>
          {label && <span className="collapse-label">{label}</span>}
          <svg className="collapse-chevron" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path
              d="M5 7.5 10 12.5 15 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </h2>
      <div id={panelId} className="collapse-panel" hidden={!open}>
        {open ? children : null}
      </div>
    </section>
  );
}
