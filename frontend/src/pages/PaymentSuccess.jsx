import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, Loader2, Download, ArrowLeft } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 6;

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("polling"); // polling | paid | failed | timeout
  const [data, setData] = useState(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("failed");
      return;
    }
    const poll = async () => {
      try {
        const { data } = await axios.get(`${API}/checkout/status/${sessionId}`);
        setData(data);
        if (data.payment_status === "paid") {
          setStatus("paid");
          return;
        }
        if (data.status === "expired") {
          setStatus("failed");
          return;
        }
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_POLLS) {
          setStatus("timeout");
          return;
        }
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (e) {
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_POLLS) {
          setStatus("failed");
          return;
        }
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };
    poll();
    return () => clearTimeout(timerRef.current);
  }, [sessionId]);

  const isGuide = data?.package_kind === "guide";
  const isPro = data?.package_kind === "pro";

  return (
    <div className="min-h-screen bg-oat text-ink flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {(status === "polling") && (
          <div data-testid="payment-polling" className="text-center">
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-vermillion" />
            <h1 className="mt-6 font-display text-4xl">Confirming your payment…</h1>
            <p className="mt-3 font-body text-ink/70">Hang tight — this usually takes 2-5 seconds.</p>
          </div>
        )}

        {status === "paid" && (
          <div data-testid="payment-success" className="border border-ink/15 bg-white p-10 animate-rise">
            <CheckCircle2 className="w-12 h-12 text-vermillion" strokeWidth={1.5} />
            <h1 className="mt-6 font-display text-5xl tracking-tight leading-tight">
              <span className="font-light">Payment</span> <span className="italic">received.</span>
            </h1>
            {isGuide && (
              <div className="mt-6 space-y-4">
                <p className="font-body text-ink/80">
                  Your <strong>ListWorks Guide</strong> is unlocked. 85 pages of the framework — yours forever.
                </p>
                <a
                  data-testid="download-guide-btn"
                  href="/assets/listworks-guide.pdf"
                  download="ListWorks-Guide.pdf"
                  className="inline-flex items-center gap-2 bg-vermillion text-oat hover:bg-[#ff2a0e] px-6 py-3.5 font-heading text-sm uppercase tracking-[0.15em] transition hover:-translate-y-0.5"
                >
                  <Download className="w-4 h-4" /> Download the Guide PDF
                </a>
              </div>
            )}
            {isPro && (
              <div className="mt-6 space-y-3">
                <p className="font-body text-ink/80">
                  You're <strong>ListGenius Pro</strong>. Unlimited rewrites, watermark-free videos, AI Advisor — go crush listings.
                </p>
                <ul className="font-body text-ink/75 space-y-1.5">
                  <li>✦ Unlimited listing rewrites</li>
                  <li>✦ 9:16 Reels format unlocked</li>
                  <li>✦ Make-it-10/10 rewrite engine</li>
                  <li>✦ Receipt sent to your email</li>
                </ul>
              </div>
            )}
            <button
              onClick={() => navigate("/")}
              className="mt-8 btn-ghost-ink px-6 py-3 font-heading text-sm uppercase tracking-[0.15em] inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to ListWorks
            </button>
          </div>
        )}

        {status === "failed" && (
          <div data-testid="payment-failed" className="border border-ink/15 bg-white p-10">
            <h1 className="font-display text-4xl">Payment didn't go through.</h1>
            <p className="mt-3 font-body text-ink/70">No charge was made. Try again or contact hello@listworks.pro.</p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 btn-vermillion px-6 py-3 font-heading text-sm uppercase tracking-[0.15em]"
            >
              Back to Pricing
            </button>
          </div>
        )}

        {status === "timeout" && (
          <div data-testid="payment-timeout" className="border border-ink/15 bg-white p-10">
            <h1 className="font-display text-4xl">Still processing…</h1>
            <p className="mt-3 font-body text-ink/70">
              Your payment is going through but Stripe is taking longer than usual.
              Check your email — we'll send confirmation as soon as it clears.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 btn-ghost-ink px-6 py-3 font-heading text-sm uppercase tracking-[0.15em]"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
