'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Screen } from '@/lib/store';
import { useStore } from '@/lib/store';

export interface BuyerLink {
  id: string;
  kind: 'single' | 'collection';
  propId?: string;
  clientId?: string;
}

interface UICtx {
  screen: Screen;
  nav: (s: Screen) => void;

  modal: React.ReactNode | null;
  showModal: (n: React.ReactNode) => void;
  closeModal: () => void;

  buyer: { link: BuyerLink; preview: boolean } | null;
  openBuyerLink: (link: BuyerLink, preview: boolean) => void;
  previewSingle: (propId: string) => void;
  closeBuyer: () => void;

  assistantOpen: boolean;
  toggleAssistant: () => void;
  openAssistant: () => void;

  waConfigured: boolean | null;
  setWaConfigured: (v: boolean) => void;
}

const Ctx = createContext<UICtx | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>('home');
  const [modal, setModal] = useState<React.ReactNode | null>(null);
  const [buyer, setBuyer] = useState<{ link: BuyerLink; preview: boolean } | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [waConfigured, setWaConfigured] = useState<boolean | null>(null);
  const registerView = useStore((s) => s.registerView);

  const nav = useCallback((s: Screen) => {
    setScreen(s);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, []);

  const openBuyerLink = useCallback(
    (link: BuyerLink, preview: boolean) => {
      if (!preview && link.id !== 'tmp') registerView(link.id);
      setBuyer({ link, preview });
    },
    [registerView],
  );

  const previewSingle = useCallback((propId: string) => {
    setBuyer({ link: { id: 'tmp', kind: 'single', propId }, preview: true });
  }, []);

  const value = useMemo<UICtx>(
    () => ({
      screen, nav,
      modal, showModal: setModal, closeModal: () => setModal(null),
      buyer, openBuyerLink, previewSingle, closeBuyer: () => setBuyer(null),
      assistantOpen,
      toggleAssistant: () => setAssistantOpen((o) => !o),
      openAssistant: () => setAssistantOpen(true),
      waConfigured, setWaConfigured,
    }),
    [screen, nav, modal, buyer, openBuyerLink, previewSingle, assistantOpen, waConfigured],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI(): UICtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUI must be used within UIProvider');
  return c;
}
