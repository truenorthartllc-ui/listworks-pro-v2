import { useState, useEffect } from 'react';

const API = process.env.REACT_APP_BACKEND_URL || '';

function apiUrl(path) {
  return API + '/api' + path;
}

function authHeaders() {
  const t = localStorage.getItem('lw_token');
  return t ? { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export default function DashboardPage() {
  const [page, setPage] = useState('packs');
  const [token, setToken] = useState(localStorage.getItem('lw_token'));
  const [agent, setAgent] = useState(null);
  const [tier, setTier] = useState(null);
  const [packs, setPacks] = useState([]);
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLead, setPreviewLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authErr, setAuthErr] = useState('');
  const [brMsg, setBrMsg] = useState('');
  const [account, setAccount] = useState(null);

  useEffect(() => { if (token) { fetchAgent(); fetchPacks(); fetchForms(); fetchAccount(); } }, [token]);

  // Check if returning from Stripe checkout
  useEffect(() => {
    if (token && window.location.search.includes('upgrade=success')) {
      fetch(apiUrl('/account/upgrade'), { method: 'POST', headers: authHeaders() }).then(() => {
        fetchAccount();
        window.history.replaceState({}, '', window.location.pathname);
      });
    }
  }, [token]);

  async function fetchAgent() {
    try {
      const r = await fetch(apiUrl('/auth/me'), { headers: authHeaders() });
      if (!r.ok) { setToken(null); localStorage.removeItem('lw_token'); return; }
      const d = await r.json();
      setAgent(d.agent);
    } catch {}
  }

  async function fetchAccount() {
    try {
      const r = await fetch(apiUrl('/account/status'), { headers: authHeaders() });
      if (r.ok) setAccount(await r.json());
    } catch {}
  }

  async function fetchPacks() {
    try {
      const r = await fetch(apiUrl('/content/packs'), { headers: authHeaders() });
      if (r.ok) setPacks((await r.json()).packs || []);
    } catch {}
    setLoading(false);
  }

  async function fetchForms() {
    try {
      const r = await fetch(apiUrl('/forms'), { headers: authHeaders() });
      if (r.ok) setForms((await r.json()).forms || []);
    } catch {}
  }

  // Auth
  async function handleAuth(e) {
    e.preventDefault();
    setAuthErr('');
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    try {
      const r = await fetch(apiUrl(authMode === 'login' ? '/auth/login' : '/auth/signup'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const d = await r.json();
      if (!r.ok) { setAuthErr(d.detail || 'Failed'); return; }
      setToken(d.token); localStorage.setItem('lw_token', d.token);
      setAgent(d.agent);
    } catch (e) { setAuthErr(e.message); }
  }

  function logout() { setToken(null); localStorage.removeItem('lw_token'); setAgent(null); setPacks([]); setForms([]); }

  // Preview content
  async function preview(leadId, file) {
    if (previewLead === leadId && previewFile === file) { setPreviewLead(null); setPreviewFile(null); return; }
    setPreviewLead(leadId); setPreviewFile(file);
  }

  async function loadFormDetail(formId) {
    try {
      setLoading(true);
      const r = await fetch(apiUrl('/forms/' + formId), { headers: authHeaders() });
      setSelectedForm(await r.json());
      setFormValues({});
      setLoading(false);
    } catch {}
  }

  async function downloadPdf(formId) {
    const brand = agent?.branding || {};
    try {
      const r = await fetch(apiUrl('/forms/' + formId + '/pdf'), {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ values: formValues, brand })
      });
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = formId + '.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Download failed'); }
  }

  async function generateContent(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    setLoading(true);
    try {
      await fetch(apiUrl('/content/generate'), { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
      fetchPacks();
    } catch {}
    setLoading(false);
  }

  async function upgrade() {
    try {
      const r = await fetch(apiUrl('/account/create-checkout'), { method: 'POST', headers: authHeaders() });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
    } catch {}
  }

  async function saveBranding(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    try {
      const r = await fetch(apiUrl('/auth/branding'), { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
      if (r.ok) { setBrMsg('✅ Saved'); setAgent(a => ({ ...a, branding: body })); } else setBrMsg('❌ Failed');
    } catch { setBrMsg('❌ Failed'); }
  }

  if (!token) {
    const s = { maxWidth: 400, margin: '60px auto', padding: 24 };
    return (
      <div style={{ ...s, background: '#0A0A0A', minHeight: '100vh', borderLeft: '6px solid #FF3B22' }}>
        <h1 style={{ fontSize: 24, color: '#F4F3EF', textAlign: 'center', marginBottom: 24, letterSpacing: '0.03em' }}>Agent Dashboard</h1>
        {authErr && <p style={{ color: '#FF3B22', fontSize: 13, marginBottom: 8 }}>{authErr}</p>}
        <form onSubmit={handleAuth}>
          {authMode === 'signup' && <>
            <Field label="Name" name="name" />
            <Field label="Brokerage" name="brokerage" />
          </>}
          <Field label="Email" name="email" type="email" />
          <Field label="Password" name="password" type="password" />
          <button style={{ width: '100%', marginTop: 12, background: '#FF3B22', color: '#F4F3EF', border: 'none', padding: '10px 0', borderRadius: 0, cursor: 'pointer', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{authMode === 'login' ? 'Log In' : 'Create Account'}</button>
        </form>
        <p style={{ textAlign: 'center', color: '#D1CFC7', fontSize: 13, marginTop: 16 }}>
          {authMode === 'login' ? <>Don't have one? <a href="#" onClick={e => { e.preventDefault(); setAuthMode('signup'); setAuthErr(''); }} style={{ color: '#FF3B22' }}>Sign up</a></> : <>Already have one? <a href="#" onClick={e => { e.preventDefault(); setAuthMode('login'); setAuthErr(''); }} style={{ color: '#FF3B22' }}>Log in</a></>}
        </p>
      </div>
    );
  }

  const navItem = (id, label) => (
    <button onClick={() => { setPage(id); setSelectedForm(null); }}
      style={{ padding: '10px 20px', background: page === id ? '#FF3B22' : 'transparent', color: '#F4F3EF', border: 'none', borderRadius: 0, cursor: 'pointer', fontSize: 13, fontWeight: page === id ? 600 : 400 }}>
      {label}
    </button>
  );

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', color: '#F4F3EF', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ background: '#121212', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 8, borderBottom: '3px solid #FF3B22' }}>
        <span style={{ color: '#F4F3EF', fontWeight: 700, marginRight: 16, fontSize: 14, letterSpacing: '0.05em' }}>ListWorks <span style={{ color: '#FF3B22' }}>PRO</span></span>
        {navItem('packs', 'Content')}
        {navItem('forms', 'Contracts')}
        {navItem('generate', 'Generate')}
        {navItem('branding', 'Branding')}
        <a href="/social" style={{ padding: '10px 20px', background: '#121212', color: '#F4F3EF', border: '1px solid #333', borderRadius: 0, cursor: 'pointer', fontSize: 13, textDecoration: 'none' }}>Social</a>
        <div style={{ flex: 1 }} />
        {account?.tier !== 'pro' && (
          <a href="#" onClick={e => { e.preventDefault(); upgrade(); }}
            style={{ background: '#FF3B22', color: '#F4F3EF', padding: '6px 14px', borderRadius: 0, textDecoration: 'none', fontSize: 12, fontWeight: 600, marginRight: 8 }}>
            ⬆ Upgrade $29/mo
          </a>
        )}
        <span style={{ color: '#D1CFC7', fontSize: 12, cursor: 'pointer', padding: '8px' }} onClick={logout}>{agent?.name || 'Agent'} ⏻</span>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
        {account?.tier !== 'pro' && (
          <div style={{ background: '#1a1110', border: '1px solid #FF3B22', borderRadius: 0, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#FF6B4A' }}>🔒 Free tier — {account?.content_packs_used || 0}/{account?.content_packs_limit || 1} content packs used</span>
            <a href="#" onClick={e => { e.preventDefault(); upgrade(); }} style={{ background: '#FF3B22', color: '#F4F3EF', padding: '8px 16px', borderRadius: 0, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>⬆ Upgrade to Pro $29/mo</a>
          </div>
        )}
        {account?.tier !== 'pro' && (
          <div style={{ background: '#101812', border: '1px solid #2F6B3F', borderRadius: 0, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#7DE88A' }}>💰 Earn $29 per referral — share your affiliate link</span>
            <a href="/a" style={{ background: '#1F5A2A', color: '#F4F3EF', padding: '8px 16px', borderRadius: 0, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Get Affiliate Link →</a>
          </div>
        )}
        {page === 'packs' && <ContentPacks packs={packs} previewFile={previewFile} previewLead={previewLead} onPreview={preview} />}
        {page === 'forms' && !selectedForm && <FormsList forms={forms} onSelect={loadFormDetail} />}
        {page === 'forms' && selectedForm && <FormDetail form={selectedForm} values={formValues} setValues={setFormValues} onDownload={downloadPdf} onBack={() => setSelectedForm(null)} isPro={account?.tier === 'pro'} />}
        {page === 'generate' && <GenerateForm onGenerate={generateContent} loading={loading} isPro={account?.tier === 'pro'} />}
        {page === 'branding' && <BrandingForm agent={agent} onSave={saveBranding} msg={brMsg} setMsg={setBrMsg} />}
      </div>
    </div>
  );
}

function Field({ label, name, type = 'text' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#D1CFC7', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
      <input name={name} type={type} required style={{ width: '100%', padding: '8px 10px', background: '#121212', border: '1px solid #333', borderRadius: 0, color: '#F4F3EF', fontSize: 13 }} />
    </div>
  );
}

function ContentPacks({ packs, previewFile, previewLead, onPreview }) {
  return (
    <div>
        <h1 style={{ fontSize: 22, color: '#F4F3EF', marginBottom: 4, letterSpacing: '0.03em' }}>📦 Content Packs</h1>
      <p style={{ color: '#D1CFC7', fontSize: 13, marginBottom: 20 }}>{packs.length} packs</p>
      {packs.length === 0 && <p style={{ color: '#D1CFC7', textAlign: 'center', padding: 40 }}>No packs yet. Generate one to see it here.</p>}
      {packs.map(p => (
        <div key={p.leadId} style={{ background: '#171717', borderRadius: 0, padding: 20, marginBottom: 14, border: '1px solid #333' }}>
          <h2 style={{ fontSize: 16, color: '#F4F3EF', margin: 0 }}>{p.name}</h2>
          <div style={{ color: '#D1CFC7', fontSize: 12, margin: '4px 0 12px' }}>{p.city || ''} · {p.generatedAt ? new Date(p.generatedAt).toLocaleDateString() : ''}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['reel-script.txt','instagram-caption.txt','carousel.txt','weekly-calendar.md','market-report-post.txt'].map(f => (
              <button key={f} onClick={() => onPreview(p.leadId, f)} style={{ background: previewLead === p.leadId && previewFile === f ? '#FF3B22' : '#121212', color: '#D1CFC7', border: '1px solid #333', borderRadius: 0, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>{f}</button>
            ))}
          </div>
          {previewLead === p.leadId && previewFile && <PreviewContent leadId={p.leadId} file={previewFile} />}
        </div>
      ))}
    </div>
  );
}

function PreviewContent({ leadId, file }) {
  const [text, setText] = useState('Loading...');
  useEffect(() => {
    fetch(apiUrl('/content/' + leadId + '/' + file), { headers: authHeaders() }).then(r => r.text()).then(setText).catch(() => setText('Unavailable'));
  }, [leadId, file]);
  return <div style={{ background: '#121212', borderRadius: 0, padding: 16, marginTop: 10, whiteSpace: 'pre-wrap', fontSize: 12, color: '#D1CFC7', maxHeight: 300, overflowY: 'auto', border: '1px solid #2a2a2a' }}>{text}</div>;
}

function FormsList({ forms, onSelect }) {
  return (
    <div>
      <h1 style={{ fontSize: 22, color: '#F4F3EF', marginBottom: 4, letterSpacing: '0.03em' }}>📄 Contracts</h1>
      <p style={{ color: '#D1CFC7', fontSize: 13, marginBottom: 20 }}>Fillable forms with field-by-field explanations</p>
      {forms.map(f => (
        <div key={f.id} onClick={() => onSelect(f.id)} style={{ background: '#171717', borderRadius: 0, padding: 20, marginBottom: 14, border: '1px solid #333', cursor: 'pointer' }}>
          <h2 style={{ fontSize: 16, color: '#F4F3EF', margin: 0 }}>{f.name}</h2>
          <div style={{ color: '#D1CFC7', fontSize: 12, margin: '4px 0' }}>{f.sections?.reduce((a,s) => a + s.fields.length, 0)} fields · {f.category}</div>
          <p style={{ color: '#D1CFC7', fontSize: 13, margin: 0 }}>{f.description}</p>
        </div>
      ))}
    </div>
  );
}

function FormDetail({ form, values, setValues, onDownload, onBack, isPro }) {
  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#FF3B22', cursor: 'pointer', fontSize: 13, marginBottom: 12, display: 'block' }}>← Back to contracts</button>
      <h1 style={{ fontSize: 20, color: '#F4F3EF', marginBottom: 4 }}>{form.name}</h1>
      <p style={{ color: '#D1CFC7', fontSize: 13, marginBottom: 20 }}>{form.description}</p>
      {form.sections?.map(section => (
        <div key={section.title} style={{ marginBottom: 20 }}>
          <h3 style={{ color: '#FF3B22', fontSize: 13, margin: '0 0 8px', paddingBottom: 4, borderBottom: '2px solid #FF3B22' }}>{section.title}</h3>
          {section.fields.map(field => (
            <div key={field.id} style={{ marginBottom: 10, padding: '10px 14px', background: '#121212', borderRadius: 0, border: '1px solid #2a2a2a' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#F4F3EF', display: 'block', marginBottom: 2 }}>{field.label}{field.required && <span style={{ color: '#FF3B22' }}>*</span>}</label>
              <p style={{ fontSize: 11, color: '#D1CFC7', margin: '0 0 6px', lineHeight: 1.4 }}>{field.explanation}</p>
              {field.type === 'textarea' ? <textarea name={field.id} style={{ width: '100%', padding: 6, background: '#0A0A0A', border: '1px solid #333', borderRadius: 0, color: '#F4F3EF', fontSize: 12 }} /> :
               field.type === 'select' ? <select name={field.id} style={{ width: '100%', padding: 6, background: '#0A0A0A', border: '1px solid #333', borderRadius: 0, color: '#F4F3EF', fontSize: 12 }}>{field.options?.map(o => <option key={o}>{o}</option>)}</select> :
               <input name={field.id} type={field.type === 'currency' ? 'text' : field.type || 'text'} style={{ width: '100%', padding: 6, background: '#0A0A0A', border: '1px solid #333', borderRadius: 0, color: '#F4F3EF', fontSize: 12 }} />}
            </div>
          ))}
        </div>
      ))}
      {isPro ? (
        <button onClick={() => onDownload(form.id)} style={{ background: '#FF3B22', color: '#F4F3EF', border: 'none', padding: '10px 0', borderRadius: 0, cursor: 'pointer', fontSize: 14, fontWeight: 600, width: '100%' }}>📄 Download Branded PDF</button>
      ) : (
        <a href="#" onClick={e => { e.preventDefault(); upgrade(); }} style={{ background: '#FF3B22', color: '#F4F3EF', padding: '10px 0', borderRadius: 0, textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'block', textAlign: 'center' }}>⬆ Upgrade to Download PDF</a>
      )}
    </div>
  );
}

function GenerateForm({ onGenerate, loading, isPro }) {
  return (
    <div>
      <h1 style={{ fontSize: 22, color: '#F4F3EF', marginBottom: 4, letterSpacing: '0.03em' }}>⚡ Generate</h1>
      <p style={{ color: '#D1CFC7', fontSize: 13, marginBottom: 20 }}>One input → full content pack</p>
      {isPro ? (
        <form onSubmit={onGenerate} style={{ background: '#171717', borderRadius: 0, padding: 24, border: '1px solid #333' }}>
          <Field label="City" name="city" />
          <Field label="Price" name="price" />
          <Field label="Features (comma separated)" name="features" />
          <button style={{ width: '100%', marginTop: 8, background: '#FF3B22', color: '#F4F3EF', border: 'none', padding: '10px 0', borderRadius: 0, cursor: 'pointer', fontSize: 14, fontWeight: 600 }} disabled={loading}>{loading ? 'Generating...' : '🚀 Generate Full Pack'}</button>
        </form>
      ) : (
        <div style={{ background: '#171717', borderRadius: 0, padding: 24, border: '1px solid #333', textAlign: 'center' }}>
          <p style={{ color: '#D1CFC7', fontSize: 14, marginBottom: 16 }}>🔒 Free tier includes 1 content pack. Upgrade to generate unlimited.</p>
          <a href="#" onClick={e => { e.preventDefault(); upgrade(); }} style={{ background: '#FF3B22', color: '#F4F3EF', padding: '10px 24px', borderRadius: 0, textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'inline-block' }}>⬆ Upgrade to Pro $29/mo</a>
        </div>
      )}
    </div>
  );
}

function BrandingForm({ agent, onSave, msg, setMsg }) {
  const b = agent?.branding || {};
  return (
    <div>
      <h1 style={{ fontSize: 22, color: '#F4F3EF', marginBottom: 4, letterSpacing: '0.03em' }}>🎨 Branding</h1>
      <p style={{ color: '#D1CFC7', fontSize: 13, marginBottom: 20 }}>Appears on every contract PDF you download</p>
      <form onSubmit={onSave} style={{ background: '#171717', borderRadius: 0, padding: 24, border: '1px solid #333' }}>
        <Field label="Your Name" name="agent_name" />
        <Field label="Brokerage" name="brokerage" />
        <Field label="Logo URL" name="logo_url" />
        <Field label="Primary Color" name="primary_color" />
        <Field label="Accent Color" name="secondary_color" />
        <button className="btn-vermillion" style={{ width: '100%', marginTop: 8 }}>💾 Save Branding</button>
        {msg && <p style={{ color: msg.startsWith('✅') ? '#4caf50' : '#FF3B22', fontSize: 12, marginTop: 8 }}>{msg}</p>}
      </form>
    </div>
  );
}
