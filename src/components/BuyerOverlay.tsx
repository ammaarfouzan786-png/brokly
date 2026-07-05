'use client';

import { useState } from 'react';
import { useUI } from './ui-context';
import { useStore } from '@/lib/store';
import { strongMatches } from '@/lib/matching';
import { activeBroker } from '@/lib/broker';
import { BuyerHeader, BuyerCard, BuyerDetail, EnquiryForm } from './buyer-view';

/** In-app "Open as buyer" / "Preview" — the phone-framed buyer experience,
 *  sourced from the local store so it works instantly for the broker. */
export function BuyerOverlay() {
  const { buyer, closeBuyer } = useUI();
  const properties = useStore((s) => s.properties);
  const clients = useStore((s) => s.clients);
  const addEnquiry = useStore((s) => s.addEnquiry);
  const toast = useStore((s) => s.toast);
  const [openPropId, setOpenPropId] = useState<string | null>(null);
  const [enquireFor, setEnquireFor] = useState<string | null>(null);

  if (!buyer) return null;
  const { link, preview } = buyer;
  const linkId = link.id !== 'tmp' ? link.id : undefined;

  let content: React.ReactNode = null;

  if (link.kind === 'single') {
    const p = properties.find((x) => x.id === link.propId);
    content = p ? (
      <>
        <BuyerHeader
          preview={preview}
          sharedBy={activeBroker().agency}
          title="Your property"
          subtitle="Tap enquire to reach the broker"
          onClose={closeBuyer}
        />
        <BuyerDetail p={p} onEnquire={() => setEnquireFor(p.id)} />
      </>
    ) : (
      <div className="empty">Property not found.</div>
    );
  } else {
    const req = clients.find((c) => c.id === link.clientId);
    const list = req ? strongMatches(properties, req) : [];
    if (openPropId) {
      const p = properties.find((x) => x.id === openPropId);
      content = p ? (
        <BuyerDetail p={p} onBack={() => setOpenPropId(null)} onClose={closeBuyer} onEnquire={() => setEnquireFor(p.id)} />
      ) : null;
    } else {
      content = (
        <>
          <BuyerHeader
            preview={preview}
            sharedBy={activeBroker().agency}
            title="Homes picked for you"
            subtitle="Tap a home to see details and enquire"
            onClose={closeBuyer}
          />
          <div style={{ padding: 14 }}>
            {list.length ? (
              list.map((m) => <BuyerCard key={m.p.id} p={m.p} score={m.score} onOpen={() => setOpenPropId(m.p.id)} />)
            ) : (
              <div className="empty">No homes yet — new matches appear here.</div>
            )}
          </div>
        </>
      );
    }
  }

  const enquireProp = enquireFor ? properties.find((x) => x.id === enquireFor) : null;

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeBuyer();
      }}
    >
      <div className="phone">
        <div className="pscroll">
          <div className="phbar" />
          {content}
        </div>
        {enquireFor && (
          <EnquiryForm
            title={enquireProp?.title || 'this property'}
            onClose={() => setEnquireFor(null)}
            onSubmit={({ name, phone, msg }) => {
              const score = addEnquiry({ propId: enquireFor, linkId, name, phone, msg });
              setEnquireFor(null);
              toast('Enquiry sent → it just landed on your agent dashboard (AI ' + score + ')');
            }}
          />
        )}
      </div>
    </div>
  );
}
