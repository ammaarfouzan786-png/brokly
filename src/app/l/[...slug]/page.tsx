import Link from 'next/link';
import { getLink } from '@/lib/link-store';
import { BuyerPublic } from '@/components/BuyerPublic';

export const dynamic = 'force-dynamic';

export default async function SharedLinkPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const key = (slug || []).join('/');
  const data = await getLink(key);

  if (!data) {
    return (
      <div className="auth">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-mark" style={{ margin: '0 auto' }}>
            b
          </div>
          <h1 style={{ fontSize: 24 }}>Link not available</h1>
          <div className="authsub">
            This Brokly link hasn&apos;t been published on this server, or has expired. Ask your broker to re-share it.
          </div>
          <Link className="btn-cta" href="/" style={{ display: 'inline-block' }}>
            About Brokly →
          </Link>
        </div>
      </div>
    );
  }

  return <BuyerPublic data={data} />;
}
