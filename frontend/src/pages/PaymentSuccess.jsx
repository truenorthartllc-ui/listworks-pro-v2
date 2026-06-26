import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, Clock, Loader2, Download, ArrowLeft, Mail } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 15;

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id");
  // "polling" | "paid" | "declined" | "processing"
  // NOTE: "processing" replaces both old "failed" and "timeout" states.
  // We only show "declined" when Stripe explicitly confirms unpaid + expired.
  const [status, setStatus] = useState("polling");
  const [data, setData] = useState(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!sessionId) {
      // No session ID in URL — something went wrong before Stripe even ran
      setStatus("processing");
      return;
    }
    const poll = async () => {
      try {
        const { data: d } = await axios.get(`${API}/checkout/status/${sessionId}`);
        setData(d);
        if (d.payment_status === "paid") {
          setStatus("paid");
          return;
        }
        // Only mark as truly declined when Stripe explicitly says expired + unpaid
        if (d.status === "expired" && d.payment_status === "unpaid") {
          setStatus("declined");
          return;
        }
        // Any other response (open, unknown, etc.) — keep polling
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_POLLS) {
          setStatus("processing");
          return;
        }
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        // Backend error / 500 / network issue — never assume payment failed
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_POLLS) {
          setStatus("processing");
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
  const isCredits = data?.package_kind === "credits";

  return (
    <div className="min-h-screen bg-oat text-ink flex items-center justify-center p-6">
      <div className="max-w-xl w-full">

        {/* Polling — confirming */}
        {status === "polling" && (
          <div data-testid="payment-polling" className="text-center">
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-vermillion" />
            <h1 className="mt-6 font-display text-4xl">Confirming your payment…</h1>
            <p className="mt-3 font-body text-ink/70">Hang tight — this usually takes 2–5 seconds.</p>
          </div>
        )}

        {/* Paid — confirmed */}
        {status === "paid" && (
          <div data-testid="payment-success" className="border border-ink/15 bg-white p-10 animate-rise">
            <CheckCircle2 className="w-12 h-12 text-green-500" strokeWidth={1.5} />
            <h1 className="mt-6 font-display text-5xl tracking-tight leading-tight">
              <span className="font-light">Payment</span> <span className="italic">received.</span>
            </h1>
            {isGuide && (
              <div className="mt-6 space-y-4">
                <p className="font-body text-ink/80">
                   Your <strong>ListWorks Guide</strong> is unlocked. 45 pages of the framework — yours forever.
                </p>
                <a
                  data-testid="download-guide-btn"
                  href="/assets/listworks-guide.pdf"
                  download="ListWorks-Guide.pdf"
                  className="inline-flex items-center gap-2 bg-vermillion text-oat hover:bg-[#ff2a0e] px-6 py-3.5 font-heading text-sm uppercase tracking-[0.15em] transition"
                >
                  <Download className="w-4 h-4" /> Download the Guide PDF
                </a>
              </div>
            )}
            {isPro && (
              <div className="mt-6 space-y-3">
                <p className="font-body text-ink/80">
                  You're <strong>ListWorks Pro</strong>. Unlimited rewrites, all tools unlocked.
                </p>
                <ul className="font-body text-ink/75 space-y-1.5">
                  <li>✦ Unlimited listing rewrites</li>
                  <li>✦ Fair Housing scan on every output</li>
                  <li>✦ All content types unlocked</li>
                  <li>✦ Receipt sent to your email</li>
                </ul>
              </div>
            )}
            {isCredits && (
              <div className="mt-6">
                <p className="font-body text-ink/80">
                  Your credits are loaded and ready. Head back and start rewriting.
                </p>
              </div>
            )}
            {!isGuide && !isPro && !isCredits && (
              <div className="mt-6">
                <p className="font-body text-ink/80">Your purchase is confirmed and active.</p>
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

        {/* Processing — we can't confirm yet, but don't say it failed */}
        {status === "processing" && (
          <div data-testid="payment-processing" className="border border-ink/15 bg-white p-10">
            <Clock className="w-12 h-12 text-vermillion" strokeWidth={1.5} />
            <h1 className="mt-6 font-display text-4xl leading-tight">
              Your payment is being processed.
            </h1>
            <p className="mt-4 font-body text-ink/70 leading-relaxed">
              This is taking a little longer than usual to confirm. <strong>If your card was charged, your access will activate automatically</strong> — you don't need to do anything.
            </p>
            <div className="mt-6 border border-ink/12 p-5 flex items-start gap-3">
              <Mail className="w-5 h-5 text-vermillion flex-shrink-0 mt-0.5" />
              <p className="font-body text-sm text-ink/70">
                A confirmation will be sent to your email once it clears. If you don't see it within 10 minutes, contact{" "}
                <a href="mailto:hello@listworks.pro" className="text-vermillion underline">hello@listworks.pro</a>.
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="mt-6 btn-ghost-ink px-6 py-3 font-heading text-sm uppercase tracking-[0.15em]"
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Declined — only when Stripe explicitly confirms unpaid + expired */}
        {status === "declined" && (
          <div data-testid="payment-declined" className="border border-ink/15 bg-white p-10">
            <h1 className="font-display text-4xl">Card wasn't charged.</h1>
            <p className="mt-3 font-body text-ink/70">
              Your card was not charged. This happens when a session expires or the payment was cancelled.
              Try again below or contact{" "}
              <a href="mailto:hello@listworks.pro" className="text-vermillion underline">hello@listworks.pro</a>.
            </p>
            <button
              onClick={() => navigate("/#pricing")}
              className="mt-6 bg-vermillion text-oat hover:bg-[#e02d0e] px-6 py-3 font-heading text-sm uppercase tracking-[0.15em] transition"
            >
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
