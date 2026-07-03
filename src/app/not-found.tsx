import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="auth">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-mark" style={{ margin: '0 auto' }}>
          b
        </div>
        <h1 style={{ fontSize: 26 }}>Link not found</h1>
        <div className="authsub">This Brokly link has expired or never existed.</div>
        <Link className="btn-cta" href="/" style={{ display: 'inline-block', textAlign: 'center' }}>
          Go to Brokly →
        </Link>
      </div>
    </div>
  );
}
