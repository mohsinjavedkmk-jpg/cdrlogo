"use client";

import { useState, useEffect } from "react";

const popularSearches = [
  "Technology logos",
  "Automotive brands",
  "Finance logos",
  "Gaming logos",
];

const stats = [
  { value: "50,000+", label: "Premium Resources" },
  { value: "4",       label: "File Formats"      },
  { value: "Free",    label: "Always"             },
];

export default function Home() {
  const [searchValue, setSearchValue] = useState("");
  const [focused,     setFocused]     = useState(false);
  const [ready,       setReady]       = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .home-root {
          min-height: 100vh;
          background: #09090f;
          font-family: 'Sora', 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 24px 60px;
          position: relative;
          overflow: hidden;
        }

        /* Background */
        .bg-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .bg-glow::before {
          content: '';
          position: absolute;
          top: -10%;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 500px;
          background: radial-gradient(ellipse, rgba(139,92,246,.18) 0%, transparent 70%);
          border-radius: 50%;
          animation: glow-pulse 5s ease-in-out infinite;
        }
        .bg-glow::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 30%;
          width: 400px;
          height: 300px;
          background: radial-gradient(ellipse, rgba(99,102,241,.1) 0%, transparent 70%);
          border-radius: 50%;
        }
        @keyframes glow-pulse {
          0%,100% { opacity:1;  transform:translateX(-50%) scale(1);    }
          50%      { opacity:.7; transform:translateX(-50%) scale(1.08); }
        }

        .dot-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          z-index: 0;
        }

        /* Stagger animation base */
        .anim {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity .65s cubic-bezier(.22,1,.36,1),
                      transform .65s cubic-bezier(.22,1,.36,1);
        }
        .ready .anim { opacity: 1; transform: translateY(0); }

        .d0 { transition-delay:   0ms; }
        .d1 { transition-delay:  90ms; }
        .d2 { transition-delay: 180ms; }
        .d3 { transition-delay: 270ms; }
        .d4 { transition-delay: 360ms; }
        .d5 { transition-delay: 450ms; }
        .d6 { transition-delay: 540ms; }

        /* Tags slide from left */
        .tag-anim {
          opacity: 0;
          transform: translateX(-12px);
          transition: opacity .5s cubic-bezier(.22,1,.36,1),
                      transform .5s cubic-bezier(.22,1,.36,1);
        }
        .ready .tag-anim { opacity: 1; transform: translateX(0); }

        /* Content */
        .home-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 800px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          background: rgba(139,92,246,.1);
          border: 1px solid rgba(139,92,246,.28);
          border-radius: 100px;
          font-size: 12.5px;
          font-weight: 600;
          color: #c4b5fd;
          letter-spacing: .2px;
        }
        .badge-dot {
          width: 6px; height: 6px;
          background: #a78bfa;
          border-radius: 50%;
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1;  transform:scale(1);  }
          50%      { opacity:.5; transform:scale(.8); }
        }

        .home-heading {
          text-align: center;
          font-size: clamp(36px, 6vw, 68px);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -2px;
          color: #fff;
          text-wrap: balance;
        }
        .home-heading .accent {
          background: linear-gradient(135deg, #a855f7, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .home-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(14px, 2vw, 16.5px);
          color: rgba(255,255,255,.48);
          text-align: center;
          line-height: 1.7;
          max-width: 500px;
        }

        .format-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .format-badge {
          padding: 4px 11px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: .5px;
          border: 1px solid;
        }
        .fmt-cdr { background:rgba(239,68,68,.1);  border-color:rgba(239,68,68,.25);  color:#fca5a5; }
        .fmt-ai  { background:rgba(234,179,8,.1);  border-color:rgba(234,179,8,.25);  color:#fde68a; }
        .fmt-svg { background:rgba(34,197,94,.1);  border-color:rgba(34,197,94,.25);  color:#86efac; }
        .fmt-png { background:rgba(59,130,246,.1); border-color:rgba(59,130,246,.25); color:#93c5fd; }

        .search-bar {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: rgba(255,255,255,.04);
          border: 1.5px solid rgba(255,255,255,.1);
          border-radius: 14px;
          box-shadow: 0 2px 20px rgba(0,0,0,.3);
          transition: border-color .25s, box-shadow .25s;
          cursor: text;
        }
        .search-bar.focused {
          border-color: rgba(168,85,247,.7);
          box-shadow: 0 0 0 4px rgba(168,85,247,.15), 0 0 30px rgba(168,85,247,.1);
        }
        .search-icon { color: rgba(255,255,255,.35); flex-shrink: 0; }
        .search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-size: 15px;
          font-family: 'Sora', sans-serif;
          font-weight: 500;
          color: #fff;
          caret-color: #a855f7;
        }
        .search-input::placeholder { color: rgba(255,255,255,.3); }
        .search-kbd {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,.2);
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 5px;
          padding: 2px 7px;
          flex-shrink: 0;
        }

        .popular-wrap {
          width: 100%;
          max-width: 620px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .popular-label {
          font-size: 11.5px;
          font-weight: 600;
          color: rgba(255,255,255,.25);
          text-transform: uppercase;
          letter-spacing: .8px;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }
        .popular-tag {
          padding: 5px 13px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 100px;
          font-size: 12.5px;
          font-weight: 500;
          color: rgba(255,255,255,.55);
          cursor: pointer;
          transition: background .2s, border-color .2s, color .2s, transform .15s;
          white-space: nowrap;
        }
        .popular-tag:hover {
          background: rgba(168,85,247,.12);
          border-color: rgba(168,85,247,.35);
          color: #c4b5fd;
          transform: translateY(-2px);
        }

        .stats-row {
          display: flex;
          align-items: center;
          gap: 32px;
          margin-top: 8px;
        }
        .stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .stat-value { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -.5px; }
        .stat-label {
          font-size: 11.5px;
          font-weight: 500;
          color: rgba(255,255,255,.3);
          text-transform: uppercase;
          letter-spacing: .6px;
        }
        .stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,.08); }

        @media (max-width: 600px) {
          .home-root  { padding: 90px 18px 50px; }
          .stats-row  { gap: 20px; }
          .search-kbd { display: none; }
        }
      `}</style>

      <main className="home-root">
        <div className="bg-glow" />
        <div className="dot-grid" />

        <div className={`home-content${ready ? " ready" : ""}`}>

          {/* Badge */}
          <div className="anim d0">
            <div className="badge">
              <span className="badge-dot" />
              50,000+ Premium Logo Resources
            </div>
          </div>

          {/* Heading */}
          <div className="anim d1">
            <h1 className="home-heading">
              CDRLogo – Free{" "}
              <span className="accent">Brand &amp; Template</span>
              {" "}Vector Logos
            </h1>
          </div>

          {/* Sub */}
          <div className="anim d2">
            <p className="home-sub">
              Your free online library of high-quality brand logos and creative
              templates. Download instantly in CDR, AI, SVG, and PNG formats
              for any design project.
            </p>
          </div>

          {/* Format badges */}
          <div className="anim d3">
            <div className="format-badges">
              {[
                { label: "CDR", cls: "fmt-cdr" },
                { label: "AI",  cls: "fmt-ai"  },
                { label: "SVG", cls: "fmt-svg" },
                { label: "PNG", cls: "fmt-png" },
              ].map(f => (
                <span key={f.label} className={`format-badge ${f.cls}`}>{f.label}</span>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="anim d4" style={{ width: "100%", maxWidth: 620 }}>
            <div
              className={`search-bar${focused ? " focused" : ""}`}
              onClick={() => document.getElementById("logo-search")?.focus()}
            >
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                id="logo-search"
                className="search-input"
                type="text"
                placeholder="Technology logos"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              <span className="search-kbd">ESC</span>
            </div>
          </div>

          {/* Popular searches */}
          <div className="anim d5" style={{ width: "100%", maxWidth: 620 }}>
            <div className="popular-wrap">
              <span className="popular-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
                Popular
              </span>
              {popularSearches.map((tag, i) => (
                <button
                  key={tag}
                  className="popular-tag tag-anim"
                  style={{ transitionDelay: ready ? `${480 + i * 70}ms` : "0ms" }}
                  onClick={() => setSearchValue(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="anim d6">
            <div className="stats-row">
              {stats.map((s, i) => (
                <span key={s.label} style={{ display: "contents" }}>
                  {i > 0 && <div className="stat-divider" />}
                  <div className="stat">
                    <span className="stat-value">{s.value}</span>
                    <span className="stat-label">{s.label}</span>
                  </div>
                </span>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}