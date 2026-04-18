"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

// ✅ Split into inner component that uses useSearchParams
function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    if (!token) {
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
          setMessage("Successfully verified 🎉");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Something went wrong");
      }
    };

    verifyUser();
  }, [token]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Email Verification</h1>
        <p style={{ ...styles.message, color: status === "success" ? "#22c55e" : "#ef4444" }}>
          {message}
        </p>
        {status === "success" && (
          <button style={styles.button} onClick={() => router.push("/login")}>
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}

// ✅ Outer component wraps with Suspense
export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Email Verification</h1>
          <p style={{ ...styles.message, color: "#aaa" }}>Verifying...</p>
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
};