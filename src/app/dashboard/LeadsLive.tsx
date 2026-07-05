'use client';

import { useEffect, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';

type Lead = {
  id: string;
  name?: string;
  phone?: string;
  message?: string;
  heat?: string;
  score?: number;
  properties?: { title?: string; slug?: string };
};

const HEAT: Record<string, [string, string]> = {
  hot: ['var(--hot)', '#fff'],
  warm: ['var(--gold)', '#fff'],
  cold: ['var(--line)', 'var(--ink2)'],
};

export function LeadsLive({ initial }: { initial: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initial);
  const [flash, setFlash] = useState<string | null>(null);
  const seen = useRef(new Set(initial.map((l) => l.id)));

  function addLead(lead: Lead) {
    if (!lead?.id || seen.current.has(lead.id)) return;
    seen.current.add(lead.id);
    setLeads((p) => [lead, ...p]);
    setFlash(lead.id);
    setTimeout(() => setFlash((f) => (f === lead.id ? null : f)), 2500);
  }

  useEffect(() => {
    const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    let remove: (() => void) | undefined;
    if (hasSupabase) {
      const sb = supabaseBrowser();
      const ch = sb.channel('leads-stream').on('broadcast', { event: 'new_lead' }, ({ payload }) => addLead(payload?.lead)).subscribe();
      remove = () => sb.removeChannel(ch);
    }
    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/leads');
        const { leads: fresh } = await res.json();
        (fresh || []).slice().reverse().forEach((l: Lead) => addLead(l));
      } catch {
        /* ignore */
      }
    }, 12000);
    return () => {
      remove?.();
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const live = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="sm muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 9, height: 9, borderRadius: '50%',
            background: live ? 'var(--brand)' : 'var(--gold)',
            boxShadow: live ? '0 0 0 4px rgba(11,107,58,.15)' : '0 0 0 4px rgba(201,138,21,.15)',
          }}
        />
        {live
          ? 'Live — new WhatsApp enquiries appear here instantly'
          : 'Demo — checking for new enquiries every 12s (connect Supabase for instant realtime)'}
      </div>

      {leads.length === 0 && (
        <div className="empty">No leads yet. Share a listing — the moment a buyer taps <b>Enquire</b>, it pops up here.</div>
      )}

      {leads.map((l) => {
        const heat = HEAT[l.heat || 'warm'];
        return (
          <div key={l.id} className="card" style={{ padding: 14, boxShadow: flash === l.id ? '0 0 0 2px var(--brand)' : undefined, transition: 'box-shadow .3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                  <span className="tagline" style={{ background: heat[0], color: heat[1] }}>{(l.heat || 'warm').toUpperCase()}</span>
                  <b>{l.name || 'New enquiry'}</b>
                  {l.score != null && <span className="tiny muted">AI {l.score}</span>}
                </div>
                {l.properties?.title && <div className="sm muted" style={{ marginTop: 2 }}>↳ {l.properties.title}</div>}
                {l.message && <div className="sm" style={{ marginTop: 2 }}>{l.message}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {l.phone && l.phone !== 'unknown' && (
                  <>
                    <a className="btn sm" href={`tel:${l.phone}`}>Call</a>
                    <a className="btn sm wa" href={`https://wa.me/${l.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WA</a>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
