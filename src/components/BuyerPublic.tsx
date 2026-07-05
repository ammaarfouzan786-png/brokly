'use client';

import { useState } from 'react';
import type { LinkPayload } from '@/lib/link-store';
import { BuyerHeader, BuyerCard, BuyerDetail, EnquiryForm, buyerBrokerFrom, type EnquiryInput } from './buyer-view';

export function BuyerPublic({ data }: { data: LinkPayload }) {
  const [openId, setOpenId] = useState<string | null>(data.kind === 'single' ? (data.props[0]?.id ?? null) : null);
  const [enquireFor, setEnquireFor] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(propId: string, e: EnquiryInput) {
    const prop = data.props.find((p) => p.id === propId);
    try {
      await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: data.slug, propId, propTitle: prop?.title, ...e }),
      });
    } catch {
      /* ignore */
    }
    setEnquireFor(null);
    setSent(true);
  }

  const openProp = openId ? data.props.find((p) => p.id === openId) : null;
  const justUpdated = data.kind === 'collection' && !!data.updated && data.updated > data.created;
  const agency = data.brokerAgency || data.brokerName;
  const broker = buyerBrokerFrom(data.brokerName, data.brokerScore);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: 'var(--surface2)', minHeight: '100vh', boxShadow: 'var(--shadow)' }}>
      {sent ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <div className="bric" style={{ fontSize: 22, fontWeight: 800, marginTop: 12 }}>
            Enquiry sent!
          </div>
          <div className="muted" style={{ marginTop: 8, fontSize: 14 }}>
            {agency} has your details and will reach out shortly on WhatsApp.
          </div>
          <button className="btn brand" style={{ marginTop: 20 }} onClick={() => setSent(false)}>
            Back to listings
          </button>
        </div>
      ) : openProp ? (
        <BuyerDetail
          p={openProp}
          broker={broker}
          onBack={data.kind === 'collection' ? () => setOpenId(null) : undefined}
          onEnquire={() => setEnquireFor(openProp.id)}
        />
      ) : (
        <>
          <BuyerHeader
            preview={false}
            sharedBy={agency}
            title={data.kind === 'collection' ? 'Homes picked for you' : 'Your property'}
            subtitle="Tap a home to see details and enquire"
          />
          <div style={{ padding: 14 }}>
            {justUpdated && (
              <div
                className="card"
                style={{ padding: '10px 12px', marginBottom: 12, background: 'var(--goldSoft)', borderColor: 'var(--gold)', color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}
              >
                ✦ {agency} just added new homes to your collection — look for the NEW tag.
              </div>
            )}
            {data.props.length ? (
              data.props.map((p) => <BuyerCard key={p.id} p={p} score={p.score} onOpen={() => setOpenId(p.id)} />)
            ) : (
              <div className="empty">No homes in this collection yet — check back soon.</div>
            )}
          </div>
        </>
      )}

      {enquireFor && (
        <EnquiryForm
          title={data.props.find((p) => p.id === enquireFor)?.title || 'this property'}
          onClose={() => setEnquireFor(null)}
          onSubmit={(e) => submit(enquireFor, e)}
        />
      )}
    </div>
  );
}
