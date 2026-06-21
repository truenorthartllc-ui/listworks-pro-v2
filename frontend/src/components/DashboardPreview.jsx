export default function DashboardPreview() {
  return (
    <section style={{
      background: 'linear-gradient(180deg,#0f0f1a 0%,#1a1a2e 100%)',
      padding: '80px 24px',
      textAlign: 'center'
    }}>
      <div style={{maxWidth:960,margin:'0 auto'}}>
        <h2 style={{fontSize:28,fontWeight:700,color:'#fff',marginBottom:8}}>
          Everything in one dashboard
        </h2>
        <p style={{color:'#888',fontSize:14,maxWidth:500,margin:'0 auto 40px'}}>
          Content packs, contracts, branding, and generator — all behind one login. Sign up in 10 seconds, start generating in 10 more.
        </p>
        <div style={{
          background:'#0f0f1a',
          borderRadius:16,
          border:'1px solid #2a2a4a',
          padding:'40px 32px',
          maxWidth:600,
          margin:'0 auto'
        }}>
          <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap',marginBottom:32}}>
            {['📦 Content Packs','📄 Contracts','🎨 Branding','⚡ Generator'].map(label => (
              <span key={label} style={{
                background:'rgba(255,255,255,.05)',
                padding:'8px 16px',
                borderRadius:6,
                color:'#ccc',
                fontSize:13,
                border:'1px solid rgba(255,255,255,.08)'
              }}>{label}</span>
            ))}
          </div>
          <a href="/dashboard" style={{
            background:'#d63b1e',
            color:'#fff',
            padding:'14px 32px',
            borderRadius:8,
            textDecoration:'none',
            fontWeight:600,
            fontSize:15,
            display:'inline-block'
          }}>Open Your Dashboard →</a>
          <p style={{color:'#555',fontSize:12,marginTop:12}}>Free account · First 3 rewrites included · No credit card</p>
        </div>
      </div>
    </section>
  );
}
