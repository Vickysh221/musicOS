import { useState } from 'react';
import { Link } from 'wouter';
import { EPISODES } from '../lib/episodes.js';
import './sidebar.css';

interface SidebarProps {
  currentEpisodeId: string;
  /** Lobby (homepage) variant: no background, ink text, hover-to-expand. */
  lobby?: boolean;
}

export function Sidebar({ currentEpisodeId, lobby = false }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const currentEp = EPISODES.find((e) => e.id === currentEpisodeId);
  const epLabel = currentEp ? `EP${String(currentEp.number).padStart(3, '0')}` : '';

  // In lobby mode the list expands on hover rather than via the click toggle.
  const hoverProps = lobby
    ? { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) }
    : {};

  return (
    <aside
      className={`sidebar${open ? ' sidebar--open' : ''}${lobby ? ' sidebar--lobby' : ''}`}
      {...hoverProps}
    >
      <button
        type="button"
        className="sidebar__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Collapse episode list' : 'Expand episode list'}
      >
        <span className="sidebar__toggle-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </span>
        {epLabel && <span className="sidebar__toggle-label">{epLabel}</span>}
      </button>

      <nav className="sidebar__nav" aria-label="Episodes">
        {EPISODES.map((ep) => {
          const active = ep.id === currentEpisodeId;
          return (
            <Link
              key={ep.id}
              href={`/${ep.id}`}
              className={`sidebar__item${active ? ' sidebar__item--active' : ''}`}
            >
              <span className="sidebar__num">EP{String(ep.number).padStart(2, '0')}</span>
              <span className="sidebar__info">
                <span className="sidebar__title-zh">{ep.titleZh}</span>
                <span className="sidebar__title-en">{ep.titleEn}</span>
                <span className="sidebar__anchor">{ep.anchor} · {ep.year}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
