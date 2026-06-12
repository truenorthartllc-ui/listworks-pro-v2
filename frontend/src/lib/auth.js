import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export async function signInWithGoogle(idToken) {
  const session_id = localStorage.getItem("lw_session_id");
  const { data } = await axios.post(`${API}/auth/google`, { id_token: idToken, session_id });
  localStorage.setItem("lw_user", JSON.stringify(data));
  return data;
}

export async function fetchMe() {
  const session_id = localStorage.getItem("lw_session_id");
  if (!session_id) return null;
  try {
    const { data } = await axios.get(`${API}/auth/me/${session_id}`);
    if (data.signed_in) {
      localStorage.setItem("lw_user", JSON.stringify(data));
      return data;
    }
  } catch {}
  return null;
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("lw_user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function signOut() {
  localStorage.removeItem("lw_user");
}
