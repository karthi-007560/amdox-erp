
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./AppLayout.css";

type AppLayoutProps = {
  children: ReactNode;
};

type Appearance = {
  theme: string;
  mode: "light" | "dark";
  style: string;
};

const STORAGE_KEY = "intellmeet_appearance";

const navigation = [
  { label: "Dashboard", path: "/" },
  { label: "Meetings", path: "/meetings" },
  { label: "Tasks", path: "/tasks" },
  { label: "Workspace", path: "/workspace" },
  { label: "Analytics", path: "/analytics" },
  { label: "Settings", path: "/settings" },
];

function readSavedAppearance(): Appearance {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      return {
        theme: parsed.theme || "indigo",
        mode: parsed.mode === "dark" ? "dark" : "light",
        style: parsed.style || "modern",
      };
    }
  } catch (error) {
    console.error("Could not restore appearance:", error);
  }

  return { theme: "indigo", mode: "light", style: "modern" };
}

function applySavedAppearance(appearance: Appearance) {
  const root = document.documentElement;

  root.dataset.theme = appearance.mode;
  root.dataset.mode = appearance.mode;
  root.dataset.accent = appearance.theme;
  root.dataset.style = appearance.style;
  root.style.colorScheme = appearance.mode;

  const colors: Record<string, string> = {
    indigo: "#6366f1",
    blue: "#2563eb",
    green: "#059669",
    purple: "#8b5cf6",
    orange: "#f97316",
    rose: "#e11d48",
  };

  const accent = colors[appearance.theme] || colors.indigo;

  root.style.setProperty("--primary-color", accent);
  root.style.setProperty("--primary-hover", accent);
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const location = useLocation();

  useEffect(() => {
    // Restore the saved theme on startup.
    applySavedAppearance(readSavedAppearance());

    // React to settings only after SettingsPage saves them.
    const handleAppearanceUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<Appearance>;

      if (customEvent.detail) {
        applySavedAppearance(customEvent.detail);
      } else {
        applySavedAppearance(readSavedAppearance());
      }
    };

    window.addEventListener(
      "intellmeet_appearance_updated",
      handleAppearanceUpdate
    );

    return () => {
      window.removeEventListener(
        "intellmeet_appearance_updated",
        handleAppearanceUpdate
      );
    };
  }, []);

  const currentPage =
    navigation.find((item) => item.path === location.pathname)?.label ||
    location.pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
    "Dashboard";

  const email =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    "";

  const firstName =
    email.split("@")[0]?.split(/[._\s-]/)[0] || "User";

  const avatarLetter = firstName.charAt(0).toUpperCase();

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`app-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}
      >
        <div className="app-brand">
          <div className="brand-mark">IM</div>
          <div>
            <strong>IntellMeet</strong>
            <span>Smart collaboration</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
              onClick={() => {
                setSidebarOpen(false);
                setSearchText("");
                setSearchOpen(false);
              }}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <strong>Need help?</strong>
            <p>Explore your workspace and get things done.</p>
          </div>

          <div className="sidebar-user">
            <div className="user-avatar">{avatarLetter}</div>
            <div className="user-details">
              <strong>{firstName}</strong>
              <span>{email || "Logged-in user"}</span>
            </div>
            <span className="user-menu">···</span>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen((previous) => !previous)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>

          <div className="topbar-breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{currentPage}</strong>
          </div>

          <div className="topbar-actions">
            <label
              className={`topbar-search ${searchOpen ? "search-open" : ""}`}
            >
              <button
                type="button"
                className="search-toggle"
                aria-label="Toggle search"
                onClick={() => {
                  setSearchOpen((previous) => !previous);
                  setSearchText("");
                }}
              >
                🔍
              </button>

              {searchOpen && (
                <input
                  autoFocus
                  type="search"
                  aria-label={`Search ${currentPage}`}
                  placeholder={`Search ${currentPage.toLowerCase()}...`}
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setSearchText("");
                      setSearchOpen(false);
                    }
                  }}
                />
              )}
            </label>

            <button
              className="notification-button"
              aria-label="Notifications"
              onClick={() => alert("You're all caught up!")}
            >
              🔔<span />
            </button>

            <div className="topbar-avatar" title={email || firstName}>
              {avatarLetter}
            </div>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
