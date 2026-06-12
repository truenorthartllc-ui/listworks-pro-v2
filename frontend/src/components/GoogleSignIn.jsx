import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { toast } from "sonner";
import { LogIn, LogOut, ChevronDown } from "lucide-react";
import { signInWithGoogle, getStoredUser, signOut } from "@/lib/auth";

export default function GoogleSignIn({ onAuthChange }) {
  const [user, setUser] = useState(getStoredUser);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (onAuthChange) onAuthChange(user);
  }, [user]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Exchange access token for ID token via Google userinfo
        const { data: profile } = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        // Build a minimal user object from the userinfo response
        const userData = {
          signed_in: true,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          google_id: profile.sub,
        };
        // Link session on the backend
        const session_id = localStorage.getItem("lw_session_id");
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google`, {
          id_token: tokenResponse.access_token,
          session_id,
        }).catch(() => {}); // Best-effort — user is still signed in locally

        localStorage.setItem("lw_user", JSON.stringify(userData));
        setUser(userData);
        toast.success(`Signed in as ${userData.name?.split(" ")[0] || userData.email}`);
      } catch (e) {
        toast.error("Sign-in failed. Try again.");
      }
    },
    onError: () => toast.error("Google sign-in cancelled."),
    flow: "implicit",
  });

  const handleSignOut = () => {
    signOut();
    setUser(null);
    setMenuOpen(false);
    toast.success("Signed out.");
  };

  if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) return null;

  if (!user) {
    return (
      <button
        onClick={() => login()}
        className="flex items-center gap-2 border border-ink/20 px-3 py-1.5 font-heading text-[10px] uppercase tracking-[0.12em] hover:border-ink hover:bg-ink hover:text-oat transition"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 border border-ink/20 px-2 py-1.5 hover:border-ink transition"
      >
        {user.picture ? (
          <img src={user.picture} alt="" className="w-5 h-5 rounded-full" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-vermillion flex items-center justify-center text-oat text-[9px] font-bold">
            {(user.name || user.email || "?")[0].toUpperCase()}
          </div>
        )}
        <span className="font-heading text-[10px] uppercase tracking-[0.12em] max-w-[100px] truncate">
          {user.name?.split(" ")[0] || user.email}
        </span>
        <ChevronDown className="w-3 h-3 text-ink/50" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 bg-oat border border-ink/15 shadow-lg w-48 z-50">
          <div className="px-4 py-3 border-b border-ink/10">
            <p className="font-heading text-[10px] uppercase tracking-[0.1em] text-ink/60 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-3 font-heading text-[10px] uppercase tracking-[0.12em] text-ink/70 hover:text-vermillion hover:bg-ink/5 transition"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
