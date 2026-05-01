"use client";

import { useState, useEffect } from "react";
import { Mail, Pencil, Eye, X, Save, Loader2 } from "lucide-react";

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ template, dark, onClose, onSave }) {
  const [form, setForm] = useState({
    title: template.title,
    description: template.description,
    subject: template.subject,
    content: template.content,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const bg      = dark ? "#0f1117" : "#ffffff";
  const border  = dark ? "#1e2535" : "#e2e8f0";
  const text    = dark ? "#e2e8f0" : "#1e293b";
  const muted   = dark ? "#64748b" : "#94a3b8";
  const inputBg = dark ? "#0f1117" : "#ffffff";

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/email-template/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      onSave(data.template);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: `1px solid ${border}`,
    background: inputBg,
    color: text,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "min(660px, 95vw)", maxHeight: "90vh",
          background: bg, borderRadius: 16, border: `1px solid ${border}`,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: text, fontFamily: "'DM Sans', sans-serif" }}>
              Edit Template
            </p>
            <p style={{ margin: 0, fontSize: 12, color: muted, fontFamily: "'DM Sans', sans-serif" }}>
              {template.key}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: `1px solid ${border}`,
            background: "transparent", cursor: "pointer", color: muted,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input
              style={inputStyle}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label style={labelStyle}>Email Subject</label>
            <input
              style={inputStyle}
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            />
          </div>
          <div>
            <label style={labelStyle}>Content (HTML or plain text)</label>
            <textarea
              style={{ ...inputStyle, minHeight: 200, resize: "vertical", lineHeight: 1.6 }}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
          </div>
          {error && (
            <p style={{ margin: 0, fontSize: 13, color: "#ef4444", fontFamily: "'DM Sans', sans-serif" }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px", borderTop: `1px solid ${border}`,
          display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            padding: "8px 18px", borderRadius: 8, border: `1px solid ${border}`,
            background: "transparent", color: text, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            color: "#fff", fontSize: 13, fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", gap: 6,
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({ template, dark, onClose }) {
  const bg     = dark ? "#0f1117" : "#ffffff";
  const border = dark ? "#1e2535" : "#e2e8f0";
  const text   = dark ? "#e2e8f0" : "#1e293b";
  const muted  = dark ? "#64748b" : "#94a3b8";
  const surface = dark ? "#1a1f2e" : "#FFFFFF";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "min(680px, 95vw)", maxHeight: "90vh", background: bg,
        borderRadius: 16, border: `1px solid ${border}`,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          padding: "20px 24px", borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: text, fontFamily: "'DM Sans', sans-serif" }}>
              Preview
            </p>
            <p style={{ margin: 0, fontSize: 12, color: muted, fontFamily: "'DM Sans', sans-serif" }}>
              Subject: {template.subject}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: `1px solid ${border}`,
            background: "transparent", cursor: "pointer", color: muted,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div style={{
            background: surface, borderRadius: 10, border: `1px solid ${border}`,
            padding: 24, fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, color: text, lineHeight: 1.7, whiteSpace: "pre-wrap",
          }}>
            {template.content || <em style={{ color: muted }}>No content yet.</em>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EmailTemplates({ dark }) {
  const [templates, setTemplates]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [togglingId, setTogglingId]   = useState(null);
  const [editTarget, setEditTarget]   = useState(null);
  const [previewTarget, setPreviewTarget] = useState(null);

  const bg        = dark ? "#0f1117" : "#ffffff";
  const surface   = dark ? "#1a1f2e" : "#FFFFFF";
  const border    = dark ? "#1e2535" : "#e2e8f0";
  const text      = dark ? "#e2e8f0" : "#1e293b";
  const muted     = dark ? "#64748b" : "#94a3b8";
  const cardHover = dark ? "#1e2535" : "#f1f5f9";

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/email-template/1");
      const data = await res.json();
      setTemplates(data.templates ?? []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(t) {
    setTogglingId(t.id);
    const next = t.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
    try {
      const res = await fetch(`/api/email-template/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      setTemplates((prev) => prev.map((x) => (x.id === t.id ? data.template : x)));
    } catch {
      // handle error
    } finally {
      setTogglingId(null);
    }
  }

  function handleSaved(updated) {
    setTemplates((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    setEditTarget(null);
  }

  const iconBtn = {
    width: 32, height: 32, borderRadius: 8,
    border: `1px solid ${border}`, background: "transparent",
    cursor: "pointer", color: muted,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .et-row { transition: background 0.15s; }
        .et-row:hover { background: ${cardHover} !important; }
        .et-iconbtn:hover { background: ${surface} !important; color: ${text} !important; }
        .et-toggle:hover { opacity: 0.85; }
      `}</style>

      <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif" }}>
        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: text }}>
            Email Templates
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: muted }}>
            Manage transactional & marketing email templates
          </p>
        </div>

        {/* Table card */}
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 120px 100px",
            padding: "12px 20px", borderBottom: `1px solid ${border}`, background: surface,
          }}>
            {["Template", "Status", "Actions"].map((h) => (
              <span key={h} style={{
                fontSize: 11, fontWeight: 700, color: muted,
                textTransform: "uppercase", letterSpacing: "0.07em",
                textAlign: h === "Actions" ? "right" : "left",
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: muted, fontSize: 13 }}>
              <Loader2 size={20} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
              <p style={{ margin: 0 }}>Loading templates…</p>
            </div>
          ) : templates.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: muted, fontSize: 13 }}>
              No email templates found.
            </div>
          ) : (
            templates.map((t, i) => (
              <div
                key={t.id}
                className="et-row"
                style={{
                  display: "grid", gridTemplateColumns: "1fr 120px 100px",
                  alignItems: "center", padding: "14px 20px",
                  borderBottom: i < templates.length - 1 ? `1px solid ${border}` : "none",
                  background: bg,
                }}
              >
                {/* Template info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: dark ? "#1a2535" : "#eff6ff",
                    border: `1px solid ${border}`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Mail size={15} color={dark ? "#60a5fa" : "#3b82f6"} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: text }}>
                      {t.title}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: muted }}>
                      {t.description}
                    </p>
                  </div>
                </div>

                {/* Status toggle */}
                <div>
                  <button
                    className="et-toggle"
                    onClick={() => toggleStatus(t)}
                    disabled={togglingId === t.id}
                    style={{
                      padding: "4px 12px", borderRadius: 20, border: "none",
                      cursor: togglingId === t.id ? "not-allowed" : "pointer",
                      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                      fontFamily: "'DM Sans', sans-serif",
                      display: "flex", alignItems: "center", gap: 5,
                      transition: "all 0.15s",
                      ...(t.status === "ACTIVE"
                        ? { background: dark ? "rgba(34,197,94,0.15)" : "#dcfce7", color: dark ? "#4ade80" : "#16a34a" }
                        : { background: dark ? "rgba(100,116,139,0.15)" : "#f1f5f9", color: muted }),
                    }}
                  >
                    {togglingId === t.id ? (
                      <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: t.status === "ACTIVE" ? (dark ? "#4ade80" : "#22c55e") : muted,
                        display: "inline-block",
                      }} />
                    )}
                    {t.status === "ACTIVE" ? "active" : "draft"}
                  </button>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button className="et-iconbtn" onClick={() => setEditTarget(t)} title="Edit template" style={iconBtn}>
                    <Pencil size={14} />
                  </button>
                  <button className="et-iconbtn" onClick={() => setPreviewTarget(t)} title="Preview template" style={iconBtn}>
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {editTarget && (
        <EditModal
          template={editTarget}
          dark={dark}
          onClose={() => setEditTarget(null)}
          onSave={handleSaved}
        />
      )}
      {previewTarget && (
        <PreviewModal
          template={previewTarget}
          dark={dark}
          onClose={() => setPreviewTarget(null)}
        />
      )}
    </>
  );
}