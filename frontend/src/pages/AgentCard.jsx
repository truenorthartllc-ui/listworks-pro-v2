import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Phone, Mail, Home, MapPin, ExternalLink } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AgentCard() {
  const { cardId } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cardId) return;
    axios.get(`${API}/qr/agent-card/${cardId}`)
      .then(r => { setCard(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [cardId]);

  if (loading) return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center"><div className="text-amber-400 text-xl animate-pulse">Loading...</div></div>;

  if (!card) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-3xl p-8 text-center">
        <h1 className="text-xl text-white font-bold">Agent not found</h1>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-3xl p-8 max-w-sm w-full border border-amber-900/30">
        <div className="text-center mb-6">
          {card.photo_url ? (
            <img src={card.photo_url} alt={card.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-amber-500/30" />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-amber-500/20 flex items-center justify-center border-2 border-amber-500/30">
              <span className="text-3xl text-amber-400 font-bold">{card.name?.[0] || "?"}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">{card.name}</h1>
          <p className="text-amber-400">{card.title}</p>
          {card.brokerage && <p className="text-zinc-400 text-sm mt-1">{card.brokerage}</p>}
        </div>

        {card.bio && <p className="text-zinc-300 text-sm text-center mb-6">{card.bio}</p>}

        <div className="space-y-3">
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex items-center gap-3 bg-zinc-800 rounded-xl p-4 text-white hover:bg-zinc-700 transition-colors">
              <Phone className="w-5 h-5 text-amber-400" />
              <span className="text-sm">{card.phone}</span>
            </a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`} className="flex items-center gap-3 bg-zinc-800 rounded-xl p-4 text-white hover:bg-zinc-700 transition-colors">
              <Mail className="w-5 h-5 text-amber-400" />
              <span className="text-sm">{card.email}</span>
            </a>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
          <Link to="/" className="text-zinc-500 text-xs hover:text-amber-400/70 transition-colors">
            Powered by ListWorks PRO
          </Link>
        </div>
      </div>
    </div>
  );
}
