"use client";

import { useMemo, useState,useEffect } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [userId, setUserId] = useState<string>("");

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I’m ReceiptSentry. Ask me about receipts, spend summaries, or anomalies." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: text }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = (await res.json()) as { reply: string };
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Oops — failed to reach the API. (${e?.message || "unknown error"})` },
      ]);
    } finally {
      setLoading(false);
    }
  }
    const apiBase = useMemo(() => {
    // For local dev, point to wrangler dev URL:
    // In production, set NEXT_PUBLIC_API_BASE to your deployed Worker URL.
    return process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8787";
  }, []);

    useEffect(() => {
    // runs only in the browser
    const existing = window.localStorage.getItem("cf_user_id");
    if (existing) {
      setUserId(existing);
      return;
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon_${Math.random().toString(16).slice(2)}_${Date.now()}`;

    window.localStorage.setItem("cf_user_id", id);
    setUserId(id);
  }, []);

  // Optional: avoid rendering UI that assumes userId exists
  if (!userId) return null;


  return (
    <main style={{ maxWidth: 780, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>ReceiptSentry (Cloudflare AI Demo)</h1>

      <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 12, minHeight: 420 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "10px 0" }}>
            <div style={{ fontSize: 12, opacity: 0.65 }}>{m.role.toUpperCase()}</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ opacity: 0.7 }}>Thinking…</div>}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
          placeholder="Ask something…"
          style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
        />
        <button
          onClick={send}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #111",
            background: loading ? "#999" : "#111",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
          disabled={loading}
        >
          Send
        </button>
      </div>

      <p style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>
        API Base: <code>{apiBase}</code>
      </p>
    </main>
  );
}
