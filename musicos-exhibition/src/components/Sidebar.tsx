import { useState } from 'react';
import { Link } from 'wouter';
import { EPISODES } from '../lib/episodes.js';
import './sidebar.css';

interface SidebarProps {
  currentEpisodeId: string;
}

export function Sidebar({ currentEpisodeId }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
      <button
        type="button"
        className="sidebar__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Collapse episode list' : 'Expand episode list'}
      >
        <span className="sidebar__toggle-icon">{open ? '‹' : '›'}</span>
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
