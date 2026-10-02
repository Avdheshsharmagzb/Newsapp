import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Newspaper as NewspaperIcon, FileText, Tags,
  Users, Image, MessageSquare, BarChart3, Menu, X, LayoutGrid
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { to: "/", label: "मुख्य डैशबोर्ड", icon: LayoutDashboard, testid: "nav-overview" },
  { to: "/articles", label: "समाचार प्रबंधन", icon: FileText, testid: "nav-articles" },
  { to: "/layout", label: "लेआउट पैनल (८ पेज)", icon: LayoutGrid, testid: "nav-layout" },
  { to: "/newspaper", label: "अखबार व्यूअर", icon: NewspaperIcon, testid: "nav-newspaper" },
  { to: "/categories", label: "श्रेणियाँ", icon: Tags, testid: "nav-categories" },
  { to: "/authors", label: "लेखक / संवाददाता", icon: Users, testid: "nav-authors" },
  { to: "/media", label: "मीडिया लाइब्रेरी", icon: Image, testid: "nav-media" },
  { to: "/comments", label: "टिप्पणी समीक्षा", icon: MessageSquare, testid: "nav-comments" },
  { to: "/analytics", label: "रिपोर्ट / एनालिटिक्स", icon: BarChart3, testid: "nav-analytics" },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 h-screen w-72 shrink-0 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border)" }}
        data-testid="sidebar"
      >
        <div className="px-6 py-6 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-news font-black text-2xl text-white"
                 style={{ background: "var(--jg-red)" }}>द</div>
            <div>
              <h1 className="font-news font-black text-xl leading-none text-white">दैनिक जागरण</h1>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>कॉमन CMS डैशबोर्ड</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                data-testid={n.testid}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `jg-nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    isActive ? "text-white" : "text-slate-300 hover:text-white"
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? "var(--jg-red)" : "transparent",
                })}
              >
                <Icon size={19} />
                <span>{n.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          वेबसाइट + अखबार · एक डेटाबेस
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-5 py-4 lg:hidden"
                style={{ background: "rgba(15,23,42,.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)" }}>
          <button data-testid="menu-toggle" onClick={() => setOpen(!open)} className="text-white p-1">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="font-news font-black text-lg text-white">दैनिक जागरण CMS</span>
        </header>
        <div className="p-5 sm:p-7 lg:p-9" key={loc.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
