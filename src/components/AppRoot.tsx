'use client';

import { useEffect, useState } from 'react';
import { useStore, type Screen } from '@/lib/store';
import { UIProvider, useUI } from './ui-context';
import { Shell } from './Shell';
import { Modal } from './Modal';
import { Toast } from './Toast';
import { Assistant } from './Assistant';
import { BuyerOverlay } from './BuyerOverlay';
import { Auth } from './Auth';
import { Onboarding } from './Onboarding';
import { Home } from './screens/Home';
import { Inbox } from './screens/Inbox';
import { Stock } from './screens/Stock';
import { Clients } from './screens/Clients';
import { Cobroke } from './screens/Cobroke';
import { Links } from './screens/Links';
import { Leads } from './screens/Leads';
import { Money } from './screens/Money';
import { Lawyer } from './screens/Lawyer';
import { Brand } from './screens/Brand';
import { Marketing } from './screens/Marketing';
import { Pulse } from './screens/Pulse';

const AUTH_KEY = 'brokly-auth';

function Splash() {
  return (
    <div className="auth" style={{ gap: 14 }}>
      <div className="auth-mark" style={{ width: 68, height: 68, fontSize: 34 }}>
        b
      </div>
      <div className="bric" style={{ fontSize: 30, fontWeight: 800, color: '#fff' }}>
        brokly
      </div>
      <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 14 }}>Your whole brokerage. One app.</div>
    </div>
  );
}

function renderScreen(s: Screen) {
  switch (s) {
    case 'home': return <Home />;
    case 'inbox': return <Inbox />;
    case 'stock': return <Stock />;
    case 'clients': return <Clients />;
    case 'cobroke': return <Cobroke />;
    case 'links': return <Links />;
    case 'leads': return <Leads />;
    case 'money': return <Money />;
    case 'lawyer': return <Lawyer />;
    case 'brand': return <Brand />;
    case 'marketing': return <Marketing />;
    case 'pulse': return <Pulse />;
    default: return <Home />;
  }
}

function AppInner({ onLogout }: { onLogout: () => void }) {
  const { screen, modal, closeModal, buyer, assistantOpen, toggleAssistant, setWaConfigured } = useUI();
  const ingest = useStore((s) => s.ingestInbound);
  const ingestEnquiries = useStore((s) => s.ingestEnquiries);

  // Detect whether the WhatsApp Cloud API is configured.
  useEffect(() => {
    let live = true;
    fetch('/api/whatsapp/status')
      .then((r) => r.json())
      .then((d) => live && setWaConfigured(!!d.configured))
      .catch(() => live && setWaConfigured(false));
    return () => {
      live = false;
    };
  }, [setWaConfigured]);

  // Poll for inbound WhatsApp messages received by the webhook.
  useEffect(() => {
    let stop = false;
    async function tick() {
      try {
        const since = useStore.getState().waCursor;
        const r = await fetch('/api/whatsapp/messages?since=' + since);
        const d = await r.json();
        if (!stop) ingest(Array.isArray(d.items) ? d.items : [], typeof d.cursor === 'number' ? d.cursor : since);
      } catch {
        /* ignore transient poll failures */
      }
    }
    tick();
    const iv = setInterval(tick, 5000);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, [ingest]);

  // Poll for buyer enquiries submitted on public share links.
  useEffect(() => {
    let stop = false;
    async function tick() {
      try {
        const since = useStore.getState().enqCursor;
        const r = await fetch('/api/enquiry?since=' + since);
        const d = await r.json();
        if (!stop) ingestEnquiries(Array.isArray(d.items) ? d.items : [], typeof d.cursor === 'number' ? d.cursor : since);
      } catch {
        /* ignore */
      }
    }
    tick();
    const iv = setInterval(tick, 6000);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, [ingestEnquiries]);

  return (
    <>
      <div className="shell">
        <Shell onLogout={onLogout} />
        <main>
          <div key={screen}>{renderScreen(screen)}</div>
        </main>
      </div>

      <button className="fab" onClick={toggleAssistant} aria-label="Open Brokly AI">
        ✦
      </button>
      {assistantOpen && <Assistant />}
      {modal && <Modal onClose={closeModal}>{modal}</Modal>}
      {buyer && <BuyerOverlay key={buyer.link.id + (buyer.link.propId || '')} />}
      <Toast />
    </>
  );
}

export function AppRoot() {
  const [mounted, setMounted] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    useStore.persist.rehydrate();
    try {
      setPhone(localStorage.getItem(AUTH_KEY));
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  if (!mounted) return <Splash />;

  if (!phone) {
    return (
      <Onboarding
        onDone={(p) => {
          try {
            localStorage.setItem(AUTH_KEY, p);
          } catch {
            /* ignore */
          }
          setPhone(p);
        }}
      />
    );
  }

  return (
    <UIProvider>
      <AppInner
        onLogout={() => {
          try {
            localStorage.removeItem(AUTH_KEY);
          } catch {
            /* ignore */
          }
          setPhone(null);
        }}
      />
    </UIProvider>
  );
}
