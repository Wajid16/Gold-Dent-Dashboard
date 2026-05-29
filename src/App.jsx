import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://skhusyqosezjrkutbalq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraHVzeXFvc2V6anJrdXRiYWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1ODM1MzQsImV4cCI6MjA5NTE1OTUzNH0.b-gnd4PIOQcyuQb1UIaYGvltKcBLT-UucUJgfuzt78E";
const CLINIC_ID = "sunrise-dental-austin";
const CLINIC_NAME = "Sunrise Dental";

async function supabase(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmt(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}

function fmtDuration(secs) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const SENTIMENT_COLORS = {
  positive: { bg: "#e6f4ea", text: "#1e7e34", dot: "#28a745" },
  neutral:  { bg: "#fff8e1", text: "#856404", dot: "#ffc107" },
  negative: { bg: "#fce8e6", text: "#c62828", dot: "#dc3545" },
  unknown:  { bg: "#f1f3f4", text: "#5f6368", dot: "#9aa0a6" },
};

const ACTION_LABELS = {
  book: { label: "Booked", color: "#1a73e8", bg: "#e8f0fe" },
  cancel: { label: "Cancelled", color: "#d93025", bg: "#fce8e6" },
  reschedule: { label: "Rescheduled", color: "#e37400", bg: "#fef3e2" },
  check_availability: { label: "Availability", color: "#1e8e3e", bg: "#e6f4ea" },
  lookup: { label: "Lookup", color: "#5f6368", bg: "#f1f3f4" },
  call_ended: { label: "Call", color: "#8430ce", bg: "#f3e8fd" },
};

export default function Dashboard() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [refreshed, setRefreshed] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabase(
        `agent_calls?clinic_id=eq.${CLINIC_ID}&order=created_at.desc&limit=200`
      );
      setCalls(data);
      setRefreshed(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = todayISO();
  const todayCalls = calls.filter(c => c.created_at?.slice(0, 10) === today);
  const todayBookings = calls.filter(c => c.action === "book" && c.created_at?.slice(0, 10) === today);
  const callEnded = calls.filter(c => c.action === "call_ended" && c.duration_seconds);
  const avgDuration = callEnded.length
    ? Math.round(callEnded.reduce((a, c) => a + (c.duration_seconds || 0), 0) / callEnded.length)
    : null;
  const sentiments = calls.filter(c => c.user_sentiment && c.user_sentiment !== "unknown");
  const positiveRate = sentiments.length
    ? Math.round((sentiments.filter(c => c.user_sentiment === "positive").length / sentiments.length) * 100)
    : null;

  const recent = calls.slice(0, 50);

  const actionCounts = calls.reduce((acc, c) => {
    if (c.action === "book") acc.book = (acc.book || 0) + 1;
    if (c.action === "cancel") acc.cancel = (acc.cancel || 0) + 1;
    if (c.action === "reschedule") acc.reschedule = (acc.reschedule || 0) + 1;
    return acc;
  }, {});

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const bookingsByDay = weekDays.map(day => ({
    day: new Date(day + "T12:00:00").toLocaleDateString([], { weekday: "short" }),
    count: calls.filter(c => c.action === "book" && c.created_at?.slice(0, 10) === day).length,
  }));

  const maxBar = Math.max(...bookingsByDay.map(d => d.count), 1);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#f8f9fa", minHeight: "100vh", color: "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #e8eaed; }
        .stat-card { background: #fff; border-radius: 12px; border: 1px solid #e8eaed; padding: 20px; }
        .badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        .dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
        .row-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1px solid #f1f3f4; cursor: pointer; transition: background 0.15s; }
        .row-item:hover { background: #f8f9fa; }
        .row-item:last-child { border-bottom: none; }
        .pill { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
        .mono { font-family: 'DM Mono', monospace; }
        .transcript-box { background: #f8f9fa; border-radius: 8px; padding: 14px; font-size: 12px; line-height: 1.7; color: #444; max-height: 200px; overflow-y: auto; white-space: pre-wrap; word-break: break-word; margin-top: 12px; border: 1px solid #e8eaed; }
        .slide-in { animation: slideIn 0.2s ease; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .bar-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
        .bar-track { width: 100%; background: #f1f3f4; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column-reverse; }
        .bar-fill { background: #1a73e8; border-radius: 6px; transition: height 0.5s ease; }
        .spin { animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }
        .section-header { font-size: 13px; font-weight: 600; color: #5f6368; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }
        .detail-panel { background: #fff; border-radius: 12px; border: 1px solid #e8eaed; padding: 20px; margin-top: 16px; }
        a { color: #1a73e8; text-decoration: none; }
        a:hover { text-decoration: underline; }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: "#1a73e8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .5h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "#1a1a2e" }}>{CLINIC_NAME}</div>
              <div style={{ fontSize: 12, color: "#5f6368" }}>AI Receptionist Dashboard</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#9aa0a6" }}>Updated {refreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            <button onClick={load} style={{ background: "none", border: "1px solid #e8eaed", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", color: "#3c4043", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "spin" : ""}>
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "#fce8e6", border: "1px solid #f5c6c6", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#c62828" }}>
            ⚠ Could not load data: {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Calls Today", value: loading ? "—" : todayCalls.length, icon: "📞", accent: "#1a73e8" },
            { label: "Bookings Today", value: loading ? "—" : todayBookings.length, icon: "📅", accent: "#1e8e3e" },
            { label: "Avg Call Duration", value: loading ? "—" : (avgDuration ? fmtDuration(avgDuration) : "—"), icon: "⏱", accent: "#e37400" },
            { label: "Positive Sentiment", value: loading ? "—" : (positiveRate !== null ? `${positiveRate}%` : "—"), icon: "😊", accent: "#8430ce" },
          ].map(({ label, value, icon, accent }) => (
            <div key={label} className="stat-card">
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: accent, lineHeight: 1, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 12, color: "#5f6368" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="section-header">Bookings — last 7 days</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
              {bookingsByDay.map(({ day, count }) => (
                <div key={day} className="bar-item">
                  <div style={{ fontSize: 11, fontWeight: 600, color: count > 0 ? "#1a73e8" : "#9aa0a6" }}>{count || ""}</div>
                  <div className="bar-track" style={{ height: 80 }}>
                    <div className="bar-fill" style={{ height: `${(count / maxBar) * 100}%`, minHeight: count > 0 ? 4 : 0 }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#5f6368" }}>{day}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div className="section-header">Action breakdown</div>
            {[
              { key: "book", label: "Appointments booked", color: "#1a73e8" },
              { key: "cancel", label: "Cancellations", color: "#d93025" },
              { key: "reschedule", label: "Reschedules", color: "#e37400" },
            ].map(({ key, label, color }) => {
              const count = actionCounts[key] || 0;
              const total = (actionCounts.book || 0) + (actionCounts.cancel || 0) + (actionCounts.reschedule || 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                    <span style={{ color: "#3c4043" }}>{label}</span>
                    <span style={{ fontWeight: 600, color }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: "#f1f3f4", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f1f3f4" }}>
              <div style={{ fontSize: 12, color: "#5f6368", marginBottom: 8 }}>Sentiment distribution</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["positive", "neutral", "negative"].map(s => {
                  const c = calls.filter(x => x.user_sentiment === s).length;
                  const sc = SENTIMENT_COLORS[s];
                  return (
                    <div key={s} style={{ flex: 1, background: sc.bg, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: sc.text }}>{c}</div>
                      <div style={{ fontSize: 11, color: sc.text, opacity: 0.8 }}>{s}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f1f3f4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="section-header" style={{ marginBottom: 0 }}>Recent activity</div>
            <span style={{ fontSize: 12, color: "#9aa0a6" }}>{recent.length} of {calls.length} records</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9aa0a6", fontSize: 14 }}>Loading...</div>
          ) : recent.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9aa0a6", fontSize: 14 }}>No activity yet. Make a test call to see data here.</div>
          ) : (
            recent.map((row) => {
              const action = ACTION_LABELS[row.action] || { label: row.action, color: "#5f6368", bg: "#f1f3f4" };
              const sentiment = SENTIMENT_COLORS[row.user_sentiment || "unknown"];
              const initials = row.patient_name ? row.patient_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
              const avatarColors = ["#e8f0fe", "#e6f4ea", "#fef3e2", "#f3e8fd", "#fce8e6"];
              const avatarColor = avatarColors[(row.patient_name || "").length % avatarColors.length];
              const avatarText = ["#1a73e8", "#1e8e3e", "#e37400", "#8430ce", "#d93025"][(row.patient_name || "").length % 5];
              const isSelected = selected?.id === row.id;

              return (
                <div key={row.id}>
                  <div className="row-item" onClick={() => setSelected(isSelected ? null : row)} style={{ background: isSelected ? "#f8f9fa" : undefined }}>
                    <div className="avatar" style={{ background: avatarColor, color: avatarText }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a2e", marginBottom: 2 }}>
                        {row.patient_name || row.patient_phone || "Unknown caller"}
                      </div>
                      <div style={{ fontSize: 12, color: "#5f6368", display: "flex", gap: 8, alignItems: "center" }}>
                        <span>{row.patient_phone || "—"}</span>
                        {row.appointment_date && <span>· {row.appointment_date} {row.appointment_time}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                      <span className="pill" style={{ background: action.bg, color: action.color }}>{action.label}</span>
                      {row.user_sentiment && row.user_sentiment !== "unknown" && (
                        <span className="pill" style={{ background: sentiment.bg, color: sentiment.text }}>
                          <span className="dot" style={{ background: sentiment.dot }} />
                          {row.user_sentiment}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: "#9aa0a6", minWidth: 60, textAlign: "right" }}>{fmtDate(row.created_at)} {fmt(row.created_at)}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isSelected ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="slide-in" style={{ padding: "0 20px 16px", borderBottom: "1px solid #f1f3f4" }}>
                      <div style={{ background: "#f8f9fa", borderRadius: 10, padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 13 }}>
                        <div>
                          <div style={{ color: "#5f6368", fontSize: 11, marginBottom: 3 }}>CALL ID</div>
                          <div className="mono" style={{ fontSize: 12, color: "#3c4043" }}>{row.call_id || "—"}</div>
                        </div>
                        <div>
                          <div style={{ color: "#5f6368", fontSize: 11, marginBottom: 3 }}>DURATION</div>
                          <div style={{ fontWeight: 500 }}>{fmtDuration(row.duration_seconds)}</div>
                        </div>
                        <div>
                          <div style={{ color: "#5f6368", fontSize: 11, marginBottom: 3 }}>OUTCOME</div>
                          <div style={{ fontWeight: 500, textTransform: "capitalize" }}>{row.outcome || "—"}</div>
                        </div>
                        {row.confirmation_id && (
                          <div>
                            <div style={{ color: "#5f6368", fontSize: 11, marginBottom: 3 }}>CONFIRMATION</div>
                            <div className="mono" style={{ fontSize: 12 }}>{row.confirmation_id}</div>
                          </div>
                        )}
                        {row.appointment_type && (
                          <div>
                            <div style={{ color: "#5f6368", fontSize: 11, marginBottom: 3 }}>TYPE</div>
                            <div style={{ textTransform: "capitalize" }}>{row.appointment_type}</div>
                          </div>
                        )}
                        {row.recording_url && (
                          <div>
                            <div style={{ color: "#5f6368", fontSize: 11, marginBottom: 3 }}>RECORDING</div>
                            <a href={row.recording_url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Listen ↗</a>
                          </div>
                        )}
                      </div>

                      {row.summary && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ color: "#5f6368", fontSize: 11, marginBottom: 6 }}>AI SUMMARY</div>
                          <div style={{ fontSize: 13, color: "#3c4043", lineHeight: 1.6, background: "#f0f7ff", borderRadius: 8, padding: "10px 14px", borderLeft: "3px solid #1a73e8" }}>
                            {row.summary}
                          </div>
                        </div>
                      )}

                      {row.transcript && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ color: "#5f6368", fontSize: 11, marginBottom: 6 }}>TRANSCRIPT</div>
                          <div className="transcript-box">{row.transcript}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={{ textAlign: "center", fontSize: 12, color: "#9aa0a6", paddingBottom: 24 }}>
          Powered by AI Receptionist · {CLINIC_NAME}
        </div>
      </div>
    </div>
  );
}
