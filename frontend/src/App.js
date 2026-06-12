import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LandingPage from "@/pages/LandingPage";
import PaymentSuccess from "@/pages/PaymentSuccess";
import SharedListing from "@/pages/SharedListing";
import AffiliateDashboard from "@/pages/AffiliateDashboard";
import AffiliateSignup from "@/pages/AffiliateSignup";
import Waitlist from "@/pages/Waitlist";
import OpenHouseCheckin from "@/pages/OpenHouseCheckin";
import Unsubscribe from "@/pages/Unsubscribe";
import ComparePage from "@/pages/ComparePage";
import { captureRefFromURL } from "@/lib/checkout";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

function App() {
  useEffect(() => {
    if (!localStorage.getItem("lw_session_id")) {
      localStorage.setItem(
        "lw_session_id",
        "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
      );
    }
    captureRefFromURL();
  }, []);

  const inner = (
    <div className="App">
      <Toaster position="bottom-right" theme="light" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/share/:id" element={<SharedListing />} />
          <Route path="/a/:ref" element={<AffiliateDashboard />} />
          <Route path="/affiliate/signup" element={<AffiliateSignup />} />
          <Route path="/affiliate/demo" element={<AffiliateSignup />} />
          <Route path="/openhouse/:eventId" element={<OpenHouseCheckin />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );

  if (!GOOGLE_CLIENT_ID) return inner;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {inner}
    </GoogleOAuthProvider>
  );
}

export default App;
