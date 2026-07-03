'use client';

import { useRef, useState } from 'react';

export function Auth({ onDone }: { onDone: (phone: string) => void }) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const boxes = useRef<Array<HTMLInputElement | null>>([]);

  const phoneOk = phone.replace(/\D/g, '').length >= 10;
  const otpOk = otp.every((d) => d !== '');

  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = d;
    setOtp(next);
    if (d && i < 3) boxes.current[i + 1]?.focus();
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-mark">b</div>

        {step === 'phone' ? (
          <>
            <h1>
              Run your whole
              <br />
              brokerage from
              <br />
              <em>one app.</em>
            </h1>
            <div className="authsub">Enter your WhatsApp number to get started. Free for your first 6 months.</div>
            <label className="field" style={{ color: 'rgba(255,255,255,.5)' }}>
              Your number
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div
                className="in"
                style={{ width: 74, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
              >
                🇮🇳 +91
              </div>
              <input
                className="in"
                inputMode="numeric"
                placeholder="98765 43210"
                value={phone}
                maxLength={11}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && phoneOk) setStep('otp');
                }}
              />
            </div>
            <button className="btn-cta" style={{ marginTop: 16 }} disabled={!phoneOk} onClick={() => setStep('otp')}>
              Send OTP →
            </button>
            <div className="authfoot">
              By continuing you agree to Brokly&apos;s
              <br />
              Terms &amp; Privacy Policy
            </div>
          </>
        ) : (
          <>
            <h1>
              Verify your
              <br />
              number
            </h1>
            <div className="authsub">
              We sent a 4-digit code to <b style={{ color: '#fff' }}>+91 {phone || '98765 43210'}</b>
            </div>
            <div className="otp-row">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    boxes.current[i] = el;
                  }}
                  className="otp-box"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otp[i] && i > 0) boxes.current[i - 1]?.focus();
                    if (e.key === 'Enter' && otpOk) onDone('+91 ' + phone);
                  }}
                />
              ))}
            </div>
            <button className="btn-cta" disabled={!otpOk} onClick={() => onDone('+91 ' + phone)}>
              Verify →
            </button>
            <div className="authfoot">
              Didn&apos;t get it? Resend in 0:24
              <br />
              <span style={{ color: 'var(--gold)' }}>💡 Demo: type any 4 digits</span>
            </div>
            <button
              className="btn"
              style={{ marginTop: 14, width: '100%', background: 'transparent', color: 'rgba(255,255,255,.6)', borderColor: 'rgba(255,255,255,.15)' }}
              onClick={() => setStep('phone')}
            >
              ← Change number
            </button>
          </>
        )}
      </div>
    </div>
  );
}
