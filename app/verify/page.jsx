"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    // Not hydrated yet — stay on loading
    if (token === null) return;

    // Empty token param e.g. ?token=
    if (token === "") {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    const verifyUser = async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (data.status) {
          setStatus("success");
          setMessage("Email verified successfully!");
        } else if (data.alreadyUsed) {
          // Token was nulled after first use — not an error, just already done
          setStatus("already");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    verifyUser();
  }, []); // must include token so it re-runs after hydration

  const messageColor =
    status === "loading" ? "#94a3b8" :
    status === "success" ? "#22c55e" :
    status === "already" ? "#f59e0b" : // amber — informational, not an error
    "#ef4444";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Email Verification</h1>
        {status === "loading" && <div style={styles.spinner} />}
        {(status === "success" || status === "already") && (
          <button style={styles.button} onClick={() => router.push("/login")}>
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Email Verification</h1>
          <p style={{ ...styles.message, color: "#94a3b8" }}>Verifying your email...</p>
          <div style={styles.spinner} />
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}

const styles = {
  container: {
    height: "100vh",
    backgroundColor: "#000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    textAlign: "center",
    padding: "40px",
    borderRadius: "10px",
    backgroundColor: "#111",
    boxShadow: "0 0 20px rgba(0,255,0,0.2)",
    minWidth: 300,
  },
  title: { color: "#fff", marginBottom: "20px" },
  message: { fontSize: "18px", marginBottom: "20px" },
  button: {
    padding: "10px 20px",
    backgroundColor: "#22c55e",
    color: "#000",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  spinner: {
    width: 28,
    height: 28,
    border: "3px solid #333",
    borderTop: "3px solid #22c55e",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto",
  },
};