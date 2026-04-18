"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

export default function Login() {
  const { dark } = useTheme();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("login"); // "login" | "signup"

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const {data: session } = useSession();


  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!loginEmail || !loginPassword) { setLoginError("Please fill in all fields."); return; }
    setLoginLoading(true);
    try {
       const res = await signIn("credentials", {
      redirect: false,
      email: loginEmail,
      password: loginPassword,
    });
    console.log(res)
    if (res.status!==200) throw new Error(data.error || "Login failed");
      router.push("/");
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError("");
    if (!signupName || !signupEmail || !signupPassword || !signupConfirm) { setSignupError("Please fill in all fields."); return; }
    if (signupPassword !== signupConfirm) { setSignupError("Passwords do not match."); return; }
    if (signupPassword.length < 6) { setSignupError("Password must be at least 6 characters."); return; }
    setSignupLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setSignupSuccess(true);
    } catch (err) {
      setSignupError(err.message);
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        [data-theme="dark"] {
          --bg:           #09090f;
          --surface:      #111118;
          --surface2:     #18181f;
          --border:       rgba(255,255,255,0.08);
          --border2:      rgba(255,255,255,0.14);
          --heading:      #ffffff;
          --body:         rgba(255,255,255,0.7);
          --muted:        rgba(255,255,255,0.38);
          --dot:          rgba(255,255,255,0.035);
          --input-bg:     rgba(255,255,255,0.04);
          --input-bdr:    rgba(255,255,255,0.1);
          --input-clr:    #ffffff;
          --input-ph:     rgba(255,255,255,0.28);
          --card-shadow:  0 24px 60px rgba(0,0,0,0.5);
          --glow:         rgba(7,166,38,0.12);
        }
        [data-theme="light"] {
          --bg:           #f4f4f8;
          --surface:      #ffffff;
          --surface2:     #f8f8fc;
          --border:       rgba(0,0,0,0.08);
          --border2:      rgba(0,0,0,0.13);
          --heading:      #0a0a14;
          --body:         rgba(0,0,0,0.65);
          --muted:        rgba(0,0,0,0.38);
          --dot:          rgba(0,0,0,0.035);
          --input-bg:     rgba(255,255,255,0.95);
          --input-bdr:    rgba(0,0,0,0.12);
          --input-clr:    #0a0a14;
          --input-ph:     rgba(0,0,0,0.28);
          --card-shadow:  0 24px 60px rgba(0,0,0,0.1);
          --glow:         rgba(7,166,38,0.07);
        }

        .auth-page {
          min-height: 100vh;
          background: var(--bg);
          font-family: 'Sora', sans-serif;
          display: flex;
          flex-direction: column;
          transition: background 0.35s;
          position: relative;
          overflow: hidden;
        }

        /* Dot grid */
        .auth-dot-grid {
          position: fixed; inset: 0;
          background-image: radial-gradient(var(--dot) 1px, transparent 1px);
          background-size: 30px 30px;
          pointer-events: none; z-index: 0;
        }

        /* Ambient glow blobs */
        .auth-glow {
          position: fixed; pointer-events: none; z-index: 0;
        }
        .auth-glow-1 {
          top: -120px; left: 50%;
          transform: translateX(-50%);
          width: 600px; height: 500px;
          background: radial-gradient(ellipse, rgba(7,166,38,0.13) 0%, transparent 65%);
          border-radius: 50%;
          animation: gblob 7s ease-in-out infinite;
        }
        .auth-glow-2 {
          bottom: -100px; right: -80px;
          width: 400px; height: 400px;
          background: radial-gradient(ellipse, rgba(7,166,38,0.07) 0%, transparent 65%);
          border-radius: 50%;
          animation: gblob 9s ease-in-out infinite reverse;
        }
        [data-theme="light"] .auth-glow-1 { background: radial-gradient(ellipse, rgba(7,166,38,0.08) 0%, transparent 65%); }
        [data-theme="light"] .auth-glow-2 { background: radial-gradient(ellipse, rgba(7,166,38,0.05) 0%, transparent 65%); }

        @keyframes gblob {
          0%,100% { transform: translateX(-50%) scale(1); opacity: 1; }
          50%      { transform: translateX(-50%) scale(1.08); opacity: 0.75; }
        }

        .space { height: 80px; }

        /* Main centered container */
        .auth-center {
          position: relative; z-index: 1;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px 60px;
        }

        /* Card */
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          box-shadow: var(--card-shadow);
          overflow: hidden;
          position: relative;
        }

        /* Top accent line */
        .auth-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #07A626, #4ade80, #07A626, transparent);
          background-size: 200% 100%;
          animation: shimmer-line 3s linear infinite;
        }
        @keyframes shimmer-line {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }

        /* Card header / logo */
        .auth-logo-area {
          padding: 32px 32px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--border);
        }
        .auth-logo-icon {
          width: 52px; height: 52px;
          background: rgba(7,166,38,0.12);
          border: 1.5px solid rgba(7,166,38,0.25);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 4px;
        }
        .auth-logo-title {
          font-size: 20px; font-weight: 900;
          color: var(--heading);
          letter-spacing: -0.5px;
        }
        .auth-logo-sub {
          font-size: 12px; color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          text-align: center;
        }

        /* Tab switcher */
        .auth-tabs {
          display: flex;
          margin: 0;
          border-bottom: 1px solid var(--border);
        }
        .auth-tab {
          flex: 1;
          padding: 14px 0;
          background: none;
          border: none;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--muted);
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          position: relative;
        }
        .auth-tab::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 20%; right: 20%;
          height: 2px;
          background: #07A626;
          border-radius: 2px;
          transform: scaleX(0);
          transition: transform 0.25s cubic-bezier(.22,1,.36,1);
        }
        .auth-tab.active {
          color: var(--heading);
          background: rgba(7,166,38,0.04);
        }
        .auth-tab.active::after { transform: scaleX(1); }

        /* Form body */
        .auth-body {
          padding: 26px 28px 28px;
        }

        /* Input group */
        .input-group {
          margin-bottom: 14px;
        }
        .input-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--muted);
          pointer-events: none;
          flex-shrink: 0;
        }
        .auth-input {
          width: 100%;
          padding: 11px 14px 11px 38px;
          background: var(--input-bg);
          border: 1.5px solid var(--input-bdr);
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: var(--input-clr);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          caret-color: #07A626;
        }
        .auth-input::placeholder { color: var(--input-ph); }
        .auth-input:focus {
          border-color: rgba(7,166,38,0.7);
          box-shadow: 0 0 0 3px rgba(7,166,38,0.1);
        }
        .pw-toggle {
          position: absolute;
          right: 11px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--muted);
          display: flex; align-items: center;
          padding: 2px;
          transition: color 0.2s;
        }
        .pw-toggle:hover { color: var(--body); }

        /* Error pill */
        .auth-error {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 12px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.22);
          border-radius: 8px;
          font-size: 11.5px;
          color: #f87171;
          margin-bottom: 14px;
          font-family: 'DM Sans', sans-serif;
          animation: fadeIn .2s ease;
        }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }

        /* Forgot password */
        .forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -6px;
          margin-bottom: 16px;
        }
        .forgot-link {
          font-size: 11px;
          color: var(--muted);
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: #07A626; }

        /* Terms row */
        .terms-row {
          display: flex; align-items: flex-start; gap: 8px;
          margin-bottom: 16px;
        }
        .terms-check {
          width: 14px; height: 14px;
          margin-top: 1px; flex-shrink: 0;
          accent-color: #07A626;
          cursor: pointer;
        }
        .terms-text {
          font-size: 11px;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          line-height: 1.5;
        }
        .terms-text a { color: #07A626; text-decoration: none; }
        .terms-text a:hover { text-decoration: underline; }

        /* Submit button */
        .auth-btn {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 700;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg, #07A626, #059c1f);
          color: #fff;
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 4px;
        }
        .auth-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .auth-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        /* Divider */
        .auth-divider {
          display: flex; align-items: center; gap: 10px;
          margin: 18px 0;
        }
        .auth-divider-line {
          flex: 1; height: 1px; background: var(--border);
        }
        .auth-divider-text {
          font-size: 10px; font-weight: 700;
          color: var(--muted);
          text-transform: uppercase; letter-spacing: 0.6px;
        }

        /* Social buttons */
        .social-row {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .social-btn {
          padding: 10px 12px;
          border-radius: 10px;
          border: 1.5px solid var(--border2);
          background: var(--input-bg);
          display: flex; align-items: center; justify-content: center; gap: 7px;
          cursor: pointer;
          font-family: 'Sora', sans-serif;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--body);
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .social-btn:hover {
          border-color: rgba(7,166,38,0.35);
          background: rgba(7,166,38,0.05);
          transform: translateY(-1px);
        }

        /* Footer note */
        .auth-footer-note {
          text-align: center;
          padding: 0 28px 24px;
          font-size: 11.5px;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
        }
        .auth-footer-note a {
          color: #07A626;
          font-weight: 700;
          text-decoration: none;
        }
        .auth-footer-note a:hover { text-decoration: underline; }

        /* Success state */
        .signup-success {
          padding: 32px 28px;
          display: flex; flex-direction: column;
          align-items: center; gap: 12px;
          text-align: center;
        }
        .success-icon {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: rgba(7,166,38,0.12);
          border: 1.5px solid rgba(7,166,38,0.3);
          display: flex; align-items: center; justify-content: center;
          color: #07A626;
          animation: pop .4s cubic-bezier(.22,1,.36,1);
        }
        @keyframes pop {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        .success-title {
          font-size: 17px; font-weight: 800;
          color: var(--heading); letter-spacing: -0.3px;
        }
        .success-sub {
          font-size: 12.5px; color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          line-height: 1.6; max-width: 280px;
        }

        /* Password strength bar */
        .pw-strength {
          margin-top: 6px;
          display: flex; gap: 4px;
        }
        .pw-bar {
          height: 3px; flex: 1; border-radius: 2px;
          background: var(--border2);
          transition: background 0.3s;
        }
        .pw-bar.filled-weak   { background: #ef4444; }
        .pw-bar.filled-medium { background: #f59e0b; }
        .pw-bar.filled-strong { background: #07A626; }

        /* Anim */
        .anim { opacity: 0; transform: translateY(16px);
          transition: opacity .5s cubic-bezier(.22,1,.36,1), transform .5s cubic-bezier(.22,1,.36,1); }
        .ready .anim { opacity: 1; transform: translateY(0); }
        .d0{transition-delay:0ms;} .d1{transition-delay:70ms;} .d2{transition-delay:140ms;}

        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        @media (max-width: 480px) {
          .auth-body { padding: 20px 18px 22px; }
          .auth-logo-area { padding: 24px 18px 18px; }
          .auth-footer-note { padding: 0 18px 20px; }
          .social-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="auth-page" data-theme={dark ? "dark" : "light"}>
        <div className="auth-dot-grid" />
        <div className="auth-glow auth-glow-1" />
        <div className="auth-glow auth-glow-2" />

        <Navbar />
        <div className="space" />

        <div className={`auth-center${ready ? " ready" : ""}`}>
          <div className="auth-card anim d0">

            {/* Logo area */}
            <div className="auth-logo-area">
              {dark? 
              <img src="/cdrlogo-dark.svg" alt="Logo" width={180} height={180} />:
              <img src="/cdrlogo-light.svg" alt="Logo" width={180} height={180} />
              }
               
          
              <div className="auth-logo-title">
                {tab === "login" ? "Welcome Back" : "Create Account"}
              </div>
              <div className="auth-logo-sub">
                {tab === "login"
                  ? "Sign in to download logos & save your favourites"
                  : "Join cdrlogo — free access to thousands of vector logos"}
              </div>
            </div>

            {/* Tab switcher */}
            <div className="auth-tabs">
              <button className={`auth-tab${tab === "login" ? " active" : ""}`} onClick={() => { setTab("login"); setLoginError(""); setSignupError(""); }}>
                Sign In
              </button>
              <button className={`auth-tab${tab === "signup" ? " active" : ""}`} onClick={() => { setTab("signup"); setLoginError(""); setSignupError(""); }}>
                Sign Up
              </button>
            </div>

            {/* ── LOGIN FORM ── */}
            {tab === "login" && (
              <div className="auth-body">
                {loginError && (
                  <div className="auth-error">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="l-email">Email Address</label>
                    <div className="input-wrap">
                      <svg className="input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <input
                        id="l-email"
                        className="auth-input"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="l-password">Password</label>
                    <div className="input-wrap">
                      <svg className="input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      <input
                        id="l-password"
                        className="auth-input"
                        type={showLoginPw ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        autoComplete="current-password"
                        style={{ paddingRight: 38 }}
                      />
                      <button type="button" className="pw-toggle" onClick={() => setShowLoginPw(v => !v)}>
                        {showLoginPw ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                

                  <button
                    type="submit"
                    className="auth-btn"
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        Signing In…
                      </>
                    ) : (
                      <>
                        Sign In
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </>
                    )}
                  </button>
                </form>

               

              
              </div>
            )}

            {/* ── SIGNUP FORM ── */}
            {tab === "signup" && (
              signupSuccess ? (
                <div className="signup-success">
                  <div className="success-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div className="success-title">Account Created!</div>
                  <div className="success-sub">Welcome to cdrlogo. Check your email to verify your account, then sign in.</div>
                  <button className="auth-btn" style={{ marginTop: 8 }} onClick={() => { setTab("login"); setSignupSuccess(false); }}>
                    Go to Sign In →
                  </button>
                </div>
              ) : (
                <div className="auth-body">
                  {signupError && (
                    <div className="auth-error">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {signupError}
                    </div>
                  )}

                  <form onSubmit={handleSignup}>
                    <div className="input-group">
                      <label className="input-label" htmlFor="s-name">Full Name</label>
                      <div className="input-wrap">
                        <svg className="input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        <input
                          id="s-name"
                          className="auth-input"
                          type="text"
                          placeholder="Your full name"
                          value={signupName}
                          onChange={e => setSignupName(e.target.value)}
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label" htmlFor="s-email">Email Address</label>
                      <div className="input-wrap">
                        <svg className="input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <input
                          id="s-email"
                          className="auth-input"
                          type="email"
                          placeholder="you@example.com"
                          value={signupEmail}
                          onChange={e => setSignupEmail(e.target.value)}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label" htmlFor="s-password">Password</label>
                      <div className="input-wrap">
                        <svg className="input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <input
                          id="s-password"
                          className="auth-input"
                          type={showSignupPw ? "text" : "password"}
                          placeholder="Min. 6 characters"
                          value={signupPassword}
                          onChange={e => setSignupPassword(e.target.value)}
                          autoComplete="new-password"
                          style={{ paddingRight: 38 }}
                        />
                        <button type="button" className="pw-toggle" onClick={() => setShowSignupPw(v => !v)}>
                          {showSignupPw ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      {/* Password strength */}
                      {signupPassword && (
                        <div className="pw-strength">
                          {[0,1,2,3].map(i => {
                            const len = signupPassword.length;
                            const strength = len < 6 ? 1 : len < 10 ? 2 : 3;
                            const cls = i < strength
                              ? strength === 1 ? "filled-weak"
                              : strength === 2 ? "filled-medium"
                              : "filled-strong"
                              : "";
                            return <div key={i} className={`pw-bar ${cls}`} />;
                          })}
                        </div>
                      )}
                    </div>

                    <div className="input-group">
                      <label className="input-label" htmlFor="s-confirm">Confirm Password</label>
                      <div className="input-wrap">
                        <svg className="input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <input
                          id="s-confirm"
                          className="auth-input"
                          type={showConfirmPw ? "text" : "password"}
                          placeholder="Repeat your password"
                          value={signupConfirm}
                          onChange={e => setSignupConfirm(e.target.value)}
                          autoComplete="new-password"
                          style={{ paddingRight: 38 }}
                        />
                        <button type="button" className="pw-toggle" onClick={() => setShowConfirmPw(v => !v)}>
                          {showConfirmPw ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="terms-row" style={{ marginTop: 4 }}>
                      <input type="checkbox" className="terms-check" id="terms" required />
                      <label htmlFor="terms" className="terms-text">
                        I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
                      </label>
                    </div>

                    <button type="submit" className="auth-btn" disabled={signupLoading}>
                      {signupLoading ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                          </svg>
                          Creating Account…
                        </>
                      ) : (
                        <>
                          Create Account
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </form>

                
                </div>
              )
            )}

            {/* Footer switch note */}
            {!signupSuccess && (
              <div className="auth-footer-note">
                {tab === "login"
                  ? <>Don't have an account? <a href="#" onClick={e => { e.preventDefault(); setTab("signup"); }}>Sign up free</a></>
                  : <>Already have an account? <a href="#" onClick={e => { e.preventDefault(); setTab("login"); }}>Sign in</a></>
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}