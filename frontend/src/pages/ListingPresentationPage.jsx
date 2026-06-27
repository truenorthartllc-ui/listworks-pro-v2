import React from 'react';
import { Link } from 'react-router-dom';

export default function ListingPresentationPage() {
  return (
    <div className="min-h-screen" style={{ background: '#2a2520', color: '#f5f3ee' }}>
      {/* HEADER */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(42,37,32,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(198,169,97,0.1)' }}>
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between" style={{ height: 56 }}>
          <Link to="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#C6A961', textDecoration: 'none' }}>
            ListWorks<span style={{ color: '#f5f3ee' }}> PRO</span>
          </Link>
          <a href="https://buy.stripe.com/4gw8zFeYi72cdBm8wx" style={{ background: '#C6A961', color: '#0d0d0d', textDecoration: 'none', fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '6px', fontFamily: 'Inter, sans-serif' }}>
            Buy for $27 →
          </a>
        </div>
      </header>

      <iframe
        src="/listing-presentation.html"
        style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, width: '100%', height: 'calc(100vh - 56px)', border: 'none' }}
        title="Listing Presentation"
      />
    </div>
  );
}
