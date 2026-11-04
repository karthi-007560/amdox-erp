import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  CheckSquare,
  BriefcaseBusiness,
  Users,
  BarChart3,
  Settings,
  History,
  Search,
  Menu,
} from "lucide-react";

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
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Meetings",
    path: "/meetings",
    icon: Video,
  },
  {
    label: "Tasks",
    path: "/tasks",
    icon: CheckSquare,
  },
  {
    label: "Workspace",
    path: "/workspace",
    icon: BriefcaseBusiness,
  },
  {
    label: "Team",
    path: "/team",
    icon: Users,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Meeting History",
    path: "/meeting-history",
    icon: History,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

const accentColors: Record<string, string> = {
  indigo: "#6366f1",
  blue: "#2563eb",
  green: "#059669",
  purple: "#8b5cf6",
  orange: "#f97316",
  rose: "#e11d48",
};

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

  return {
    theme: "indigo",
    mode: "light",
    style: "modern",
  };
}

function applySavedAppearance(appearance: Appearance) {
  const root = document.documentElement;

  root.dataset.theme = appearance.mode;
  root.dataset.mode = appearance.mode;
  root.dataset.accent = appearance.theme;
  root.dataset.style = appearance.style;
  root.style.colorScheme = appearance.mode;

  const accent =
    accentColors[appearance.theme] || accentColors.indigo;

  root.style.setProperty("--primary-color", accent);
  root.style.setProperty("--primary-hover", accent);
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    applySavedAppearance(readSavedAppearance());

    const handleAppearanceUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<Appearance>;

      if (customEvent.detail) {
        applySavedAppearance(customEvent.detail);
      } else {
        applySavedAppearance(readSavedAppearance());
      }
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        applySavedAppearance(readSavedAppearance());
      }
    };

    window.addEventListener(
      "intellmeet_appearance_updated",
      handleAppearanceUpdate
    );

    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(
        "intellmeet_appearance_updated",
        handleAppearanceUpdate
      );

      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    setSearchText("");
    setSearchOpen(false);
  }, [location.pathname]);

  const currentPage =
    navigation.find((item) => item.path === location.pathname)?.label ||
    (location.pathname === "/notifications"
      ? "Notifications"
      : location.pathname
          .split("/")
          .filter(Boolean)
          .pop()
          ?.replace(/-/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase())) ||
    "Dashboard";

  const email =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    "";

  const firstName =
    email.split("@")[0]?.split(/[._\s-]/)[0] || "User";

  const avatarLetter = firstName.charAt(0).toUpperCase();

  const filteredNavigation = navigation.filter((item) =>
    item.label.toLowerCase().includes(searchText.toLowerCase().trim())
  );

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!searchText.trim()) return;

    const matchedPage = filteredNavigation[0];

    if (matchedPage) {
      window.history.pushState({}, "", matchedPage.path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <button
          type="button"
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
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
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
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
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
          <div className="topbar-left">
            <button
              type="button"
              className="menu-toggle"
              aria-label="Toggle navigation"
              onClick={() =>
                setSidebarOpen((previous) => !previous)
              }
            >
              <Menu size={21} />
            </button>

            <div className="topbar-breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-divider">/</span>
              <strong>{currentPage}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <form
              className={`topbar-search ${searchOpen ? "search-open" : ""}`}
              onSubmit={handleSearchSubmit}
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
                <Search size={18} />
              </button>

              {searchOpen && (
                <input
                  autoFocus
                  type="search"
                  aria-label="Search navigation pages"
                  placeholder="Search pages..."
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
            </form>

            {searchOpen && searchText.trim() && (
              <div className="search-results">
                {filteredNavigation.length > 0 ? (
                  filteredNavigation.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className="search-result-item"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchText("");
                        }}
                      >
                        <Icon size={17} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })
                ) : (
                  <div className="search-no-results">
                    No matching pages found
                  </div>
                )}
              </div>
            )}

            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `notification-button ${isActive ? "active" : ""}`
              }
              aria-label="Notifications"
              title="Notifications"
            >
              🔔
            </NavLink>

            <div
              className="topbar-avatar"
              title={email || firstName}
            >
              {avatarLetter}
            </div>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
