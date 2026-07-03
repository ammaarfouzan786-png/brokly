'use client';

import { useEffect, useRef, useState } from 'react';
import { useUI } from '../ui-context';
import { useStore } from '@/lib/store';
import { suggestReplies } from '@/lib/messages';
import { cx, digits } from '@/lib/util';

function Thread({ convId }: { convId: string }) {
  const conv = useStore((s) => s.conversations.find((c) => c.id === convId));
  const markRead = useStore((s) => s.markRead);
  const send = useStore((s) => s.sendWhatsApp);
  const toast = useStore((s) => s.toast);
  const [text, setText] = useState('');
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markRead(convId);
  }, [convId, markRead]);

  const count = conv?.msgs.length ?? 0;
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = 9e9;
  }, [count]);

  if (!conv) return null;
  const suggestions = suggestReplies(conv);

  async function doSend(preset?: string) {
    const body = (preset ?? text).trim();
    if (!body) return;
    setText('');
    const r = await send(convId, body);
    toast(r.live ? 'Sent on WhatsApp ✓' : 'Message sent (demo)');
  }

  return (
    <div>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="linkico" style={{ width: 40, height: 40, background: 'var(--waSoft)', color: 'var(--wa)' }}>
          {conv.name[0]}
        </div>
        <div>
          <b>{conv.name}</b>
          <div className="tiny muted">{conv.phone}</div>
        </div>
        <a className="btn sm wa" style={{ marginLeft: 'auto' }} href={`https://wa.me/${digits(conv.phone)}`} target="_blank" rel="noreferrer">
          Open WhatsApp
        </a>
      </div>
      <div className="thread">
        <div className="msgs" ref={msgsRef}>
          {conv.msgs.map((m, i) => (
            <div key={i} className={cx('bub', m.me ? 'me' : 'them')}>
              {m.t}
            </div>
          ))}
        </div>
        <div className="suggest">
          {suggestions.map((s, i) => (
            <button key={i} className="sgchip" onClick={() => setText(s)}>
              ✦ {s}
            </button>
          ))}
        </div>
        <div className="composer">
          <input
            className="in"
            placeholder="Type a reply…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') doSend();
            }}
          />
          <button className="btn brand" onClick={() => doSend()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export function Inbox() {
  const conversations = useStore((s) => s.conversations);
  const { showModal, waConfigured } = useUI();

  return (
    <section className="screen">
      <div className="h1">WhatsApp inbox</div>
      <div className="sub">
        Every client chat in one place, with AI-suggested replies.{' '}
        {waConfigured ? (
          <span className="muted" style={{ color: 'var(--wa)', fontWeight: 600 }}>
            ● Live — connected to the WhatsApp Cloud API.
          </span>
        ) : (
          <span className="muted">(Demo mode — add Cloud API keys in .env.local for real two-way.)</span>
        )}
      </div>
      <div className="sectionh">Chats</div>
      <div className="card chatlist">
        {conversations.map((c) => {
          const last = c.msgs[c.msgs.length - 1];
          const tag =
            c.tag === 'HOT'
              ? ['var(--hotSoft)', 'var(--hot)']
              : c.tag === 'CO-BROKE'
                ? ['var(--aiSoft)', 'var(--ai)']
                : null;
          return (
            <div key={c.id} className="linkrow" style={{ cursor: 'pointer' }} onClick={() => showModal(<Thread convId={c.id} />)}>
              <div className="linkico" style={{ background: 'var(--waSoft)', color: 'var(--wa)' }}>
                {c.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                  <b>{c.name}</b>
                  {tag && (
                    <span className="pill" style={{ background: tag[0], color: tag[1] }}>
                      {c.tag}
                    </span>
                  )}
                </div>
                <div className="sm muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {last?.me ? 'You: ' : ''}
                  {last?.t}
                </div>
              </div>
              {c.unread > 0 && (
                <span className="pill" style={{ background: 'var(--wa)', color: '#fff' }}>
                  {c.unread}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
