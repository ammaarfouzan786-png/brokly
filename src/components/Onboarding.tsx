'use client';

import { useEffect, useRef, useState } from 'react';
import { digits } from '@/lib/util';
import { saveBroker, type BrokerProfile } from '@/lib/broker-profile';

type Step = 'account' | 'otp' | 'rera' | 'photo' | 'aadhaar' | 'face' | 'done';
const ORDER: Step[] = ['account', 'otp', 'rera', 'photo', 'aadhaar', 'face', 'done'];
const STEPS: Step[] = ['account', 'otp', 'rera', 'photo', 'aadhaar', 'face'];
const LABELS: Record<Step, string> = { account: 'Account', otp: 'Phone', rera: 'RERA', photo: 'Photo', aadhaar: 'Aadhaar', face: 'Face', done: 'Done' };

function BlueTick({ size = 22 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: '50%', background: '#1D9BF0', color: '#fff', fontSize: size * 0.6, fontWeight: 900, flex: 'none' }}>
      ✓
    </span>
  );
}

export function Onboarding({ onDone }: { onDone: (phone: string) => void }) {
  const [step, setStep] = useState<Step>('account');
  const [name, setName] = useState('');
  const [agency, setAgency] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [rera, setRera] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const [aadhaar, setAadhaar] = useState('');
  const [faceDone, setFaceDone] = useState(false);
  const boxes = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (step !== 'face') return;
    setFaceDone(false);
    const t = setTimeout(() => setFaceDone(true), 2600);
    return () => clearTimeout(t);
  }, [step]);

  const idx = ORDER.indexOf(step);
  const phoneOk = digits(phone).length >= 10;
  const emailOk = /.+@.+\..+/.test(email);
  const otpOk = otp.every((d) => d !== '');
  const reraOk = rera.trim().length >= 6;
  const aadhaarOk = digits(aadhaar).length === 12;

  function advance() {
    if (idx < ORDER.length - 1) setStep(ORDER[idx + 1]);
  }
  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = d;
    setOtp(next);
    if (d && i < 3) boxes.current[i + 1]?.focus();
  }
  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setPhoto(r.result as string);
    r.readAsDataURL(file);
  }

  function finish() {
    const profile: BrokerProfile = {
      name: name || 'Broker',
      agency: agency || 'Independent broker',
      email,
      phone: '91' + digits(phone).slice(-10),
      rera,
      aadhaarLast4: digits(aadhaar).slice(-4),
      photo,
      verified: true,
      brokerScore: 78,
      createdAt: Date.now(),
    };
    saveBroker(profile);
    // Text the broker on WhatsApp via the Brokly bot (demo simulates; live sends).
    const first = (name || 'there').split(' ')[0];
    fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: profile.phone,
        text: `👋 Welcome to Brokly, ${first}! Your broker account is verified ✅.\n\nSend me a property's photos + details here, then type *DONE* — I'll build you a beautiful listing in ~30s.`,
      }),
    }).catch(() => {});
    onDone(profile.phone);
  }

  const Progress = step === 'done' ? null : (
    <div style={{ display: 'flex', gap: 5, marginBottom: 22 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= idx ? 'var(--gold)' : 'rgba(255,255,255,.14)' }} title={LABELS[s]} />
      ))}
    </div>
  );

  return (
    <div className="auth">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div className="auth-mark" style={{ width: 40, height: 40, fontSize: 20 }}>b</div>
          <div className="bric" style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>brokly</div>
          {step !== 'done' && <div className="tiny" style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.5)' }}>Step {idx + 1} / {STEPS.length}</div>}
        </div>
        {Progress}

        {step === 'account' && (
          <>
            <h1 style={{ fontSize: 26 }}>Create your <em>broker account</em></h1>
            <div className="authsub">Tell us who you are. We&apos;ll verify you and set up your WhatsApp bot.</div>
            <button
              className="btn"
              style={{ width: '100%', background: '#fff', color: '#1a1a1a', marginBottom: 14, padding: 13, fontWeight: 700 }}
              onClick={() => { if (!email) setEmail('broker@gmail.com'); if (!name) setName('Ammar Khan'); }}
            >
              <span style={{ marginRight: 6 }}>G</span> Continue with Google
            </button>
            <label className="field" style={{ color: 'rgba(255,255,255,.5)' }}>Full name</label>
            <input className="in" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ammar Khan" />
            <label className="field" style={{ color: 'rgba(255,255,255,.5)' }}>Agency (optional)</label>
            <input className="in" value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="Ammar Estates" />
            <label className="field" style={{ color: 'rgba(255,255,255,.5)' }}>Email</label>
            <input className="in" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" inputMode="email" />
            <label className="field" style={{ color: 'rgba(255,255,255,.5)' }}>WhatsApp number</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="in" style={{ width: 74, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🇮🇳 +91</div>
              <input className="in" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" inputMode="numeric" maxLength={11} />
            </div>
            <button className="btn-cta" style={{ marginTop: 16 }} disabled={!(name && emailOk && phoneOk)} onClick={advance}>Continue →</button>
          </>
        )}

        {step === 'otp' && (
          <>
            <h1 style={{ fontSize: 26 }}>Verify your number</h1>
            <div className="authsub">We sent a 4-digit code to <b style={{ color: '#fff' }}>+91 {phone}</b></div>
            <div className="otp-row">
              {otp.map((d, i) => (
                <input key={i} ref={(el) => { boxes.current[i] = el; }} className="otp-box" inputMode="numeric" maxLength={1} value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) boxes.current[i - 1]?.focus(); }} />
              ))}
            </div>
            <div className="authfoot" style={{ marginTop: 0 }}>💡 Demo: type any 4 digits</div>
            <button className="btn-cta" style={{ marginTop: 16 }} disabled={!otpOk} onClick={advance}>Verify →</button>
          </>
        )}

        {step === 'rera' && (
          <>
            <h1 style={{ fontSize: 26 }}>RERA registration</h1>
            <div className="authsub">Verified RERA brokers get priority in the network and a trust badge.</div>
            <label className="field" style={{ color: 'rgba(255,255,255,.5)' }}>RERA registration number</label>
            <input className="in" value={rera} onChange={(e) => setRera(e.target.value)} placeholder="PRM/KA/RERA/1251/446/AG/..." />
            <div className="authfoot" style={{ marginTop: 10 }}>We verify this against the state RERA registry.</div>
            <button className="btn-cta" style={{ marginTop: 16 }} disabled={!reraOk} onClick={advance}>Verify RERA →</button>
            <button className="btn" style={{ marginTop: 10, width: '100%', background: 'transparent', color: 'rgba(255,255,255,.55)', borderColor: 'rgba(255,255,255,.15)' }} onClick={advance}>Skip for now</button>
          </>
        )}

        {step === 'photo' && (
          <>
            <h1 style={{ fontSize: 26 }}>Add your photo</h1>
            <div className="authsub">Buyers trust a face. This goes on your broker card and listings.</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, margin: '10px 0' }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: photo ? `center/cover url(${photo})` : 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                {!photo && '📷'}
              </div>
              <label className="btn" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.16)', cursor: 'pointer' }}>
                {photo ? 'Change photo' : 'Upload / take photo'}
                <input type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={onPhoto} />
              </label>
            </div>
            <button className="btn-cta" style={{ marginTop: 8 }} onClick={advance}>{photo ? 'Continue →' : 'Skip for now'}</button>
          </>
        )}

        {step === 'aadhaar' && (
          <>
            <h1 style={{ fontSize: 26 }}>Aadhaar verification</h1>
            <div className="authsub">Government ID confirms you&apos;re a real, single, accountable broker.</div>
            <label className="field" style={{ color: 'rgba(255,255,255,.5)' }}>Aadhaar number</label>
            <input className="in tnum" value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/[^\d]/g, '').slice(0, 12))} placeholder="1234 5678 9012" inputMode="numeric" />
            <div className="authfoot" style={{ marginTop: 10 }}>🔒 We never store your full Aadhaar — only a verification token + last 4 digits.</div>
            <button className="btn-cta" style={{ marginTop: 16 }} disabled={!aadhaarOk} onClick={advance}>Send Aadhaar OTP →</button>
          </>
        )}

        {step === 'face' && (
          <>
            <h1 style={{ fontSize: 26 }}>Face verification</h1>
            <div className="authsub">A quick liveness check matches your face to your Aadhaar photo.</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, margin: '18px 0' }}>
              <div style={{ position: 'relative', width: 150, height: 150, borderRadius: '50%', border: `3px solid ${faceDone ? 'var(--brand)' : 'var(--gold)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, background: 'rgba(255,255,255,.05)', transition: 'border-color .3s' }}>
                {faceDone ? '✅' : '🙂'}
                {!faceDone && (
                  <div style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '3px solid transparent', borderTopColor: 'var(--gold)', animation: 'spin 1s linear infinite' }} />
                )}
              </div>
              <div style={{ color: faceDone ? 'var(--gold)' : 'rgba(255,255,255,.6)', fontWeight: 600 }}>
                {faceDone ? 'Face matched ✓' : 'Scanning… hold still'}
              </div>
            </div>
            <button className="btn-cta" disabled={!faceDone} onClick={advance}>{faceDone ? 'Finish verification →' : 'Verifying…'}</button>
          </>
        )}

        {step === 'done' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 40 }}>🎉</div>
              <h1 style={{ fontSize: 26 }}>You&apos;re a <em>verified broker</em></h1>
            </div>
            {/* Verified broker card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', color: 'var(--ink)', marginTop: 6 }}>
              <div style={{ height: 64, background: 'linear-gradient(135deg,var(--brand),var(--brandD))' }} />
              <div style={{ padding: '0 18px 18px', marginTop: -40 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #fff', background: photo ? `center/cover url(${photo})` : 'linear-gradient(135deg,#1A7A4E,#0B6B3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 26, fontWeight: 800 }}>
                  {!photo && (name || 'B').split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10 }}>
                  <b style={{ fontSize: 19 }}>{name || 'Broker'}</b>
                  <BlueTick />
                </div>
                <div className="sm muted">{agency || 'Independent broker'} · Bengaluru</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <span className="pill" style={{ background: 'var(--brandSoft)', color: 'var(--brand)' }}>✓ Phone</span>
                  {rera && <span className="pill" style={{ background: 'var(--brandSoft)', color: 'var(--brand)' }}>✓ RERA</span>}
                  <span className="pill" style={{ background: 'var(--brandSoft)', color: 'var(--brand)' }}>✓ Aadhaar</span>
                  <span className="pill" style={{ background: 'var(--brandSoft)', color: 'var(--brand)' }}>✓ Face</span>
                  <span className="pill" style={{ background: 'var(--goldSoft)', color: 'var(--gold)' }}>★ Brokly Score 78</span>
                </div>
                <div className="card" style={{ padding: 12, marginTop: 14, background: 'var(--waSoft)', borderColor: '#CDE9D6', boxShadow: 'none' }}>
                  <div className="sm" style={{ color: 'var(--wa)', fontWeight: 700 }}>💬 We just messaged you on WhatsApp</div>
                  <div className="tiny muted" style={{ marginTop: 2 }}>Reply there to create your first listing, or use the app.</div>
                </div>
              </div>
            </div>
            <button className="btn-cta" style={{ marginTop: 16 }} onClick={finish}>Enter Brokly →</button>
          </>
        )}
      </div>
    </div>
  );
}
