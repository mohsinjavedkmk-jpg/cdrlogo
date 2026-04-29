"use client";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const PANTONE_COLORS = [
  { name: "PMS 032 C",        hex: "#ED2939" },
  { name: "PMS 021 C",        hex: "#FF6F00" },
  { name: "PMS Yellow C",     hex: "#FFDD00" },
  { name: "PMS 355 C",        hex: "#00A651" },
  { name: "PMS 072 C",        hex: "#0072CE" },
  { name: "PMS Violet C",     hex: "#2E00BB" },
  { name: "PMS Rhodamine C",  hex: "#D62598" },
  { name: "PMS Black C",      hex: "#000000" },
  { name: "PMS White",        hex: "#FFFFFF" },
  { name: "PMS CG7 C",        hex: "#A7A8AA" },
  { name: "PMS 100 C",        hex: "#F6EB61" },
  { name: "PMS 101 C",        hex: "#F7E859" },
  { name: "PMS 102 C",        hex: "#FEDD00" },
  { name: "PMS 103 C",        hex: "#C9A800" },
  { name: "PMS 104 C",        hex: "#A28900" },
  { name: "PMS 105 C",        hex: "#7A6800" },
  { name: "PMS 106 C",        hex: "#F8E024" },
  { name: "PMS 107 C",        hex: "#F6D800" },
  { name: "PMS 108 C",        hex: "#F4CE00" },
  { name: "PMS 109 C",        hex: "#F0C000" },
  { name: "PMS 110 C",        hex: "#D6A800" },
  { name: "PMS 111 C",        hex: "#AA8200" },
  { name: "PMS 112 C",        hex: "#887200" },
  { name: "PMS 113 C",        hex: "#FBE04B" },
  { name: "PMS 114 C",        hex: "#FADA3B" },
  { name: "PMS 115 C",        hex: "#FAD220" },
  { name: "PMS 116 C",        hex: "#FFBE00" },
  { name: "PMS 117 C",        hex: "#C9930C" },
  { name: "PMS 118 C",        hex: "#A07400" },
  { name: "PMS 119 C",        hex: "#7D5B00" },
  { name: "PMS 120 C",        hex: "#FED980" },
  { name: "PMS 121 C",        hex: "#FDCF61" },
  { name: "PMS 122 C",        hex: "#FDC436" },
  { name: "PMS 123 C",        hex: "#FFB81C" },
  { name: "PMS 124 C",        hex: "#EDA10A" },
  { name: "PMS 125 C",        hex: "#C48200" },
  { name: "PMS 126 C",        hex: "#9E6E00" },
  { name: "PMS 127 C",        hex: "#F7DE9A" },
  { name: "PMS 128 C",        hex: "#F7D47A" },
  { name: "PMS 129 C",        hex: "#F6C956" },
  { name: "PMS 130 C",        hex: "#F4B223" },
  { name: "PMS 131 C",        hex: "#D99000" },
  { name: "PMS 132 C",        hex: "#A87100" },
  { name: "PMS 133 C",        hex: "#7B5200" },
  { name: "PMS 134 C",        hex: "#FECB8B" },
  { name: "PMS 135 C",        hex: "#FEBF74" },
  { name: "PMS 136 C",        hex: "#FEAF55" },
  { name: "PMS 137 C",        hex: "#FFA023" },
  { name: "PMS 138 C",        hex: "#E07B00" },
  { name: "PMS 139 C",        hex: "#AE6100" },
  { name: "PMS 140 C",        hex: "#7F4700" },
  { name: "PMS 141 C",        hex: "#FAD199" },
  { name: "PMS 142 C",        hex: "#F9BF78" },
  { name: "PMS 143 C",        hex: "#F9AB51" },
  { name: "PMS 144 C",        hex: "#F68B1F" },
  { name: "PMS 145 C",        hex: "#D4710D" },
  { name: "PMS 146 C",        hex: "#A45A0B" },
  { name: "PMS 147 C",        hex: "#744200" },
  { name: "PMS 148 C",        hex: "#FCD6A4" },
  { name: "PMS 149 C",        hex: "#FDC48A" },
  { name: "PMS 150 C",        hex: "#FCB269" },
  { name: "PMS 151 C",        hex: "#FF7F00" },
  { name: "PMS 152 C",        hex: "#DC6B00" },
  { name: "PMS 153 C",        hex: "#B05600" },
  { name: "PMS 154 C",        hex: "#824200" },
  { name: "PMS 155 C",        hex: "#F5D9B1" },
  { name: "PMS 156 C",        hex: "#F5C897" },
  { name: "PMS 157 C",        hex: "#F5B279" },
  { name: "PMS 158 C",        hex: "#F06A00" },
  { name: "PMS 159 C",        hex: "#C85600" },
  { name: "PMS 160 C",        hex: "#994500" },
  { name: "PMS 161 C",        hex: "#6E3600" },
  { name: "PMS 162 C",        hex: "#F9CDBA" },
  { name: "PMS 163 C",        hex: "#F8B49D" },
  { name: "PMS 164 C",        hex: "#F79579" },
  { name: "PMS 165 C",        hex: "#FF6720" },
  { name: "PMS 166 C",        hex: "#E84C00" },
  { name: "PMS 167 C",        hex: "#C04000" },
  { name: "PMS 168 C",        hex: "#7A2C00" },
  { name: "PMS 169 C",        hex: "#FAC4B0" },
  { name: "PMS 170 C",        hex: "#F7A98F" },
  { name: "PMS 171 C",        hex: "#F48566" },
  { name: "PMS 172 C",        hex: "#F15A22" },
  { name: "PMS 173 C",        hex: "#D4481A" },
  { name: "PMS 174 C",        hex: "#9C2900" },
  { name: "PMS 175 C",        hex: "#6E2000" },
  { name: "PMS 176 C",        hex: "#F8B5B4" },
  { name: "PMS 177 C",        hex: "#F69493" },
  { name: "PMS 178 C",        hex: "#F46F6E" },
  { name: "PMS 179 C",        hex: "#E0311E" },
  { name: "PMS 180 C",        hex: "#C42B1C" },
  { name: "PMS 181 C",        hex: "#7A2018" },
  { name: "PMS 182 C",        hex: "#F9C8C8" },
  { name: "PMS 183 C",        hex: "#F8AAAD" },
  { name: "PMS 184 C",        hex: "#F7858E" },
  { name: "PMS 185 C",        hex: "#E31837" },
  { name: "PMS 186 C",        hex: "#C8102E" },
  { name: "PMS 187 C",        hex: "#A6192E" },
  { name: "PMS 188 C",        hex: "#78172B" },
  { name: "PMS 189 C",        hex: "#FAB6C0" },
  { name: "PMS 190 C",        hex: "#F999AA" },
  { name: "PMS 191 C",        hex: "#F5758B" },
  { name: "PMS 192 C",        hex: "#FF0033" },
  { name: "PMS 193 C",        hex: "#D50032" },
  { name: "PMS 194 C",        hex: "#9B2335" },
  { name: "PMS 195 C",        hex: "#6E1828" },
  { name: "PMS 196 C",        hex: "#F8C8D0" },
  { name: "PMS 197 C",        hex: "#F8AABC" },
  { name: "PMS 198 C",        hex: "#F47E9A" },
  { name: "PMS 199 C",        hex: "#D5003F" },
  { name: "PMS 200 C",        hex: "#BA0C2F" },
  { name: "PMS 201 C",        hex: "#96172E" },
  { name: "PMS 202 C",        hex: "#6F1630" },
  { name: "PMS 210 C",        hex: "#F9A8C5" },
  { name: "PMS 211 C",        hex: "#F887B9" },
  { name: "PMS 212 C",        hex: "#F560A4" },
  { name: "PMS 213 C",        hex: "#E5007D" },
  { name: "PMS 214 C",        hex: "#CE006C" },
  { name: "PMS 215 C",        hex: "#A70055" },
  { name: "PMS 216 C",        hex: "#7A1246" },
  { name: "PMS 217 C",        hex: "#F3B8D3" },
  { name: "PMS 218 C",        hex: "#F091BF" },
  { name: "PMS 219 C",        hex: "#EA4F9C" },
  { name: "PMS 220 C",        hex: "#C2006F" },
  { name: "PMS 221 C",        hex: "#AB0066" },
  { name: "PMS 222 C",        hex: "#80134B" },
  { name: "PMS 223 C",        hex: "#F4B3D5" },
  { name: "PMS 224 C",        hex: "#F090C7" },
  { name: "PMS 225 C",        hex: "#E85EAE" },
  { name: "PMS 226 C",        hex: "#DF007C" },
  { name: "PMS 227 C",        hex: "#C40069" },
  { name: "PMS 228 C",        hex: "#9E0057" },
  { name: "PMS 229 C",        hex: "#78184A" },
  { name: "PMS 230 C",        hex: "#F6BADB" },
  { name: "PMS 231 C",        hex: "#F29ED3" },
  { name: "PMS 232 C",        hex: "#ED7ABD" },
  { name: "PMS 233 C",        hex: "#CE0070" },
];

