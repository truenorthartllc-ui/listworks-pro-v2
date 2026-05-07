import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import LandingPage from "@/pages/LandingPage";

function App() {
  useEffect(() => {
    // Ensure session id
    if (!localStorage.getItem("lw_session_id")) {
      localStorage.setItem(
        "lw_session_id",
        "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
      );
    }
  }, []);

  return (
    <div className="App">
      <Toaster position="bottom-right" theme="light" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
