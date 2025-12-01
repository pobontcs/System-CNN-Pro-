import { useState, useEffect } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";

// --- INLINE HELPERS (Replaces ../lib/auth) ---
const KEY = "cc_token";

function setToken(t) {
  localStorage.setItem(KEY, t);
}

function isAuthed() {
  return !!localStorage.getItem(KEY);
}

// --- INLINE COMPONENTS (Replaces ../components/Layout/Nav) ---
function Nav() {
  return (
    <nav className="bg-white border-b h-14 flex items-center px-4 md:px-6 shadow-sm sticky top-0 z-50">
      <Link to="/" className="font-bold text-xl text-green-600 flex items-center gap-2">
        <span>🌱</span> Smart CropCare
      </Link>
      <div className="ml-auto flex gap-4 text-sm font-medium text-gray-600">
        <Link to="/" className="hover:text-green-600">Home</Link>
        <Link to="/signup" className="hover:text-green-600">Sign Up</Link>
      </div>
    </nav>
  );
}

// --- MAIN LOGIN COMPONENT ---
export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  // Redirect if already logged in
  if (isAuthed()) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!email || !pw) {
      setErr("Please enter email and password");
      return;
    }

    try {
      // Call Django Login API
      const res = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email, password: pw }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || data.message || "Login failed");
        return;
      }

      // --- SUCCESS ---
      
      // 1. Set Auth Token
      setToken("session-active");
      
      // 2. Save User Data to LocalStorage
      // We map 'id' from backend to 'AcNo' for frontend consistency
      const userPayload = {
        AcNo: data.id,
        email: email, 
        name: data.name , // Fallback if name isn't sent
      };
      
      localStorage.setItem("user", JSON.stringify(userPayload));

      // 3. Redirect to Dashboard
      nav("/dashboard");

    } catch (error) {
      console.error("Login error:", error);
      setErr("Server error. Is Django running?");
    }
  }

  return (
    <>
      <Nav />
      <section className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-[#F9F7F3] px-4">
        <div className="w-full max-w-md rounded-2xl border bg-[#F1EDE8] p-6 shadow">
          <div className="flex flex-col items-center text-center">
            <img src="/Image/logo.png" alt="Smart CropCare logo" className="h-20 w-20 object-contain mb-2" />
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-gray-600">Log in to continue</p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                className="w-full rounded-md border p-2 bg-white/70"
                placeholder="you@farmmail.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                className="w-full rounded-md border p-2 bg-white/70"
                placeholder="Your password"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {err && <div className="text-sm text-rose-600">{err}</div>}

            <button
              type="submit"
              className="w-full rounded-lg bg-[#4CAF50] hover:bg-[#43A047] text-white py-2"
            >
              Log in
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-700">
            Dont have an account?{" "}
            <Link to="/signup" className="text-[#4CAF50] hover:underline">Sign up</Link>
          </div>
        </div>
      </section>
    </>
  );
}