export default function PantoneColorPicker() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const { dark } = useTheme();
  const panelRef = useRef(null);
  const btnRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleCopy = (hex) => {
    navigator.clipboard.writeText(hex).catch(() => {});
    clearTimeout(timerRef.current);
    setToast(hex);
    timerRef.current = setTimeout(() => setToast(null), 1800);
  };

  return (
    <>
      <style>{`
        /* ── Dark theme variables ── */
        [data-pc-theme="dark"] {
          --pc-panel:      #13131a;
          --pc-bdr:        rgba(255,255,255,0.08);
          --pc-hover:      rgba(255,255,255,0.04);
          --pc-text:       #ffffff;
          --pc-sub:        rgba(255,255,255,0.38);
          --pc-btn-bg:     rgba(255,255,255,0.04);
          --pc-btn-bdr:    rgba(255,255,255,0.10);
         --pc-icon: #07A626;
          --pc-shadow:     0 8px 32px rgba(0,0,0,0.55);
          --pc-toast-bg:   #1a1a24;
        }
        /* ── Light theme variables ── */
        [data-pc-theme="light"] {
          --pc-panel:      #ffffff;
          --pc-bdr:        rgba(0,0,0,0.09);
          --pc-hover:      rgba(0,0,0,0.04);
          --pc-text:       #0a0a14;
          --pc-sub:        rgba(0,0,0,0.38);
          --pc-btn-bg:     rgba(255,255,255,0.85);
          --pc-btn-bdr:    rgba(0,0,0,0.10);
        --pc-icon: #07A626;
          --pc-shadow:     0 8px 32px rgba(0,0,0,0.13);
          --pc-toast-bg:   #ffffff;
        }

        /* ── Floating wrapper (fixed, middle-right) ── */
        .pc-float {
          position: fixed;
          right:2px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        /* ── Trigger button ── */
        .pc-btn {
         width: 52px;      
  height: 52px;     
  border-radius: 16px; 
          background: var(--pc-btn-bg);
          border: 1px solid var(--pc-btn-bdr);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--pc-icon);
          box-shadow: var(--pc-shadow);
          transition: transform .15s, border-color .2s, box-shadow .2s, color .3s;
          flex-shrink: 0;
        }
        .pc-btn:hover {
          transform: scale(1.06);
          border-color: var(--pc-icon);
        }

        /* ── Color panel ── */
        .pc-panel {
          position: absolute;
          right: 54px;
          top: 50%;
          transform: translateY(-50%);
          width: 240px;
          background: var(--pc-panel);
          border: 1px solid var(--pc-bdr);
          border-radius: 14px;
          z-index: 1001;
          overflow: hidden;
          box-shadow: var(--pc-shadow);
          animation: pc-slide .18s cubic-bezier(.22,1,.36,1);
        }
        @keyframes pc-slide {
          from { opacity: 0; transform: translateY(-50%) translateX(8px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }

        /* ── Panel header ── */
        .pc-header {
          padding: 10px 14px 9px;
          border-bottom: 1px solid var(--pc-bdr);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pc-header-title {
          font-size: 10px;
          font-weight: 600;
          color: var(--pc-sub);
          letter-spacing: .7px;
          font-family: 'Sora', sans-serif;
          text-transform: uppercase;
        }
        .pc-close-btn {
          width: 20px;
          height: 20px;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--pc-sub);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          padding: 0;
          transition: color .15s, background .15s;
        }
        .pc-close-btn:hover {
          color: var(--pc-text);
          background: var(--pc-hover);
        }

        /* ── Scrollable list ── */
        .pc-list {
          max-height: 320px;
          overflow-y: auto;
          padding: 4px 0;
        }
        .pc-list::-webkit-scrollbar        { width: 3px; }
        .pc-list::-webkit-scrollbar-track  { background: transparent; }
        .pc-list::-webkit-scrollbar-thumb  { background: var(--pc-bdr); border-radius: 2px; }

        /* ── Each color row ── */
        .pc-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
          cursor: pointer;
          transition: background .1s;
        }
        .pc-item:hover { background: var(--pc-hover); }
        .pc-swatch {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          flex-shrink: 0;
          border: 1px solid rgba(128,128,128,0.15);
        }
        .pc-name {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--pc-text);
          line-height: 1.25;
          font-family: 'Sora', sans-serif;
        }
        .pc-hex {
          font-size: 10.5px;
          color: var(--pc-sub);
          font-family: monospace;
        }

        /* ── Toast ── */
        .pc-toast {
          position: fixed;
          bottom: 28px;
          right: 74px;
          background: var(--pc-toast-bg);
          border: 1px solid var(--pc-bdr);
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 12px;
          color: var(--pc-text);
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: var(--pc-shadow);
          pointer-events: none;
          z-index: 2000;
          animation: pc-toast-in .2s ease;
          font-family: 'Sora', sans-serif;
        }
        @keyframes pc-toast-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pc-toast-dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          flex-shrink: 0;
        }
      `}</style>

      {/* Fixed floating wrapper */}
      <div data-pc-theme={dark ? "dark" : "light"} className="pc-float">

        {/* Trigger button */}
        <button
          ref={btnRef}
          className="pc-btn"
          onClick={() => setOpen((o) => !o)}
          title="Pantone Colors"
          aria-label="Open Pantone color picker"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="13.5" cy="6.5"  r="2.1" fill="currentColor" stroke="none" opacity=".9" />
            <circle cx="17.8" cy="10.8" r="1.9" fill="currentColor" stroke="none" opacity=".9" />
            <circle cx="8.2"  cy="7.2"  r="1.8" fill="currentColor" stroke="none" opacity=".9" />
            <circle cx="6.2"  cy="12.5" r="1.7" fill="currentColor" stroke="none" opacity=".9" />
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.49C10.696 21.63 10 20.643 10 19.5c0-1.657 1.343-3 3-3h.5c2.485 0 4.5-2.015 4.5-4.5 0-.828-.224-1.604-.618-2.274" />
          </svg>
        </button>

        {/* Color panel */}
        {open && (
          <div ref={panelRef} className="pc-panel">
            <div className="pc-header">
              <span className="pc-header-title">All Pantone Colors (133)</span>
              <button
                className="pc-close-btn"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6"  x2="6"  y2="18" />
                  <line x1="6"  y1="6"  x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="pc-list">
              {PANTONE_COLORS.map(({ name, hex }) => (
                <div
                  key={name}
                  className="pc-item"
                  onClick={() => handleCopy(hex)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleCopy(hex)}
                >
                  <div className="pc-swatch" style={{ background: hex }} />
                  <div>
                    <div className="pc-name">{name}</div>
                    <div className="pc-hex">{hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          data-pc-theme={dark ? "dark" : "light"}
          className="pc-toast"
        >
          <div className="pc-toast-dot" style={{ background: toast }} />
          Copied {toast}
        </div>
      )}
    </>
  );
}