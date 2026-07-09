import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LandingPage from "@/pages/LandingPage";
import LandingPageV4 from "@/pages/LandingPageV4";
import PaymentSuccess from "@/pages/PaymentSuccess";
import COCompliancePage from "@/pages/COCompliancePage";
import ListingPresentationPage from "@/pages/ListingPresentationPage";
import PricingPage from "@/pages/PricingPage";
import SharedListing from "@/pages/SharedListing";
import AffiliateDashboard from "@/pages/AffiliateDashboard";
import AffiliateSignup from "@/pages/AffiliateSignup";
import Waitlist from "@/pages/Waitlist";
import OpenHouseCheckin from "@/pages/OpenHouseCheckin";
import ShowingFeedback from "@/pages/ShowingFeedback";
import AgentCard from "@/pages/AgentCard";
import AgentProfilePage from "@/pages/AgentProfilePage";
import Unsubscribe from "@/pages/Unsubscribe";
import ComparePage from "@/pages/ComparePage";
import VsPage from "@/pages/VsPage";
import BlogPage from "@/pages/BlogPage";
import BlogPost from "@/pages/BlogPost";
import CityPage from "@/pages/CityPage";
import ListingAnalyzerPage from "@/pages/ListingAnalyzerPage";
import PromptLibraryPage from "@/pages/PromptLibraryPage";
import DashboardPage from "@/pages/DashboardPage";
import PublicScan from "@/pages/PublicScan";
import { captureRefFromURL } from "@/lib/checkout";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

function App() {
  useEffect(() => {
    window.history.scrollRestoration = "manual";
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
          <Route path="/" element={<LandingPageV4 />} />
          <Route path="/old" element={<LandingPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/share/:id" element={<SharedListing />} />
          <Route path="/p/:id" element={<SharedListing />} />
          <Route path="/a/:ref" element={<AffiliateDashboard />} />
          <Route path="/affiliate/signup" element={<AffiliateSignup />} />
          <Route path="/affiliate/demo" element={<AffiliateSignup />} />
          <Route path="/openhouse/:eventId" element={<OpenHouseCheckin />} />
          <Route path="/show/:eventId" element={<ShowingFeedback />} />
          <Route path="/agent/:cardId" element={<AgentCard />} />
          <Route path="/a/:slug" element={<AgentProfilePage />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/scan" element={<PublicScan />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/vs/listingcopy" element={<VsPage competitor="listingcopy" />} />
          <Route path="/vs/listingai" element={<VsPage competitor="listingai" />} />
          <Route path="/vs/chatgpt" element={<VsPage competitor="chatgpt" />} />
          <Route path="/vs/jasper" element={<VsPage competitor="jasper" />} />
          <Route path="/vs/epique" element={<VsPage competitor="epique" />} />
          <Route path="/vs/writehomes" element={<VsPage competitor="writehomes" />} />
          <Route path="/vs/copyai" element={<VsPage competitor="copyai" />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/city/:city" element={<CityPage />} />
          <Route path="/listing-analyzer" element={<ListingAnalyzerPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/co-compliance" element={<COCompliancePage />} />
          <Route path="/prompt-library" element={<PromptLibraryPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/app/*" element={<DashboardPage />} />
          <Route path="/presentations" element={<ListingPresentationPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "placeholder"}>
      {inner}
    </GoogleOAuthProvider>
  );
}

export default App;
