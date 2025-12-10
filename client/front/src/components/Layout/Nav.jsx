import { Link, useLocation, useNavigate } from "react-router-dom";
import { clsx } from "../../lib/utils";
import { clearToken, isAuthed } from "../../lib/auth";

const authLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/health", label: "Health Check" }, // renamed
  { to: "/map", label: "Map" },
  { to: "/history", label: "History" },
];

export default function Nav() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const authed = isAuthed();
 

  return (
    <nav className="sticky top-0 z-20 border-b bg-[#F1EDE8]/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-3 flex gap-4 items-center">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
        <img src="/Image/logo.png" alt=" Care company logo featuring crop monitoring iconography" className="h-10 w-10 object-contain" />
            Crop Vision
        </Link>
       

        <div className="flex-1" />
        {authed ? (
          <>
            <div className="flex gap-2 text-sm">
              {authLinks.map(l => (
                <Link key={l.to}
                  to={l.to}
                  className={clsx(
                    "px-3 py-1.5 rounded-md hover:bg-gray-100",
                    pathname === l.to && "bg-gray-900 text-white hover:bg-gray-900"
                  )}>
                  {l.label}
                </Link>
              ))}
            </div>
            <button
              onClick={() => { clearToken(); nav("/"); }}
              className="ml-3 rounded-md bg-rose-600 px-3 py-1.5 text-white text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex gap-2 text-sm">
            <Link to="/login" className="px-3 py-1.5 rounded-md hover:bg-gray-100">Login</Link>
            <Link to="/signup" className="px-3 py-1.5 rounded-md bg-gray-900 text-white">Sign up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
