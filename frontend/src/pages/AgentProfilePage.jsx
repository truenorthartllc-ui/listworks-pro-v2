import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Home, Mail, Phone, MapPin, Linkedin, Instagram, Globe, ExternalLink, ArrowLeft, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AgentProfilePage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/agent/public/${slug}`);
        setProfile(data);
        setListings(data.listings || []);
      } catch {
        setError("Agent not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-oat flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-vermillion" />
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen bg-oat flex items-center justify-center">
      <div className="text-center">
        <Home className="w-12 h-12 text-ink/20 mx-auto mb-4" />
        <h1 className="font-heading text-xl uppercase tracking-[0.15em] mb-2">Agent Not Found</h1>
        <p className="font-body text-sm text-ink/60 mb-6">This agent hasn't set up their page yet.</p>
        <Link to="/" className="text-vermillion underline font-body text-sm">Back to ListWorks PRO</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-oat">
      {/* Hero */}
      <div className="bg-coal text-oat">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <Link to="/" className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase text-oat/50 hover:text-vermillion transition mb-8">
            <ArrowLeft className="w-3 h-3" /> ListWorks PRO
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} className="w-24 h-24 md:w-32 md:h-32 object-cover border-2 border-oat/20" />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 bg-vermillion flex items-center justify-center">
                <span className="font-display italic text-3xl md:text-4xl text-oat">{profile.name?.[0]}</span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-display italic text-3xl md:text-5xl leading-tight">{profile.name}</h1>
              <p className="font-mono text-[13px] tracking-[0.15em] uppercase text-oat/70 mt-2">{profile.title}</p>
              {profile.brokerage && <p className="font-body text-sm text-oat/50 mt-1">{profile.brokerage}</p>}
              <div className="flex flex-wrap gap-3 mt-5">
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-2 border border-oat/30 hover:border-vermillion px-4 py-2 font-heading text-[10px] uppercase tracking-[0.12em] transition text-oat">
                    <Phone className="w-3 h-3" /> {profile.phone}
                  </a>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-2 border border-oat/30 hover:border-vermillion px-4 py-2 font-heading text-[10px] uppercase tracking-[0.12em] transition text-oat">
                    <Mail className="w-3 h-3" /> Email
                  </a>
                )}
                {profile.social_linkedin && (
                  <a href={profile.social_linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-oat/30 hover:border-vermillion px-4 py-2 font-heading text-[10px] uppercase tracking-[0.12em] transition text-oat">
                    <Linkedin className="w-3 h-3" /> LinkedIn
                  </a>
                )}
                {profile.social_instagram && (
                  <a href={profile.social_instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-oat/30 hover:border-vermillion px-4 py-2 font-heading text-[10px] uppercase tracking-[0.12em] transition text-oat">
                    <Instagram className="w-3 h-3" /> Instagram
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-oat/30 hover:border-vermillion px-4 py-2 font-heading text-[10px] uppercase tracking-[0.12em] transition text-oat">
                    <Globe className="w-3 h-3" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Bio */}
        {profile.bio && (
          <section className="mb-16">
            <h2 className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/40 mb-4">About</h2>
            <div className="font-body text-base text-ink/80 leading-relaxed whitespace-pre-wrap max-w-3xl">{profile.bio}</div>
          </section>
        )}

        {/* Specialties */}
        {profile.specialties && (
          <section className="mb-16">
            <h2 className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/40 mb-4">Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.split(",").map((s, i) => (
                <span key={i} className="border border-ink/15 px-3 py-1.5 font-body text-xs uppercase tracking-wider">{s.trim()}</span>
              ))}
            </div>
          </section>
        )}

        {/* Recent Listings */}
        {listings.length > 0 && (
          <section>
            <h2 className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/40 mb-6">Recent Listings</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <div key={listing._id || listing.id} className="border border-ink/15 bg-white p-5 hover:border-vermillion transition">
                  <div className="font-body text-sm text-ink/80 leading-relaxed line-clamp-4 mb-4">
                    {listing.mls?.slice(0, 200)}…
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40">
                      {listing.listing_strength ? `${listing.listing_strength}/10` : ""}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-vermillion">View →</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact CTA */}
        <section className="mt-16 border border-ink/15 p-8 md:p-12 text-center bg-white">
          <h2 className="font-display italic text-2xl md:text-3xl mb-3">Work With {profile.name?.split(" ")[0]}</h2>
          <p className="font-body text-sm text-ink/60 max-w-md mx-auto mb-6">
            {profile.brokerage ? `${profile.brokerage} — ` : ""}Contact for a free listing consultation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="btn-vermillion px-6 py-3 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Call {profile.name?.split(" ")[0]}
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}?subject=Listing%20Inquiry`} className="border border-ink/20 hover:border-vermillion px-6 py-3 font-heading text-xs uppercase tracking-[0.12em] transition flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Send Email
              </a>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-ink/10 py-8 text-center">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/30">
          Powered by <a href="https://listworks.pro" className="text-vermillion hover:underline">ListWorks PRO</a>
        </p>
      </footer>
    </div>
  );
}
