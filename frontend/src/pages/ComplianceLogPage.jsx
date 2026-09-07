import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useTranslation from "@/hooks/useTranslation";

const API = process.env.REACT_APP_BACKEND_URL || "";

export default function ComplianceLogPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Compliance Log | ListWorks";
    fetchLogs();
  }, []);

  const sessionId = localStorage.getItem("lw_session_id") || "";

  async function fetchLogs() {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/api/compliance/logs`, {
        params: { session_id: sessionId, limit: 100 },
      });
      setLogs(data.logs || []);
    } catch {
      setError("Failed to load compliance logs");
    } finally {
      setLoading(false);
    }
  }

  async function acknowledge(scanId) {
    try {
      await axios.post(`${API}/api/compliance/acknowledge/${scanId}`);
      setLogs(prev => prev.map(l => l.scan_id === scanId ? { ...l, agent_acknowledged: true, acknowledged_at: new Date().toISOString() } : l));
    } catch { /* noop */ }
  }

  function downloadPdf(scanId) {
    window.open(`${API}/api/compliance/pdf/${scanId}`, "_blank");
  }

  function gradeColor(grade) {
    if (grade === "A") return "text-green-600";
    if (grade === "F") return "text-vermillion";
    return "text-yellow-600";
  }

  function riskColor(risk) {
    if (risk === "CRITICAL") return "bg-red-100 text-red-800";
    if (risk === "HIGH") return "bg-orange-100 text-orange-800";
    if (risk === "MEDIUM") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  }

  return (
    <div className="min-h-screen bg-oat text-ink font-body">
      <header className="border-b border-ink/15 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl tracking-tight no-underline text-ink">
            ListWorks<span className="text-vermillion">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="font-mono text-xs uppercase tracking-[0.15em] text-ink/60 hover:text-ink">← Home</Link>
          </div>
        </div>
      </header>

      <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-12">
        <div className="flex items-baseline gap-6 mb-6">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">/ Compliance Log</span>
          <div className="flex-1 h-px bg-ink/10" />
          <span className="font-display italic text-lg text-ink shrink-0">Broker audit trail</span>
        </div>

        <div className="mb-8 bg-coal text-oat p-6 rounded-sm">
          <h2 className="font-display text-2xl tracking-tight">Fair Housing Scan History</h2>
          <p className="mt-2 font-body text-sm text-oat/70">
            Every listing scan is recorded automatically. Export any scan as a PDF for your E&O file. Acknowledge scans to mark them as reviewed.
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-vermillion border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.15em] text-ink/50">Loading compliance log…</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-vermillion font-body">{error}</p>
            <button onClick={fetchLogs} className="mt-4 font-mono text-xs uppercase tracking-[0.15em] underline">Retry</button>
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="text-center py-16 border border-ink/15">
            <p className="font-display text-2xl text-ink/30">No scans yet</p>
            <p className="mt-2 font-body text-sm text-ink/50">Run a Fair Housing scan on any listing — it will appear here automatically.</p>
            <Link to="/" className="mt-6 inline-block btn-vermillion px-6 py-3 font-heading text-xs uppercase tracking-[0.15em]">
              Scan a Listing →
            </Link>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ink/15">
                  <th className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">Date</th>
                  <th className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">Listing</th>
                  <th className="text-center py-3 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">Grade</th>
                  <th className="text-center py-3 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">Risk</th>
                  <th className="text-center py-3 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">Violations</th>
                  <th className="text-center py-3 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">Reviewed</th>
                  <th className="text-right py-3 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.scan_id} className="border-b border-ink/10 hover:bg-ink/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-ink/70 whitespace-nowrap">
                      {(log.scanned_at || "").slice(0, 10)}
                    </td>
                    <td className="py-3 px-4 max-w-[200px]">
                      <p className="font-body text-sm truncate">
                        {log.listing_text ? log.listing_text.slice(0, 80) + "…" : "—"}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono text-sm font-bold ${gradeColor(log.grade)}`}>
                        {log.grade || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {log.overall_risk && (
                        <span className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] rounded-sm ${riskColor(log.overall_risk)}`}>
                          {log.overall_risk}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-sm">
                      {log.violations ? log.violations.length : 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {log.agent_acknowledged ? (
                        <span className="text-green-600 font-mono text-xs">✓</span>
                      ) : (
                        <button
                          onClick={() => acknowledge(log.scan_id)}
                          className="font-mono text-[10px] uppercase tracking-[0.1em] underline text-ink/50 hover:text-ink"
                        >
                          Acknowledge
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => downloadPdf(log.scan_id)}
                          className="btn-ghost-ink font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-1.5"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 p-6 border border-ink/15 bg-white">
          <h3 className="font-display text-lg tracking-tight">About this log</h3>
          <p className="mt-2 font-body text-sm text-ink/60 leading-relaxed">
            Every Fair Housing scan is recorded with a timestamp, the listing text analyzed, and all violations found.
            Acknowledged scans are marked as reviewed for your E&O records. Export any scan as a PDF compliance certificate.
            Use this log to demonstrate proactive Fair Housing compliance to your broker or during an audit.
          </p>
        </div>
      </section>
    </div>
  );
}