import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Mail, Eye, MessageSquare, Calendar, TrendingUp, TrendingDown, Loader2,
  Bell, BellOff, RefreshCw, ExternalLink, BarChart3,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SAMPLE_REPORT = {
  period: "Last 7 days",
  views: 847,
  inquiries: 12,
  showings: 5,
  days_on_market: 14,
  price_per_sqft: "$287",
  dom_trend: "+2 days",
  comp_avg: "$285/sqft",
  report_text: `Hi Sarah — here's your weekly listing report for 418 Willowbrook Ln.

📊 TRAFFIC
• 847 views (↑ 23% vs last week)
• 12 buyer inquiries
• 5 showings scheduled

📅 MARKET CONTEXT
• 14 days on market (average for this neighborhood: 18)
• Comp average: $285/sqft — your listing is priced correctly at $287/sqft
• 3 new listings came on this week in your area

⚡ RECOMMENDED ACTION
One showing this week with strong buyer interest. Ask your agent about the feedback loop — consider a subtle price adjustment if no offer by day 21.

Questions? Your agent is one message away.`,
};

export default function SellerDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportPreview, setReportPreview] = useState(null);
  const [previewListing, setPreviewListing] = useState(null);

  const fetchListings = () => {
    const session_id = localStorage.getItem("lw_session_id");
    axios.get(`${API}/seller/listings?session_id=${session_id}`)
      .then(({ data }) => { setListings(data.listings || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, []);

  const toggleReport = async (listingId, enabled) => {
    try {
      await axios.post(`${API}/seller/report-toggle`, {
        listing_id: listingId,
        enabled,
        session_id: localStorage.getItem("lw_session_id"),
      });
      fetchListings();
      toast.success(enabled ? "Daily reports enabled" : "Reports paused");
    } catch {
      toast.error("Failed to update — try again");
    }
  };

  const previewReport = (listing) => {
    setPreviewListing(listing);
    setReportPreview({ ...SAMPLE_REPORT, address: listing.address });
  };

  const sendNow = async (listingId) => {
    try {
      await axios.post(`${API}/seller/report-send`, {
        listing_id: listingId,
        session_id: localStorage.getItem("lw_session_id"),
      });
      toast.success("Report sent to seller!");
    } catch {
      toast.error("Send failed — check email address");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-vermillion" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-coal flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-vermillion" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-display text-2xl">Seller Dashboard</h3>
          <p className="font-body text-ink/60 text-sm">Track your listings' performance. Send sellers automated weekly reports.</p>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="border border-ink/15 p-10 text-center">
          <p className="font-display italic text-2xl text-ink/50 mb-4">
            No listings yet to track.
          </p>
          <p className="font-body text-ink/60 text-sm">
            Generate a listing rewrite first, then come back here to set up seller reports.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((l) => (
            <div key={l.id} className="border border-ink/15 p-6 bg-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xl leading-tight">{l.address || "Your Listing"}</p>
                  <p className="font-mono text-[11px] text-ink/50 mt-1 uppercase tracking-widest">
                    {l.tone} · {new Date(l.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Eye className="w-3.5 h-3.5 text-ink/50" />
                      <span>{l.views || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MessageSquare className="w-3.5 h-3.5 text-ink/50" />
                      <span>{l.inquiries || 0} inquiries</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-ink/50" />
                      <span>{l.showings || 0} showings</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {l.report_enabled ? (
                      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-green-700 bg-green-50 px-2 py-1 border border-green-200">
                        <Bell className="w-3 h-3" /> Reports active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ink/40">
                        <BellOff className="w-3 h-3" /> No reports
                      </span>
                    )}
                    <button
                      onClick={() => toggleReport(l.id, !l.report_enabled)}
                      className="px-3 py-1.5 border border-ink/20 hover:border-vermillion font-heading text-[11px] uppercase tracking-[0.1em] transition"
                    >
                      {l.report_enabled ? "Pause" : "Enable"}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => previewReport(l)}
                      className="px-3 py-1.5 border border-ink/20 hover:border-ink font-heading text-[11px] uppercase tracking-[0.1em] transition"
                    >
                      Preview report
                    </button>
                    {l.report_enabled && (
                      <button
                        onClick={() => sendNow(l.id)}
                        className="px-3 py-1.5 bg-vermillion text-oat hover:bg-[#ff2a0e] font-heading text-[11px] uppercase tracking-[0.1em] transition"
                      >
                        <RefreshCw className="w-3 h-3 inline mr-1" />
                        Send now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Preview Modal */}
      {reportPreview && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setReportPreview(null)}
        >
          <div className="bg-white max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-ink/15 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-vermillion">Report Preview</p>
                <p className="font-display text-lg mt-1">{previewListing?.address || "Your Listing"}</p>
              </div>
              <button onClick={() => setReportPreview(null)} className="text-ink/40 hover:text-ink text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Views", value: reportPreview.views, icon: Eye },
                  { label: "Inquiries", value: reportPreview.inquiries, icon: MessageSquare },
                  { label: "Showings", value: reportPreview.showings, icon: Calendar },
                  { label: "DOM", value: reportPreview.days_on_market + "d", icon: TrendingUp },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-oat p-4 text-center">
                      <Icon className="w-4 h-4 mx-auto mb-2 text-ink/50" strokeWidth={1.5} />
                      <div className="font-display text-2xl">{s.value}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-ink/50 mt-1">{s.label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-coal text-oat p-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-oat/50 mb-3">Email preview</p>
                <div className="font-mono text-[12px] leading-[1.8] whitespace-pre-wrap text-oat/90">
                  {reportPreview.report_text}
                </div>
              </div>
              <p className="mt-4 font-body text-[11px] text-ink/50 text-center">
                Sent automatically every 7 days to the seller's email. Agent reviews before sending.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
