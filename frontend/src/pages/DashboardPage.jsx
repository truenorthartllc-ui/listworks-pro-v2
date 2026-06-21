export default function DashboardPage() {
  return (
    <div style={{width:'100%',height:'100vh',border:0}}>
      <iframe
        src="/api/dashboard"
        style={{width:'100%',height:'100vh',border:'none'}}
        title="Dashboard"
      />
    </div>
  );
}
