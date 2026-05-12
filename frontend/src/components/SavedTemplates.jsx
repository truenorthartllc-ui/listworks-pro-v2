import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Bookmark, Plus, Trash2, Star } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SavedTemplates({ onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTone, setNewTone] = useState("Modern");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const session_id = localStorage.getItem("lw_session_id");
    if (!session_id) return;
    try {
      const { data } = await axios.get(`${API}/templates/${session_id}`);
      setTemplates(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const saveTemplate = async () => {
    if (!newName.trim()) {
      toast.error("Enter a template name");
      return;
    }
    const session_id = localStorage.getItem("lw_session_id");
    if (!session_id) return;
    setLoading(true);
    try {
      await axios.post(`${API}/templates/${session_id}`, {
        name: newName,
        tone: newTone,
        is_default: false,
      });
      setNewName("");
      setShowForm(false);
      loadTemplates();
      toast.success("Template saved");
    } catch (e) {
      toast.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id) => {
    const session_id = localStorage.getItem("lw_session_id");
    if (!session_id) return;
    try {
      await axios.delete(`${API}/templates/${session_id}/${id}`);
      loadTemplates();
      toast.success("Deleted");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const TONES = ["Luxury", "Cozy", "Modern", "Family", "Investor"];

  return (
    <div className="templates-panel mt-6 border-t border-ink/10 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4" />
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60">Saved Templates</span>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-vermillion hover:underline">
          <Plus className="w-3 h-3" />Save Current
        </button>
      </div>

      {showForm && (
        <div className="flex gap-2 mb-4 p-4 bg-oat border border-ink/10">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Template name..."
            className="editorial-input text-sm flex-1"
          />
          <select value={newTone} onChange={(e) => setNewTone(e.target.value)} className="editorial-input text-xs">
            {TONES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={saveTemplate} disabled={loading} className="btn-vermillion px-4 py-2 text-xs uppercase">
            Save
          </button>
        </div>
      )}

      {templates.length === 0 && !showForm && (
        <p className="text-ink/40 text-sm">No saved templates. Save your favorite tone settings.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <div key={t.id} className="flex items-center gap-2 bg-white border border-ink/10 px-3 py-2">
            <button onClick={() => onSelectTemplate(t.tone)} className="text-sm text-ink hover:text-vermillion">
              {t.name}
            </button>
            <span className="text-[10px] text-ink/40">{t.tone}</span>
            <button onClick={() => deleteTemplate(t.id)} className="text-ink/30 hover:text-vermillion">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}