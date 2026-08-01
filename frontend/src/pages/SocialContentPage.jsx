import { useState, useEffect } from 'react';

const API = process.env.REACT_APP_BACKEND_URL || '';

function apiUrl(path) {
  return API + '/api' + path;
}

function authHeaders() {
  const t = localStorage.getItem('lw_token');
  return t ? { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => alert('Copied!')).catch(() => {});
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ padding: '8px 16px', background: active ? '#d63b1e' : '#1e1e3a', color: '#fff', border: '1px solid #4a4a6a', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400 }}>
      {children}
    </button>
  );
}

export default function SocialContentPage() {
  const [token] = useState(localStorage.getItem('lw_token'));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('instagram');
  const [form, setForm] = useState({
    address: '', city: '', state: 'CO', price: '', beds: '', baths: '', sqft: '',
    description: '', features: '', listing_url: '', agent_name: '', brokerage: ''
  });

  function updateField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await fetch(apiUrl('/social/content-engine'), {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!r.ok) { setError(d.detail || 'Generation failed'); setLoading(false); return; }
      setResult(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function Field({ label, name, type = 'text', placeholder = '', rows }) {
    const val = form[name] || '';
    return (
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#d0d0d0' }}>{label}</label>
        {rows ? (
          <textarea name={name} rows={rows} value={val} onChange={e => updateField(name, e.target.value)} placeholder={placeholder}
            style={{ width: '100%', padding: '8px 10px', background: '#1e1e3a', border: '1px solid #4a4a6a', borderRadius: 4, color: '#fff', fontSize: 13, resize: 'vertical' }} />
        ) : (
          <input name={name} type={type} value={val} onChange={e => updateField(name, e.target.value)} placeholder={placeholder}
            style={{ width: '100%', padding: '8px 10px', background: '#1e1e3a', border: '1px solid #4a4a6a', borderRadius: 4, color: '#fff', fontSize: 13 }} />
        )}
      </div>
    );
  }

  const tabs = ['instagram', 'facebook', 'linkedin', 'twitter', 'email', 'seo', 'blog', 'calendar'];

  function renderContent() {
    if (!result) return null;
    switch (tab) {
      case 'instagram':
        return <Block title="Instagram Caption" content={result.instagram_caption} />;
      case 'facebook':
        return <Block title="Facebook Post" content={result.facebook_post} />;
      case 'linkedin':
        return <Block title="LinkedIn Post" content={result.linkedin_post} />;
      case 'twitter':
        return <TwitterThread tweets={result.twitter_thread} />;
      case 'email':
        return <EmailPreview email={result.email_newsletter} />;
      case 'seo':
        return (
          <div>
            <Block title="SEO Title" content={result.seo_title} />
            <Block title="Meta Description" content={result.seo_meta_description} />
            {result.listing_url && (
              <p style={{ color: '#aaa', fontSize: 12, marginTop: 12 }}>
                Page URL: <a href={result.listing_url} target="_blank" rel="noreferrer" style={{ color: '#d63b1e' }}>{result.listing_url}</a>
              </p>
            )}
          </div>
        );
      case 'blog':
        return <Block title="Blog Post Intro" content={result.blog_post_intro} />;
      case 'calendar': {
        const cal = result.posting_calendar;
        if (!Array.isArray(cal)) return <p style={{ color: '#888' }}>No calendar generated.</p>;
        return (
          <div>
            <h3 style={{ color: '#fff', fontSize: 16, marginBottom: 16 }}>30-Day Posting Calendar</h3>
            {cal.slice(0, 14).map((item, i) => (
              <div key={i} style={{ background: '#1e1e3a', borderRadius: 6, padding: '10px 14px', marginBottom: 8, borderLeft: '3px solid #d63b1e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#d63b1e', fontSize: 11, fontWeight: 600 }}>Day {item.day || i + 1}</span>
                  <span style={{ color: '#888', fontSize: 11 }}>{item.platform || 'Social'}</span>
                </div>
                <p style={{ color: '#ccc', fontSize: 12, margin: 0 }}>{item.content_preview || ''}</p>
              </div>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  }

  if (!token) {
    return (
      <div style={{ background: '#1a1a2e', minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 16 }}>🔒 Log in at the <a href="/dashboard" style={{ color: '#d63b1e' }}>Dashboard</a> first.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#1a1a2e', minHeight: '100vh', color: '#f0f0f0', padding: 24, fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, color: '#fff', marginBottom: 4 }}>Social Content Engine</h1>
        <p style={{ color: '#aaa', fontSize: 13, marginBottom: 24 }}>
          One listing description → Instagram, Facebook, LinkedIn, Twitter, email, SEO, blog, and a 30-day posting calendar.
        </p>

        <form onSubmit={handleGenerate} style={{ background: '#252540', borderRadius: 10, padding: 24, border: '1px solid #3a3a5a', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Address" name="address" placeholder="123 Main St" />
            <Field label="City" name="city" placeholder="Denver" />
            <Field label="State" name="state" placeholder="CO" />
            <Field label="Price" name="price" placeholder="$525,000" />
            <Field label="Beds" name="beds" placeholder="3" />
            <Field label="Baths" name="baths" placeholder="2" />
            <Field label="Sq Ft" name="sqft" placeholder="1,850" />
            <Field label="Agent Name" name="agent_name" placeholder="Jane Smith" />
            <Field label="Brokerage" name="brokerage" placeholder="Keller Williams" />
            <Field label="Listing URL" name="listing_url" placeholder="https://..." />
          </div>
          <Field label="Key Features (comma separated)" name="features" placeholder="updated kitchen, hardwood floors, mountain views, new roof 2024" />
          <Field label="Listing Description" name="description" rows={5} placeholder="Paste the full MLS description here..." />
          <button style={{ width: '100%', marginTop: 12, background: '#d63b1e', color: '#fff', border: 'none', padding: '12px 0', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }} disabled={loading}>
            {loading ? '⚡ Generating...' : '🚀 Generate Content Package'}
          </button>
          {error && <p style={{ color: '#ff4444', fontSize: 12, marginTop: 8 }}>{error}</p>}
        </form>

        {result && (
          <div style={{ background: '#252540', borderRadius: 10, padding: 24, border: '1px solid #3a3a5a' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {tabs.map(t => (
                <TabButton key={t} active={tab === t} onClick={() => setTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </TabButton>
              ))}
            </div>
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
}

function Block({ title, content }) {
  if (!content) return null;
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ color: '#fff', fontSize: 15, margin: 0 }}>{title}</h3>
        <button onClick={() => copyText(text)}
          style={{ background: '#1e1e3a', color: '#aaa', border: '1px solid #4a4a6a', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}>Copy</button>
      </div>
      <div style={{ background: '#1a1a35', borderRadius: 6, padding: 16, whiteSpace: 'pre-wrap', fontSize: 13, color: '#d0d0d0', lineHeight: 1.6 }}>
        {text}
      </div>
    </div>
  );
}

function TwitterThread({ tweets }) {
  if (!Array.isArray(tweets)) return <p style={{ color: '#888' }}>No thread generated.</p>;
  return (
    <div>
      <h3 style={{ color: '#fff', fontSize: 15, marginBottom: 12 }}>Twitter/X Thread ({tweets.length} tweets)</h3>
      {tweets.map((t, i) => (
        <div key={i} style={{ background: '#1e1e3a', borderRadius: 6, padding: '12px 14px', marginBottom: 8, borderLeft: '3px solid #1da1f2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#1da1f2', fontSize: 11, fontWeight: 600 }}>Tweet {i + 1}/{tweets.length}</span>
            <span style={{ color: t.length > 280 ? '#ff4444' : '#888', fontSize: 11 }}>{t.length}/280</span>
          </div>
          <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>{t}</p>
        </div>
      ))}
    </div>
  );
}

function EmailPreview({ email }) {
  if (!email) return null;
  const text = typeof email === 'string' ? email : JSON.stringify(email, null, 2);
  return (
    <div>
      <h3 style={{ color: '#fff', fontSize: 15, marginBottom: 8 }}>Newsletter Email</h3>
      <div style={{ background: '#1a1a35', borderRadius: 6, padding: 16, border: '1px solid #4a4a6a' }}>
        <div style={{ background: '#252540', borderRadius: 4, padding: 12, marginBottom: 8 }}>
          <p style={{ color: '#888', fontSize: 11, margin: '0 0 4px' }}>Subject:</p>
          <p style={{ color: '#fff', fontSize: 13, margin: 0 }}>{typeof email === 'object' ? email.subject || text.split('\n')[0] : text.split('\n')[0]}</p>
        </div>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#d0d0d0', lineHeight: 1.6 }}>{typeof email === 'object' ? email.body || text : text}</div>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => copyText(text)}
          style={{ background: '#1e1e3a', color: '#aaa', border: '1px solid #4a4a6a', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}>Copy All</button>
      </div>
    </div>
  );
}
