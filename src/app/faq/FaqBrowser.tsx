'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon3D } from '@/components/Icon3D';
import { plainAnswer, type FaqTopic } from '@/lib/faq';

/** Turns "[label](/path)" in an answer into links; the contact form opens as a popup like everywhere else. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((p, i) => {
    const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
    if (!m) return <Fragment key={i}>{p}</Fragment>;
    return <Link key={i} href={m[2]} data-modal={m[2] === '/contact' ? 'contact' : undefined}>{m[1]}</Link>;
  });
}

export function FaqBrowser({ topics }: { topics: FaqTopic[] }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  // A shared link like /faq#photo-tips opens that answer.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id || !topics.some((t) => t.items.some((i) => i.id === id))) return;
    setOpen(id);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'center' }));
  }, [topics]);

  const q = query.trim().toLowerCase();
  const shown = useMemo(() => topics
    .filter((t) => !topic || t.key === topic)
    .map((t) => ({ ...t, items: q ? t.items.filter((i) => `${i.q} ${plainAnswer(i)}`.toLowerCase().includes(q)) : t.items }))
    .filter((t) => t.items.length > 0), [topics, topic, q]);

  const toggle = (id: string) => {
    setOpen((o) => (o === id ? null : id));
    history.replaceState(null, '', open === id ? location.pathname : `#${id}`);
  };

  return (
    <div className="faq-body">
      <div className="faq-tools">
        <label className="faq-search">
          <span className="sr-only">Search questions</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.5" /><path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
          <input type="search" placeholder="Search, e.g. photo, safety, address" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <nav className="tabs filter-tabs" aria-label="Topics">
          <button type="button" aria-pressed={!topic} onClick={() => setTopic(null)}>All</button>
          {topics.map((t) => (
            <button key={t.key} type="button" aria-pressed={topic === t.key} onClick={(e) => { setTopic(topic === t.key ? null : t.key); e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }}>
              <Icon3D name={t.icon} size={20} />{t.label}
            </button>
          ))}
        </nav>
      </div>

      {shown.length === 0 && (
        <div className="empty">
          <Icon3D name="owl" size={64} />
          <h2>No answers match “{query}”</h2>
          <p className="muted">Try another word, or <Link href="/contact" data-modal="contact">send us your question</Link>.</p>
        </div>
      )}

      {shown.map((t) => (
        <section key={t.key} className="faq-topic" aria-labelledby={`faq-${t.key}`}>
          <h2 id={`faq-${t.key}`}><Icon3D name={t.icon} size={30} />{t.label}</h2>
          <div className="faq-list">
            {t.items.map((i) => {
              const isOpen = open === i.id || (q !== '' && shown.reduce((n, s) => n + s.items.length, 0) <= 3);
              return (
                <div key={i.id} id={i.id} className={`faq-item${isOpen ? ' open' : ''}`}>
                  <h3>
                    <button type="button" aria-expanded={isOpen} aria-controls={`${i.id}-a`} onClick={() => toggle(i.id)}>
                      <span>{i.q}</span>
                      <i aria-hidden="true" className="faq-plus" />
                    </button>
                  </h3>
                  <div id={`${i.id}-a`} className="faq-a" role="region" aria-label={i.q} hidden={!isOpen}>
                    {i.a.map((line, n) => <p key={n}><Rich text={line} /></p>)}
                    {i.list && <ul>{i.list.map((line, n) => <li key={n}><Rich text={line} /></li>)}</ul>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
