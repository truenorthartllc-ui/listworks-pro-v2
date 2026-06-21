export default function ContractsShowcase() {
  return (
    <section style={{
      background: '#0a0a18',
      padding: '80px 24px',
      borderBottom: '1px solid rgba(255,255,255,.05)'
    }}>
      <div style={{maxWidth:960,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'center'}}>
          <div>
            <span style={{
              background:'rgba(214,59,30,.1)',
              color:'#d63b1e',
              padding:'4px 12px',
              borderRadius:4,
              fontSize:12,
              fontWeight:600
            }}>NEW</span>
            <h2 style={{fontSize:28,fontWeight:700,color:'#fff',margin:'12px 0 12px'}}>
              Contracts that explain themselves
            </h2>
            <p style={{color:'#888',fontSize:14,lineHeight:1.7,marginBottom:24}}>
              Every field in every contract has a plain-English explanation of what it means for the agent and client. No more guessing what "cooperating broker commission" means — it's explained right there.
            </p>
            <ul style={{listStyle:'none',padding:0,margin:'0 0 24px'}}>
              {[
                'Listing Agreement — 14 fields, every one explained',
                'Purchase Agreement — price, contingencies, closing, all broken down',
                'Seller Disclosure — roof, HVAC, water damage, legal obligations',
                'Lease Agreement — rent, deposit, pets, subletting, all covered',
                'Buyer Rep Agreement — compensation, term, territory',
              ].map((item, i) => (
                <li key={i} style={{padding:'8px 0',color:'#ccc',fontSize:13,borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                  📄 {item}
                </li>
              ))}
            </ul>
            <div style={{display:'flex',gap:12}}>
              <a href="/dashboard" style={{
                background:'#d63b1e',
                color:'#fff',
                padding:'12px 24px',
                borderRadius:8,
                textDecoration:'none',
                fontWeight:600,
                fontSize:14
              }}>Try It Free →</a>
              <span style={{color:'#555',fontSize:12,alignSelf:'center'}}>No credit card · Free rewrites included</span>
            </div>
          </div>
          <div style={{
            background:'#1a1a2e',
            borderRadius:12,
            padding:28,
            border:'1px solid #2a2a4a',
            fontFamily:'monospace',
            fontSize:12,
            lineHeight:1.8,
            color:'#888'
          }}>
            <div style={{color:'#d63b1e',fontWeight:700,marginBottom:12,fontSize:13}}>Listing Agreement Preview</div>
            <div style={{color:'#aaa'}}>Cooperating Broker Commission</div>
            <div style={{color:'#666',marginBottom:12}}>The portion offered to the buyer's brokerage. Must be clearly stated — affects buyer agent willingness to show.</div>
            <div style={{color:'#aaa'}}>Inspection Period</div>
            <div style={{color:'#666',marginBottom:12}}>Days buyer has to complete inspections. Typical: 10-17 days. Buyer can terminate or negotiate during this window.</div>
            <div style={{color:'#aaa'}}>Earnest Money Deposit</div>
            <div style={{color:'#666',marginBottom:12}}>Good-faith deposit held in escrow. Usually 1-3% of purchase price. Forfeited if buyer defaults without a contingency.</div>
            <div style={{color:'#aaa'}}>Loan Contingency</div>
            <div style={{color:'#666'}}>If YES, buyer can back out if financing falls through. Waived for cash offers or strong buyers.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
