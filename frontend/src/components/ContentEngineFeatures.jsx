export default function ContentEngineFeatures() {
  return (
    <section style={{
      background: '#0f0f1a',
      padding: '80px 24px',
      borderTop: '1px solid rgba(255,255,255,.05)',
      borderBottom: '1px solid rgba(255,255,255,.05)'
    }}>
      <div style={{maxWidth:960,margin:'0 auto'}}>
        <h2 style={{fontSize:28,fontWeight:700,color:'#fff',textAlign:'center',marginBottom:8}}>
          One listing input. Everything else auto-generated.
        </h2>
        <p style={{color:'#888',fontSize:15,textAlign:'center',marginBottom:48,maxWidth:600,margin:'0 auto 48px'}}>
          Stop juggling 5 tools. Type your listing once — get compliant copy, social content, market reports, and fillable contracts.
        </p>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20}}>
          {[
            {
              icon: '🎬',
              title: 'Reel Scripts',
              desc: '15-second hook→middle→close scripts with shot-by-shot breakdowns. Every listing becomes content instantly.',
              files: 'reel-script.txt'
            },
            {
              icon: '📸',
              title: 'Instagram & Facebook Captions',
              desc: 'Platform-optimized posts with hashtags. One click, ready to paste.',
              files: 'instagram-caption.txt · facebook-post.txt'
            },
            {
              icon: '📋',
              title: '6-Slide Carousels',
              desc: 'Full carousel outlines — cover, location, light, updates, outdoor, CTA. Tell a story, not just a listing.',
              files: 'carousel.txt'
            },
            {
              icon: '📅',
              title: '7-Day Content Calendar',
              desc: 'Mon-Sun plan with platform-specific hooks. Reel on Monday, carousel on Tuesday, market insight on Thursday.',
              files: 'weekly-calendar.md'
            },
            {
              icon: '📊',
              title: 'Market Reports',
              desc: 'Local pricing insight + buyer mood + trending neighborhoods. Sourced from Google Maps data.',
              files: 'market-report-post.txt'
            },
            {
              icon: '🎨',
              title: 'Canva Template Links',
              desc: 'Clickable links to pre-made Canva templates for every post type. Edit and download with your branding.',
              files: 'canva-templates.json'
            },
          ].map((item, i) => (
            <div key={i} style={{
              background:'#1a1a2e',
              borderRadius:12,
              padding:24,
              border:'1px solid #2a2a4a',
              transition:'.2s'
            }}>
              <div style={{fontSize:32,marginBottom:8}}>{item.icon}</div>
              <h3 style={{color:'#fff',fontSize:16,marginBottom:6}}>{item.title}</h3>
              <p style={{color:'#888',fontSize:13,lineHeight:1.6,marginBottom:8}}>{item.desc}</p>
              <code style={{fontSize:11,color:'#555'}}>{item.files}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
