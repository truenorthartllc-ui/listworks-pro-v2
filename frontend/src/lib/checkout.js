import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Read ref from URL on first load, persist in localStorage for 30 days.
// Called from App.js on mount.
export function captureRefFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = (params.get("ref") || "").trim().toLowerCase().slice(0, 64);
    if (!ref) return;
    const existing = localStorage.getItem("lw_ref");
    const stamp = parseInt(localStorage.getItem("lw_ref_at") || "0", 10);
    // Overwrite if no existing or older than 30 days
    if (!existing || Date.now() - stamp > 30 * 86400000) {
      localStorage.setItem("lw_ref", ref);
      localStorage.setItem("lw_ref_at", String(Date.now()));
      // Fire-and-forget click tracking
      axios.post(`${API}/ref-click`, { ref, path: window.location.pathname }).catch(() => {});
    }
  } catch {/* noop */}
}

export function getRef() {
  try {
    const ref = localStorage.getItem("lw_ref");
    const stamp = parseInt(localStorage.getItem("lw_ref_at") || "0", 10);
    // Expire 30 days after capture
    if (ref && Date.now() - stamp <= 30 * 86400000) return ref;
    return null;
  } catch { return null; }
}

export async function startCheckout(packageId, sessionId) {
  try {
    const { data } = await axios.post(`${API}/checkout/session`, {
      package_id: packageId,
      origin_url: window.location.origin,
      session_id: sessionId || localStorage.getItem("lw_session_id"),
      ref: getRef(),
    });
    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No checkout URL");
    }
  } catch (e) {
    console.error(e);
    toast.error(e?.response?.data?.detail || "Checkout failed. Try again.");
  }
}

export async function getEntitlements(sessionId) {
  try {
    const { data } = await axios.get(
      `${API}/entitlements/${sessionId || localStorage.getItem("lw_session_id")}`
    );
    return data;
  } catch {
    return { entitlements: [], is_pro: false, has_guide: false };
  }
}
