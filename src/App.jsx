import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── CONFIG — update these 4 lines per clinic ────────────────────────────────
const SUPABASE_URL  = "https://skhusyqosezjrkutbalq.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraHVzeXFvc2V6anJrdXRiYWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1ODM1MzQsImV4cCI6MjA5NTE1OTUzNH0.b-gnd4PIOQcyuQb1UIaYGvltKcBLT-UucUJgfuzt78E";
const CLINIC_ID     = "sunrise-dental-austin";
const CLINIC_NAME   = "Sunrise Dental";
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtTime  = ts => ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate  = ts => ts ? new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" }) : "—";
const fmtDur   = s  => { if (!s) return "—"; const m = Math.floor(s/60), sec = s%60; return m > 0 ? `${m}m ${sec}s` : `${sec}s`; };
const cleanNum = s  => s ? s.replace(/\D/g, "") : "";

const SENTIMENT = {
  Positive: { bg: "#0d3320", text: "#4ade80", dot: "#22c55e", label: "Positive" },
  Neutral:  { bg: "#2a2500", text: "#fbbf24", dot: "#f59e0b", label: "Neutral"  },
  Negative: { bg: "#3a0a0a", text: "#f87171", dot: "#ef4444", label: "Negative" },
  positive: { bg: "#0d3320", text: "#4ade80", dot: "#22c55e", label: "Positive" },
  neutral:  { bg: "#2a2500", text: "#fbbf24", dot: "#f59e0b", label: "Neutral"  },
  negative: { bg: "#3a0a0a", text: "#f87171", dot: "#ef4444", label: "Negative" },
};

const ACTION = {
  book:               { label: "Booked",       bg: "#0a1f3a", text: "#60a5fa" },
  cancel:             { label: "Cancelled",    bg: "#3a0a0a", text: "#f87171" },
  reschedule:         { label: "Rescheduled",  bg: "#2a1a00", text: "#fb923c" },
  check_availability: { label: "Availability", bg: "#0a2a1a", text: "#34d399" },
  lookup:             { label: "Lookup",       bg: "#1a1a2a", text: "#a78bfa" },
  call_ended:         { label: "Call",         bg: "#1a0a2a", text: "#c084fc" },
  call_inbound:       { label: "Inbound",      bg: "#0a2a2a", text: "#22d3ee" },
  identify_caller:    { label: "ID Check",     bg: "#1a1a1a", text: "#94a3b8" },
};

