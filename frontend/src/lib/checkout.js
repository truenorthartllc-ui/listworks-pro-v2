import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export async function startCheckout(packageId, sessionId) {
  try {
    const { data } = await axios.post(`${API}/checkout/session`, {
      package_id: packageId,
      origin_url: window.location.origin,
      session_id: sessionId || localStorage.getItem("lw_session_id"),
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
