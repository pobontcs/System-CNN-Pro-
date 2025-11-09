import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { isAuthed, setToken } from "../lib/auth";
import Nav from "../components/Layout/Nav";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  if (isAuthed()) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    // TODO: replace with real backend /auth/login
    if (!email || !pw) {
      setErr("Please enter email and password");
      return;
    }
    setToken("dev-local-token");
    nav("/dashboard");
  }

  return (
    <>
      <Nav />
      <section className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-[#F9F7F3] px-4">
        <div className="w-full max-w-md rounded-2xl border bg-[#F1EDE8] p-6 shadow">
          <div className="flex flex-col items-center text-center">
            <img src="/Image/logo.png" alt="Smart CropCare logo" className="h-50 w-50 object-contain mb-2" />
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
            Don’t have an account?{" "}
            <Link to="/signup" className="text-[#4CAF50] hover:underline">Sign up</Link>
          </div>
        </div>
      </section>
    </>
  );
}
