import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { isAuthed, setToken } from "../lib/auth";
import Nav from "../components/Layout/Nav";
// import { motion } from "framer-motion";

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    region: "",
    area: "",
    country: "",
    zip: "",
  });
  const [err, setErr] = useState("");

  if (isAuthed()) return <Navigate to="/dashboard" replace />;

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    const { name, email, password } = form;
    if (!name || !email || !password) {
      setErr("Name, email and password are required.");
      return;
    }
    // TODO: replace with real backend call to /auth/signup
    setToken("dev-local-token");
    nav("/dashboard");
  }

  return (
    <>
      <Nav />
      <section className="min-h-[calc(100vh-56px)] grid md:grid-cols-2">
        {/* Left: full-bleed image + overlay text */}
        <div className="hidden md:block relative">
          <img
            src="/Image/Hero/hero2.png"
            alt="Farmer field / crop health"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 flex items-center">
            <div className="px-10">
              <h2 className="text-white text-4xl font-extrabold drop-shadow-sm">
                Join Smart CropCare
              </h2>
              <p className="mt-3 text-white/90 max-w-md leading-relaxed drop-shadow-sm">
                Analyze leaf health with AI, visualize what the model sees, and get
                actionable treatment suggestions — all in one place.
              </p>
              <ul className="mt-4 space-y-2 text-white/90">
                <li>• Disease detection & severity</li>
                <li>• Explainable AI (Grad-CAM)</li>
                <li>• Geotagging & history</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right: form column */}
        <div className="flex items-center justify-center bg-[#F9F7F3] px-6 py-10">
          <div className="w-full max-w-md rounded-2xl border bg-[#F1EDE8] p-6 shadow">
            <div className="text-center mb-3">
              <h1 className="text-2xl font-bold">Create your account</h1>
              <p className="text-sm text-gray-600">Start your first Health Check in minutes</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Full name</label>
                <input
                  className="w-full rounded-md border p-2 bg-white/70"
                  placeholder=""
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  className="w-full rounded-md border p-2 bg-white/70"
                  placeholder=""
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  className="w-full rounded-md border p-2 bg-white/70"
                  placeholder=""
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone number</label>
                <input
                  className="w-full rounded-md border p-2 bg-white/70"
                  placeholder=""
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  autoComplete="tel"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Region / State</label>
                  <input
                    className="w-full rounded-md border p-2 bg-white/70"
                    placeholder=""
                    value={form.region}
                    onChange={(e) => update("region", e.target.value)}
                    autoComplete="address-level1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Area / City</label>
                  <input
                    className="w-full rounded-md border p-2 bg-white/70"
                    placeholder=""
                    value={form.area}
                    onChange={(e) => update("area", e.target.value)}
                    autoComplete="address-level2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input
                    className="w-full rounded-md border p-2 bg-white/70"
                    placeholder=""
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                    autoComplete="country-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP / Postal code</label>
                  <input
                    className="w-full rounded-md border p-2 bg-white/70"
                    placeholder=""
                    value={form.zip}
                    onChange={(e) => update("zip", e.target.value)}
                    autoComplete="postal-code"
                  />
                </div>
              </div>

              {err && <div className="text-sm text-rose-600">{err}</div>}

              <button
                type="submit"
                className="w-full rounded-lg bg-[#4CAF50] hover:bg-[#43A047] text-white py-2"
              >
                Create account
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-700">
              Already have an account?{" "}
              <Link to="/login" className="text-[#4CAF50] hover:underline">Log in</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
