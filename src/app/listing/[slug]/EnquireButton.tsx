'use client';

import { useState } from 'react';

export function EnquireButton({
  propertyId,
  brokerPhone,
  title,
  slug,
}: {
  propertyId: string;
  brokerPhone?: string;
  title: string;
  slug: string;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);

  const listingUrl = (typeof window !== 'undefined' ? window.location.origin : '') + '/listing/' + slug;

  async function submit() {
    // Log the lead to the broker's dashboard (fires live via Realtime).
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, phone: phone || 'unknown', name, message: `Interested in ${title}` }),
      });
    } catch {
      /* best effort */
    }
    setSent(true);
    // Hand off to the broker's WhatsApp directly (end-to-end, no middleman).
    if (brokerPhone) {
      const msg = `Hi, I'm interested in your property: ${title}. Please share more details. ${listingUrl}`;
      window.open(`https://wa.me/${brokerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  }

  if (sent) {
    return (
      <div className="card" style={{ padding: 14, textAlign: 'center', background: 'var(--brandSoft)', borderColor: '#CFE7DA' }}>
        <b style={{ color: 'var(--brand)' }}>✅ Enquiry sent!</b>
        <div className="sm muted" style={{ marginTop: 2 }}>The broker has your details and will reach out on WhatsApp.</div>
      </div>
    );
  }

  if (!open) {
    return (
      <button className="btn wa full" style={{ padding: 15, fontSize: 15 }} onClick={() => setOpen(true)}>
        💬 Enquire on WhatsApp
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="in" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="in" placeholder="Phone" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <button className="btn wa full" style={{ padding: 14 }} onClick={submit}>
        Send enquiry &amp; open WhatsApp →
      </button>
    </div>
  );
}
