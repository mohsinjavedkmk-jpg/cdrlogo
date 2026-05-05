"use client";
import { useState, useEffect } from "react";
import React from "react";
import Link from "next/link";

export default function AdminFavourites({ dark = true }) {
  const [logos, setLogos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("logos");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetch("/api/admin/favourites")
      .then(r => r.json())
      .then(d => {
        setLogos(d.logos || []);
        setUsers(d.users || []);
        setLoading(false);
      });
  }, []);

  const filteredLogos = logos.filter(l =>
    l.logoName.toLowerCase().includes(search.toLowerCase()) ||
    l.category?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Theme tokens matching the admin panel ──────────────────────────────
  const bg        = dark ? "#0f1117" : "#f8fafc";
  const surface   = dark ? "#161b27" : "#ffffff";
  const surface2  = dark ? "#1e2535" : "#f1f5f9";
  const border    = dark ? "#1e2535" : "#e2e8f0";
  const border2   = dark ? "#2a3347" : "#cbd5e1";
  const text      = dark ? "#e2e8f0" : "#1e293b";
  const muted     = dark ? "#64748b" : "#94a3b8";
  const accent    = "#22c55e";
  const accentDim = dark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.08)";

  const totalFavs = logos.reduce((s, l) => s + l._count.favoritedBy, 0);

  return (
    <div style={{ padding: "28px 28px 48px", background: bg, minHeight: "100%", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Top header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: text, margin: 0, letterSpacing: "-0.3px" }}>
          Favourites
        </h1>
        <p style={{ fontSize: 12, color: muted, margin: "4px 0 0" }}>
          Track which logos users have saved to their favourites
        </p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Saves",   value: totalFavs,   desc: "across all logos" },
          { label: "Logos Saved",   value: logos.length, desc: "have 1+ favourite" },
          { label: "Active Users",  value: users.length, desc: "saved at least one" },
        ].map(stat => (
          <div key={stat.label} style={{
            background: surface, border: `1px solid ${border}`,
            borderRadius: 10, padding: "16px 18px",
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: text, letterSpacing: "-0.5px" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: text, marginTop: 2 }}>{stat.label}</div>
            <div style={{ fontSize: 11, color: muted, marginTop: 1 }}>{stat.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, background: surface2, borderRadius: 8, padding: 3, border: `1px solid ${border}` }}>
          {[
            { key: "logos", label: "By Logo" },
            { key: "users", label: "By User" },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setExpandedId(null); setSearch(""); }} style={{
              padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              background: tab === t.key ? (dark ? "#2a3347" : "#ffffff") : "transparent",
              color: tab === t.key ? text : muted,
              boxShadow: tab === t.key ? (dark ? "0 1px 3px rgba(0,0,0,0.4)" : "0 1px 3px rgba(0,0,0,0.08)") : "none",
              transition: "all .15s",
            }}>
              {t.label}
              <span style={{
                marginLeft: 6, padding: "1px 6px", borderRadius: 100,
                background: tab === t.key ? accentDim : "transparent",
                color: tab === t.key ? accent : muted,
                fontSize: 10, fontWeight: 700,
              }}>
                {t.key === "logos" ? logos.length : users.length}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: muted, pointerEvents: "none" }}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder={tab === "logos" ? "Search logos…" : "Search users…"}
            value={search}
            onChange={e => { setSearch(e.target.value); setExpandedId(null); }}
            style={{
              paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              borderRadius: 8, border: `1px solid ${border}`,
              background: surface, color: text, fontSize: 12,
              outline: "none", width: 200, fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 10, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px 24px", textAlign: "center", color: muted, fontSize: 13 }}>
            Loading…
          </div>
        ) : tab === "logos" ? (
          filteredLogos.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: muted, fontSize: 13 }}>No results found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {["#", "Logo", "Category", "Saves", "Top Savers", ""].map((h, i) => (
                    <th key={i} style={{
                      padding: "11px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 600, color: muted,
                      textTransform: "uppercase", letterSpacing: ".5px",
                      background: dark ? "#161b27" : "#f8fafc",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
               {filteredLogos.map((logo, i) => (
  <React.Fragment key={logo.id}>
    <tr
                      style={{ borderBottom: `1px solid ${border}`, transition: "background .12s", cursor: "default" }}
                      onMouseEnter={e => e.currentTarget.style.background = dark ? "#1a2030" : "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* Rank */}
                      <td style={{ padding: "12px 16px", color: muted, fontSize: 12, fontWeight: 600, width: 40 }}>
                        {i + 1}
                      </td>

                      {/* Logo */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 7, overflow: "hidden", flexShrink: 0,
                            border: `1px solid ${border}`, background: dark ? "#1e2535" : "#f1f5f9",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {logo.webpUrl
                              ? <img src={logo.webpUrl} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }} />
                              : <span style={{ fontSize: 10, fontWeight: 800, color: muted }}>{logo.logoName.slice(0, 2).toUpperCase()}</span>
                            }
                          </div>
                          <span style={{ fontWeight: 600, color: text, fontSize: 13 }}>{logo.logoName}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          display: "inline-block", padding: "2px 9px", borderRadius: 5,
                          background: surface2, border: `1px solid ${border}`,
                          fontSize: 11, fontWeight: 600, color: muted,
                        }}>
                          {logo.category || "—"}
                        </span>
                      </td>

                      {/* Save count */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24"
                            fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                          <span style={{ fontWeight: 700, color: text, fontSize: 14 }}>{logo._count.favoritedBy}</span>
                        </div>
                      </td>

                      {/* User avatars preview */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {logo.favoritedBy.slice(0, 4).map((u, idx) => (
                            <div key={u.id} title={u.name || u.email} style={{
                              width: 24, height: 24, borderRadius: "50%",
                              background: `hsl(${(idx * 67 + 140) % 360}, 55%, ${dark ? "35%" : "75%"})`,
                              border: `2px solid ${surface}`,
                              marginLeft: idx > 0 ? -6 : 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9, fontWeight: 800, color: dark ? "#fff" : "#1e293b",
                              zIndex: 4 - idx, position: "relative",
                            }}>
                              {(u.name || u.email || "?").slice(0, 1).toUpperCase()}
                            </div>
                          ))}
                          {logo.favoritedBy.length > 4 && (
                            <span style={{ fontSize: 10, color: muted, marginLeft: 6 }}>
                              +{logo.favoritedBy.length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button
                            onClick={() => setExpandedId(expandedId === logo.id ? null : logo.id)}
                            style={{
                              padding: "5px 11px", borderRadius: 6, cursor: "pointer",
                              border: `1px solid ${border}`, background: "transparent",
                              color: muted, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                              transition: "border-color .15s, color .15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = border2; e.currentTarget.style.color = text; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = muted; }}
                          >
                            {expandedId === logo.id ? "Collapse" : "Details"}
                          </button>
                          <Link href={`/logo/${logo.slug}`} target="_blank" style={{
                            padding: "5px 11px", borderRadius: 6, textDecoration: "none",
                            background: accentDim, border: `1px solid rgba(34,197,94,0.2)`,
                            color: accent, fontSize: 11, fontWeight: 600,
                          }}>
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded user list */}
                    {expandedId === logo.id && (
                      <tr key={`${logo.id}-exp`}>
                        <td colSpan={6} style={{ padding: "0 16px 16px 58px", background: dark ? "#161b27" : "#f8fafc" }}>
                          <div style={{
                            border: `1px solid ${border}`, borderRadius: 8,
                            padding: "12px 14px", marginTop: 4,
                            display: "flex", flexWrap: "wrap", gap: 8,
                          }}>
                            <div style={{ width: "100%", fontSize: 11, fontWeight: 600, color: muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>
                              Saved by {logo.favoritedBy.length} user{logo.favoritedBy.length !== 1 ? "s" : ""}
                            </div>
                            {logo.favoritedBy.map((u, idx) => (
                              <div key={u.id} style={{
                                display: "inline-flex", alignItems: "center", gap: 7,
                                padding: "5px 10px", borderRadius: 6,
                                background: surface2, border: `1px solid ${border}`,
                              }}>
                                <div style={{
                                  width: 20, height: 20, borderRadius: "50%",
                                  background: `hsl(${(idx * 67 + 140) % 360}, 55%, ${dark ? "35%" : "75%"})`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 9, fontWeight: 800, color: dark ? "#fff" : "#1e293b", flexShrink: 0,
                                }}>
                                  {(u.name || u.email || "?").slice(0, 1).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: text }}>{u.name || "—"}</div>
                                  <div style={{ fontSize: 10, color: muted }}>{u.email}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                   </React.Fragment>
))}
</tbody>
            </table>
          )
        ) : (
          /* ── USERS TAB ── */
          filteredUsers.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: muted, fontSize: 13 }}>No results found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {["#", "User", "Joined", "Saved", ""].map((h, i) => (
                    <th key={i} style={{
                      padding: "11px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 600, color: muted,
                      textTransform: "uppercase", letterSpacing: ".5px",
                      background: dark ? "#161b27" : "#f8fafc",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
          {filteredUsers.map((user, i) => (
  <React.Fragment key={user.id}>
    <tr
                      style={{ borderBottom: `1px solid ${border}`, transition: "background .12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = dark ? "#1a2030" : "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 16px", color: muted, fontSize: 12, fontWeight: 600, width: 40 }}>{i + 1}</td>

                      {/* User */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                            background: `hsl(${(i * 67 + 140) % 360}, 55%, ${dark ? "35%" : "75%"})`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 800, color: dark ? "#fff" : "#1e293b",
                          }}>
                            {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: text, fontSize: 13 }}>{user.name || "—"}</div>
                            <div style={{ fontSize: 11, color: muted }}>{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Joined */}
                      <td style={{ padding: "12px 16px", color: muted, fontSize: 12 }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </td>

                      {/* Count */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24"
                            fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                          <span style={{ fontWeight: 700, color: text, fontSize: 14 }}>{user._count.favorites}</span>
                        </div>
                      </td>

                      {/* Expand */}
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                          style={{
                            padding: "5px 11px", borderRadius: 6, cursor: "pointer",
                            border: `1px solid ${border}`, background: "transparent",
                            color: muted, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                            transition: "border-color .15s, color .15s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = border2; e.currentTarget.style.color = text; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = muted; }}
                        >
                          {expandedId === user.id ? "Collapse" : "Show logos"}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded logos */}
                    {expandedId === user.id && (
                      <tr key={`${user.id}-exp`}>
                        <td colSpan={5} style={{ padding: "0 16px 16px 58px", background: dark ? "#161b27" : "#f8fafc" }}>
                          <div style={{
                            border: `1px solid ${border}`, borderRadius: 8,
                            padding: "12px 14px", marginTop: 4,
                            display: "flex", flexWrap: "wrap", gap: 8,
                          }}>
                            <div style={{ width: "100%", fontSize: 11, fontWeight: 600, color: muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>
                              {user._count.favorites} saved logo{user._count.favorites !== 1 ? "s" : ""}
                            </div>
                            {user.favorites.map(logo => (
                              <Link key={logo.id} href={`/logo/${logo.slug}`} target="_blank" style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                padding: "6px 10px", borderRadius: 6, textDecoration: "none",
                                background: surface2, border: `1px solid ${border}`,
                                transition: "border-color .15s",
                              }}>
                                <div style={{
                                  width: 22, height: 22, borderRadius: 5, overflow: "hidden", flexShrink: 0,
                                  border: `1px solid ${border}`, background: surface,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  {logo.webpUrl
                                    ? <img src={logo.webpUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    : <span style={{ fontSize: 8, fontWeight: 800, color: muted }}>{logo.logoName.slice(0, 2)}</span>
                                  }
                                </div>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: text }}>{logo.logoName}</div>
                                  <div style={{ fontSize: 10, color: muted }}>{logo.category || "—"}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
               </React.Fragment>
))}
</tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}