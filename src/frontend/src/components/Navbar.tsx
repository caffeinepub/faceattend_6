import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ScanFace, Settings, UserPlus } from "lucide-react";
import { useEffect, useRef } from "react";

const navItems = [
  { to: "/", icon: ScanFace, label: "Face Scan", ocid: "face_scan" },
  { to: "/register", icon: UserPlus, label: "Register", ocid: "register" },
  {
    to: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    ocid: "dashboard",
  },
  { to: "/settings", icon: Settings, label: "Settings", ocid: "settings" },
] as const;

export default function Navbar() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const scanLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scanLineRef.current;
    if (!el) return;
    el.style.display = "block";
    const timer = setTimeout(() => {
      if (el) el.style.display = "none";
    }, 1900);
    return () => clearTimeout(timer);
  }, []);

  return (
    // No overflow-hidden here — it clips the active underline glow at bottom
    <header
      className="sticky top-0 z-50 print:hidden"
      style={{
        background: "rgba(4, 11, 20, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(35, 230, 242, 0.22)",
        boxShadow: "0 1px 30px rgba(35, 230, 242, 0.07)",
      }}
    >
      {/* Mount scan-line sweep — clipped via own overflow, not header */}
      <div className="relative overflow-hidden h-0">
        <div
          ref={scanLineRef}
          className="navbar-scan-line absolute bottom-0 left-0 h-px w-full pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(35,230,242,0.8), transparent)",
            zIndex: 10,
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 group"
          data-ocid="nav.link"
        >
          <div
            className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center hud-glow-pulse"
            style={{
              background: "rgba(35, 230, 242, 0.08)",
              border: "1px solid rgba(35, 230, 242, 0.45)",
            }}
          >
            <ScanFace
              className="w-4 h-4"
              style={{ color: "oklch(0.80 0.18 200)" }}
            />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight">
            <span className="text-foreground">Face</span>
            <span className="font-orbitron neon-text-cyan font-semibold">
              Attend
            </span>
          </span>
          <span
            className="hidden xs:flex ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold items-center gap-1"
            style={{
              background: "rgba(69, 255, 122, 0.10)",
              border: "1px solid rgba(69, 255, 122, 0.30)",
              color: "oklch(0.72 0.22 145)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full pulse-dot"
              style={{ background: "oklch(0.72 0.22 145)" }}
            />
            LIVE
          </span>
        </Link>

        {/* Nav items */}
        <nav className="flex items-center gap-0.5">
          {navItems.map(({ to, icon: Icon, label, ocid }) => {
            const isActive =
              to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                title={label}
                data-ocid={`nav.${ocid}.link`}
                className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-w-[44px] justify-center sm:justify-start text-xs font-orbitron uppercase tracking-wider transition-colors duration-200"
                style={{
                  // Raised contrast for both states: active = full cyan, inactive = legible mid-grey
                  color: isActive
                    ? "oklch(0.80 0.18 200)"
                    : "oklch(0.72 0.04 220)",
                }}
              >
                {/* Active bg pill */}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: "rgba(35, 230, 242, 0.07)",
                      border: "1px solid rgba(35, 230, 242, 0.22)",
                    }}
                  />
                )}
                {/* Hover bg pill — only on non-active */}
                {!isActive && (
                  <span
                    className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-150"
                    style={{ background: "rgba(35, 230, 242, 0.05)" }}
                  />
                )}
                <Icon
                  className="w-4 h-4 flex-shrink-0 relative z-10"
                  style={{
                    color: isActive
                      ? "oklch(0.80 0.18 200)"
                      : "oklch(0.72 0.04 220)",
                  }}
                />
                {/* Show label on sm+ screens */}
                <span
                  className="hidden sm:inline relative z-10"
                  style={{
                    color: isActive
                      ? "oklch(0.80 0.18 200)"
                      : "oklch(0.72 0.04 220)",
                    textShadow: isActive
                      ? "0 0 12px rgba(35,230,242,0.45)"
                      : "none",
                  }}
                >
                  {label}
                </span>
                {/* Active underline — rendered OUTSIDE the rounded clip area */}
                {isActive && (
                  <span
                    className="absolute -bottom-px left-2 right-2 h-0.5 rounded-full"
                    style={{
                      background: "oklch(0.80 0.18 200)",
                      boxShadow:
                        "0 0 8px rgba(35,230,242,0.75), 0 2px 10px rgba(35,230,242,0.35)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