// ═════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode]     = useState("login"); // login | signup | reset

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        setErr("Check your email to confirm your account, then log in.");
        setMode("login");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (error) throw error;
        setErr("Password reset email sent. Check your inbox.");
        setMode("login");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        onAuth(data.session);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0px 1000px #111820 inset !important; -webkit-text-fill-color: #e2e8f0 !important; }
      `}</style>

      <div style={{ width: 380, padding: "40px 36px", background: "#0f1520", border: "1px solid #1e293b", borderRadius: 16 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, #0ea5e9, #6366f1)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .5h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#f1f5f9" }}>{CLINIC_NAME}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>AI Receptionist Dashboard</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: "100%", padding: "10px 14px", background: "#111820", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none" }}
              placeholder="you@clinic.com" />
          </div>

          {mode !== "reset" && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Password</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} required={mode !== "reset"}
                style={{ width: "100%", padding: "10px 14px", background: "#111820", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none" }}
                placeholder="••••••••" />
            </div>
          )}

          {err && (
            <div style={{ padding: "10px 14px", background: err.includes("sent") || err.includes("confirm") ? "#0d2a1a" : "#2a0a0a", border: `1px solid ${err.includes("sent") || err.includes("confirm") ? "#166534" : "#7f1d1d"}`, borderRadius: 8, fontSize: 13, color: err.includes("sent") || err.includes("confirm") ? "#4ade80" : "#f87171", marginBottom: 16 }}>{err}</div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "11px", background: loading ? "#1e293b" : "linear-gradient(135deg, #0ea5e9, #6366f1)", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Email"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", display: "flex", justifyContent: "center", gap: 16 }}>
          {mode !== "login"  && <button onClick={() => { setMode("login");  setErr(""); }} style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Sign In</button>}
          {mode !== "signup" && <button onClick={() => { setMode("signup"); setErr(""); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Create Account</button>}
          {mode !== "reset"  && <button onClick={() => { setMode("reset");  setErr(""); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Forgot Password</button>}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// AUDIO PLAYER
// ═════════════════════════════════════════════════════════════════════════════
function AudioPlayer({ url }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onTime = () => setProgress(a.currentTime / (a.duration || 1));
    const onMeta = () => setDuration(a.duration || 0);
    const onEnd  = () => { setPlaying(false); setProgress(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => { a.removeEventListener("timeupdate", onTime); a.removeEventListener("loadedmetadata", onMeta); a.removeEventListener("ended", onEnd); };
  }, [url]);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); } else { a.play(); setPlaying(true); }
  }

  function seek(e) {
    const a = ref.current;
    if (!a) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    a.currentTime = pct * a.duration;
    setProgress(pct);
  }

  const fmtSec = s => { const m = Math.floor(s/60); const sec = Math.floor(s%60); return `${m}:${sec.toString().padStart(2,"0")}`; };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
      <audio ref={ref} src={url} preload="metadata" />
      <button onClick={toggle} style={{ width: 32, height: 32, borderRadius: "50%", background: "#0ea5e9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {playing
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
        }
      </button>
      <div onClick={seek} style={{ flex: 1, height: 4, background: "#1e293b", borderRadius: 2, cursor: "pointer", position: "relative" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: "#0ea5e9", borderRadius: 2, transition: "width 0.1s" }} />
      </div>
      <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Mono', monospace", minWidth: 40 }}>
        {duration > 0 ? fmtSec(progress * duration) + " / " + fmtSec(duration) : "—"}
      </span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#64748b", fontFamily: "sans-serif" }}>Loading…</div>
    </div>
  );

  if (!session) return <AuthScreen onAuth={setSession} />;
  return <Dashboard session={session} />;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ session }) {
  const [calls, setCalls]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [expanded, setExpanded]   = useState(null);
  const [refreshed, setRefreshed] = useState(new Date());
  const [dateFilter, setDateFilter] = useState("all"); // all | today | week | month
  const [actionFilter, setActionFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase
        .from("agent_calls")
        .select("*")
        .eq("clinic_id", CLINIC_ID)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      setCalls(data || []);
      setRefreshed(new Date());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Computed stats ──────────────────────────────────────────────────────────
  const today  = todayISO();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const callsToday    = calls.filter(c => c.created_at?.slice(0, 10) === today);
  const bookingsToday = calls.filter(c => c.action === "book" && c.created_at?.slice(0, 10) === today);
  const withDur       = calls.filter(c => c.duration_seconds);
  const avgDur        = withDur.length ? Math.round(withDur.reduce((a, c) => a + c.duration_seconds, 0) / withDur.length) : null;
  const sents         = calls.filter(c => c.user_sentiment);
  const posRate       = sents.length ? Math.round(sents.filter(c => ["positive", "Positive"].includes(c.user_sentiment)).length / sents.length * 100) : null;

  // New vs returning
  const uniquePhones = [...new Set(calls.filter(c => c.patient_phone).map(c => cleanNum(c.patient_phone)))];
  const phoneBookings = {};
  calls.filter(c => c.action === "book" && c.patient_phone).forEach(c => {
    const p = cleanNum(c.patient_phone);
    phoneBookings[p] = (phoneBookings[p] || 0) + 1;
  });
  const returningCount = Object.values(phoneBookings).filter(v => v > 1).length;

  // After hours calls
  const afterHoursCalls = calls.filter(c => c.action === "call_inbound" && c.outcome === "after_hours").length;

  // 7-day chart
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const byDay = days7.map(day => ({
    lbl: new Date(day + "T12:00:00").toLocaleDateString([], { weekday: "short" }),
    booked: calls.filter(c => c.action === "book" && c.created_at?.slice(0, 10) === day).length,
    inbound: calls.filter(c => c.action === "call_inbound" && c.created_at?.slice(0, 10) === day).length,
  }));
  const maxBar = Math.max(...byDay.map(d => d.inbound || d.booked), 1);

  // Action breakdown
  const actionCounts = { book: 0, cancel: 0, reschedule: 0 };
  calls.forEach(c => { if (c.action in actionCounts) actionCounts[c.action]++; });
  const totalActions = actionCounts.book + actionCounts.cancel + actionCounts.reschedule || 1;

  // Sentiment distribution
  const sentDist = { Positive: 0, Neutral: 0, Negative: 0 };
  calls.forEach(c => {
    const k = c.user_sentiment ? c.user_sentiment.charAt(0).toUpperCase() + c.user_sentiment.slice(1).toLowerCase() : null;
    if (k && k in sentDist) sentDist[k]++;
  });

  // ── Filtered list ───────────────────────────────────────────────────────────
  let filtered = calls;
  if (dateFilter === "today") filtered = filtered.filter(c => c.created_at?.slice(0, 10) === today);
  else if (dateFilter === "week")  filtered = filtered.filter(c => c.created_at?.slice(0, 10) >= weekAgo);
  else if (dateFilter === "month") filtered = filtered.filter(c => c.created_at?.slice(0, 7) === today.slice(0, 7));
  if (actionFilter !== "all") filtered = filtered.filter(c => c.action === actionFilter);
  filtered = filtered.slice(0, 80);

  const AVATAR_BG = ["#0a1f3a", "#0a2a1a", "#2a1a00", "#1a0a2a", "#2a0a0a"];
  const AVATAR_TX = ["#60a5fa", "#34d399", "#fb923c", "#c084fc", "#f87171"];

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f1520; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
        .card { background: #0f1520; border: 1px solid #1e293b; border-radius: 12px; }
        .row-item { padding: 12px 20px; border-bottom: 1px solid #111820; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; gap: 12px; }
        .row-item:hover { background: #111820; }
        .row-item:last-child { border-bottom: none; }
        .pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; gap: 5px; white-space: nowrap; }
        .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .mono { font-family: 'DM Mono', monospace; }
        .stat-card { background: #0f1520; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; }
        .filter-btn { background: none; border: 1px solid #1e293b; border-radius: 8px; padding: 5px 14px; font-size: 12px; cursor: pointer; color: #64748b; font-family: inherit; transition: all 0.15s; }
        .filter-btn.active { background: #0ea5e910; border-color: #0ea5e9; color: #0ea5e9; }
        .filter-btn:hover:not(.active) { border-color: #334155; color: #94a3b8; }
        .expand { animation: expandIn 0.2s ease; }
        @keyframes expandIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        a { color: #0ea5e9; text-decoration: none; }
        a:hover { text-decoration: underline; }
        select { background: #0f1520; border: 1px solid #1e293b; border-radius: 8px; padding: 5px 10px; font-size: 12px; color: #94a3b8; font-family: inherit; cursor: pointer; outline: none; }
      `}</style>

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: "1px solid #1e293b", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #0ea5e9, #6366f1)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .5h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>{CLINIC_NAME}</div>
              <div style={{ fontSize: 11, color: "#475569" }}>AI Receptionist</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: "#475569" }}>{session.user.email}</span>
            <span style={{ fontSize: 11, color: "#334155" }}>·</span>
            <span style={{ fontSize: 11, color: "#475569" }}>Updated {refreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            <button onClick={load} disabled={loading}
              style={{ background: "none", border: "1px solid #1e293b", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: loading ? "spin 1s linear infinite" : "none" }}>
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
              Refresh
            </button>
            <button onClick={() => supabase.auth.signOut()}
              style={{ background: "none", border: "1px solid #1e293b", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#64748b", fontFamily: "inherit" }}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>

        {error && (
          <div style={{ padding: "12px 16px", background: "#2a0a0a", border: "1px solid #7f1d1d", borderRadius: 10, marginBottom: 20, fontSize: 13, color: "#f87171" }}>
            Error loading data: {error}
          </div>
        )}

        {/* ── STATS ─────────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Calls Today",       value: loading ? "—" : callsToday.length,                   accent: "#0ea5e9", icon: "📞" },
            { label: "Bookings Today",     value: loading ? "—" : bookingsToday.length,                accent: "#22c55e", icon: "📅" },
            { label: "Avg Call Duration",  value: loading ? "—" : (avgDur ? fmtDur(avgDur) : "—"),    accent: "#f59e0b", icon: "⏱"  },
            { label: "Positive Sentiment", value: loading ? "—" : (posRate !== null ? posRate + "%" : "—"), accent: "#a78bfa", icon: "😊" },
          ].map(({ label, value, accent, icon }) => (
            <div key={label} className="stat-card">
              <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: accent, lineHeight: 1, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 12, color: "#475569" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── SECONDARY STATS ───────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Returning Callers",  value: loading ? "—" : returningCount,   accent: "#22d3ee", icon: "🔄" },
            { label: "After-Hours Calls",  value: loading ? "—" : afterHoursCalls,  accent: "#fb923c", icon: "🌙" },
            { label: "Total Records",      value: loading ? "—" : calls.length,     accent: "#94a3b8", icon: "📊" },
          ].map(({ label, value, accent, icon }) => (
            <div key={label} className="stat-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 22 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 600, color: accent }}>{value}</div>
                <div style={{ fontSize: 12, color: "#475569" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW ────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

          {/* 7-day bar chart */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Activity — Last 7 Days</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
              {byDay.map(({ lbl, booked, inbound }) => {
                const h = Math.max(inbound, booked);
                return (
                  <div key={lbl} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{ fontSize: 10, color: h > 0 ? "#0ea5e9" : "#1e293b", fontWeight: 600 }}>{h || ""}</div>
                    <div style={{ width: "100%", background: "#111820", borderRadius: 4, height: 72, display: "flex", flexDirection: "column-reverse", overflow: "hidden" }}>
                      <div style={{ height: `${(inbound / maxBar) * 100}%`, background: "#0ea5e930", borderRadius: 4, minHeight: inbound > 0 ? 3 : 0 }} />
                      <div style={{ height: `${(booked / maxBar) * 100}%`, background: "#22c55e", borderRadius: 4, minHeight: booked > 0 ? 3 : 0 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#475569" }}>{lbl}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "#22c55e" }}/>Bookings</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "#0ea5e930" }}/>Inbound</div>
            </div>
          </div>

          {/* Right column — breakdown + sentiment */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Action Breakdown</div>
            {[
              { key: "book",        label: "Booked",      color: "#22c55e" },
              { key: "cancel",      label: "Cancelled",   color: "#ef4444" },
              { key: "reschedule",  label: "Rescheduled", color: "#f59e0b" },
            ].map(({ key, label, color }) => {
              const count = actionCounts[key] || 0;
              const pct = Math.round((count / totalActions) * 100);
              return (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: "#94a3b8" }}>{label}</span>
                    <span style={{ fontWeight: 600, color }}>{count}</span>
                  </div>
                  <div style={{ height: 5, background: "#111820", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #1e293b" }}>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>Sentiment</div>
              <div style={{ display: "flex", gap: 8 }}>
                {Object.entries(sentDist).map(([k, v]) => {
                  const s = SENTIMENT[k] || SENTIMENT.Neutral;
                  return (
                    <div key={k} style={{ flex: 1, background: s.bg, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: s.text }}>{v}</div>
                      <div style={{ fontSize: 10, color: s.text, opacity: 0.8, marginTop: 2 }}>{k}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTIVITY TABLE ────────────────────────────────────────────────── */}
        <div className="card">
          {/* Table header + filters */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #111820", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recent Activity</div>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{filtered.length} of {calls.length} records</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["all","today","week","month"].map(f => (
                <button key={f} className={`filter-btn ${dateFilter === f ? "active" : ""}`} onClick={() => setDateFilter(f)}>
                  {f === "all" ? "All time" : f === "today" ? "Today" : f === "week" ? "7 days" : "This month"}
                </button>
              ))}
              <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                <option value="all">All actions</option>
                <option value="call_ended">Calls</option>
                <option value="book">Bookings</option>
                <option value="cancel">Cancellations</option>
                <option value="reschedule">Reschedules</option>
                <option value="lookup">Lookups</option>
                <option value="call_inbound">Inbound</option>
                <option value="identify_caller">ID checks</option>
              </select>
            </div>
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "#475569", fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#475569", fontSize: 13 }}>No records match the current filters.</div>
          ) : (
            filtered.map(row => {
              const action   = ACTION[row.action] || { label: row.action, bg: "#1a1a1a", text: "#94a3b8" };
              const sentiment = row.user_sentiment ? (SENTIMENT[row.user_sentiment] || SENTIMENT.Neutral) : null;
              const initials  = row.patient_name ? row.patient_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
              const ai = (row.patient_name || "").length % 5;
              const isExp = expanded === row.id;

              return (
                <div key={row.id}>
                  <div className="row-item" onClick={() => setExpanded(isExp ? null : row.id)} style={{ background: isExp ? "#111820" : undefined }}>
                    {/* Avatar */}
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: AVATAR_BG[ai], color: AVATAR_TX[ai], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                      {initials}
                    </div>
                    {/* Main info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", marginBottom: 2 }}>
                        {row.patient_name || row.patient_phone || "Unknown caller"}
                        {row.action === "call_ended" && row.transcript && (
                          <span style={{ marginLeft: 8, fontSize: 10, color: "#475569", fontWeight: 400 }}>📝 transcript</span>
                        )}
                        {row.recording_url && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: "#475569" }}>🎙 recording</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#475569" }}>
                        {row.patient_phone && <span>{row.patient_phone}</span>}
                        {row.appointment_date && <span> · {row.appointment_date}{row.appointment_time ? " at " + row.appointment_time : ""}</span>}
                        {row.appointment_type && <span> · {row.appointment_type}</span>}
                      </div>
                    </div>
                    {/* Right badges */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                      <span className="pill" style={{ background: action.bg, color: action.text }}>{action.label}</span>
                      {sentiment && (
                        <span className="pill" style={{ background: sentiment.bg, color: sentiment.text }}>
                          <span className="dot" style={{ background: sentiment.dot }} />
                          {sentiment.label}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "#334155", minWidth: 72, textAlign: "right" }}>
                        {fmtDate(row.created_at)} {fmtTime(row.created_at)}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExp && (
                    <div className="expand" style={{ padding: "0 20px 16px", borderBottom: "1px solid #111820" }}>
                      {/* Detail grid */}
                      <div style={{ background: "#111820", borderRadius: 10, padding: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, fontSize: 12, marginBottom: row.summary || row.transcript || row.recording_url ? 12 : 0 }}>
                        <div><div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Call ID</div><div className="mono" style={{ fontSize: 11, color: "#64748b" }}>{row.call_id || "—"}</div></div>
                        <div><div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Duration</div><div style={{ fontWeight: 500 }}>{fmtDur(row.duration_seconds)}</div></div>
                        <div><div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Outcome</div><div style={{ fontWeight: 500, textTransform: "capitalize" }}>{row.outcome || "—"}</div></div>
                        {row.appointment_type && <div><div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Type</div><div style={{ textTransform: "capitalize" }}>{row.appointment_type}</div></div>}
                        {row.confirmation_id && <div><div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Confirmation</div><div className="mono" style={{ fontSize: 11, color: "#64748b", wordBreak: "break-all" }}>{row.confirmation_id}</div></div>}
                        {row.user_sentiment && <div><div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Sentiment</div><div style={{ textTransform: "capitalize", color: (SENTIMENT[row.user_sentiment] || SENTIMENT.Neutral).text }}>{row.user_sentiment}</div></div>}
                      </div>

                      {/* Audio player */}
                      {row.recording_url && <AudioPlayer url={row.recording_url} />}

                      {/* AI Summary */}
                      {row.summary && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>AI Summary</div>
                          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, background: "#0a1f3a20", border: "1px solid #0ea5e920", borderLeft: "3px solid #0ea5e9", borderRadius: 8, padding: "10px 14px" }}>
                            {row.summary}
                          </div>
                        </div>
                      )}

                      {/* Transcript */}
                      {row.transcript && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Transcript</div>
                          <div style={{ background: "#111820", border: "1px solid #1e293b", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#64748b", lineHeight: 1.8, maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {row.transcript}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "#1e293b", padding: "24px 0 8px" }}>
          {CLINIC_NAME} · AI Receptionist · Gold Tier
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
