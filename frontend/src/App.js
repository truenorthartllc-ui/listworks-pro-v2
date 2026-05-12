import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import LandingPage from "@/pages/LandingPage";
import PaymentSuccess from "@/pages/PaymentSuccess";
import SharedListing from "@/pages/SharedListing";
import AffiliateDashboard from "@/pages/AffiliateDashboard";
import AffiliateSignup from "@/pages/AffiliateSignup";
import Waitlist from "@/pages/Waitlist";
import OpenHouseCheckin from "@/pages/OpenHouseCheckin";
import { captureRefFromURL } from "@/lib/checkout";

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

  return (
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
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
