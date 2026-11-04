
import React, { useEffect, useState } from "react";
import {
  Save,
  Sun,
  Moon,
  LayoutDashboard,
  Sparkles,
  Check,
} from "lucide-react";
import "./SettingsPage.css";

type Theme = "indigo" | "blue" | "green" | "purple" | "orange" | "rose";
type Mode = "light" | "dark";
type Style = "modern" | "glass" | "minimal";

interface Appearance {
  theme: Theme;
  mode: Mode;
  style: Style;
}

const STORAGE_KEY = "intellmeet_appearance";

const DEFAULT_APPEARANCE: Appearance = {
  theme: "indigo",
  mode: "light",
  style: "modern",
};

const COLORS: { id: Theme; name: string; color: string }[] = [
  { id: "indigo", name: "Indigo", color: "#6366f1" },
  { id: "blue", name: "Blue", color: "#2563eb" },
  { id: "green", name: "Green", color: "#059669" },
  { id: "purple", name: "Purple", color: "#8b5cf6" },
  { id: "orange", name: "Orange", color: "#f97316" },
  { id: "rose", name: "Rose", color: "#e11d48" },
];

const STYLES: { id: Style; name: string; description: string }[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean cards and soft shadows",
  },
  {
    id: "glass",
    name: "Glass",
    description: "Transparent surfaces and blur",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and clean layout",
  },
];

const ACCENT_COLORS: Record<Theme, string> = {
  indigo: "#6366f1",
  blue: "#2563eb",
  green: "#059669",
  purple: "#8b5cf6",
  orange: "#f97316",
  rose: "#e11d48",
};

function readAppearance(): Appearance {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return { ...DEFAULT_APPEARANCE };

    const parsed = JSON.parse(saved);

    return {
      theme: Object.prototype.hasOwnProperty.call(
        ACCENT_COLORS,
        parsed.theme
      )
        ? parsed.theme
        : DEFAULT_APPEARANCE.theme,
      mode: parsed.mode === "dark" ? "dark" : "light",
      style: ["modern", "glass", "minimal"].includes(parsed.style)
        ? parsed.style
        : DEFAULT_APPEARANCE.style,
    };
  } catch (error) {
    console.error("Could not read appearance settings:", error);
    return { ...DEFAULT_APPEARANCE };
  }
}

function applyAppearance(appearance: Appearance) {
  const root = document.documentElement;
  const primary = ACCENT_COLORS[appearance.theme];

  root.dataset.theme = appearance.mode;
  root.dataset.mode = appearance.mode;
  root.dataset.accent = appearance.theme;
  root.dataset.style = appearance.style;
  root.style.colorScheme = appearance.mode;

  root.style.setProperty("--primary-color", primary);
  root.style.setProperty("--primary-hover", primary);

  // Shared colors for pages, cards, search boxes and inputs.
  root.style.setProperty(
    "--app-bg",
    appearance.mode === "dark" ? "#0b1120" : "#f5f7fb"
  );
  root.style.setProperty(
    "--surface",
    appearance.mode === "dark" ? "#151e30" : "#ffffff"
  );
  root.style.setProperty(
    "--surface-secondary",
    appearance.mode === "dark" ? "#1b263a" : "#f8fafc"
  );
  root.style.setProperty(
    "--surface-hover",
    appearance.mode === "dark" ? "#25334c" : "#eef2ff"
  );
  root.style.setProperty(
    "--text-primary",
    appearance.mode === "dark" ? "#f1f5f9" : "#182230"
  );
  root.style.setProperty(
    "--text-secondary",
    appearance.mode === "dark" ? "#bdc8da" : "#64748b"
  );
  root.style.setProperty(
    "--text-muted",
    appearance.mode === "dark" ? "#94a3b8" : "#98a2b3"
  );
  root.style.setProperty(
    "--border-color",
    appearance.mode === "dark" ? "#2b3950" : "#e2e8f0"
  );
  root.style.setProperty(
    "--input-bg",
    appearance.mode === "dark" ? "#111a2b" : "#ffffff"
  );
  root.style.setProperty(
    "--sidebar-bg",
    appearance.mode === "dark" ? "#101827" : "#ffffff"
  );
  root.style.setProperty(
    "--header-bg",
    appearance.mode === "dark" ? "#101827" : "#ffffff"
  );
  root.style.setProperty(
    "--card-shadow",
    appearance.mode === "dark"
      ? "0 4px 14px rgb(0 0 0 / 15%)"
      : "0 4px 14px rgb(15 23 42 / 5%)"
  );

  window.dispatchEvent(
    new CustomEvent("intellmeet_appearance_updated", {
      detail: appearance,
    })
  );
}

export default function SettingsPage() {
  const [draft, setDraft] = useState<Appearance>(() => readAppearance());
  const [saved, setSaved] = useState(false);

  const { theme, mode, style } = draft;

  useEffect(() => {
    // Keep the saved theme applied when this page opens.
    applyAppearance(readAppearance());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        const updated = readAppearance();
        setDraft(updated);
        applyAppearance(updated);
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const updateAppearance = <K extends keyof Appearance>(
    key: K,
    value: Appearance[K]
  ) => {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      applyAppearance(draft);

      window.dispatchEvent(
        new CustomEvent("intellmeet_settings_updated", {
          detail: draft,
        })
      );

      setSaved(true);
    } catch (error) {
      console.error("Could not save appearance settings:", error);
      window.alert("Settings save panna mudiyala. Please try again.");
    }
  };

  const selectedColor =
    COLORS.find((item) => item.id === theme) ?? COLORS[0];

  const selectedStyle =
    STYLES.find((item) => item.id === style) ?? STYLES[0];

  return (
    <div className="page settingsPage">
      <header className="settingsPageHeader">
        <div>
          <h1>Appearance Settings</h1>
          <p>Customize your IntellMeet dashboard</p>
        </div>

      
      </header>

      <section className="settingsPanel">
        <h2>Theme Color</h2>
        <p className="settingsDescription">
          Choose your dashboard accent color
        </p>

        <div className="colorGrid">
          {COLORS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`colorOption ${
                theme === item.id ? "selected" : ""
              }`}
              onClick={() => updateAppearance("theme", item.id)}
              aria-pressed={theme === item.id}
            >
              <span
                className="colorCircle"
                style={{ backgroundColor: item.color }}
              >
                {theme === item.id && <Check size={18} color="#fff" />}
              </span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="settingsPanel">
        <h2>Appearance Mode</h2>
        <p className="settingsDescription">
          Select Light or Dark mode, then save your changes
        </p>

        <div className="appearanceGrid">
          <button
            type="button"
            className={`appearanceOption ${
              mode === "light" ? "selected" : ""
            }`}
            onClick={() => updateAppearance("mode", "light")}
            aria-pressed={mode === "light"}
          >
            <Sun size={25} />
            <div>
              <strong>Light Mode</strong>
              <p>Bright background and dark text</p>
            </div>
            {mode === "light" && <Check size={19} />}
          </button>

          <button
            type="button"
            className={`appearanceOption ${
              mode === "dark" ? "selected" : ""
            }`}
            onClick={() => updateAppearance("mode", "dark")}
            aria-pressed={mode === "dark"}
          >
            <Moon size={25} />
            <div>
              <strong>Dark Mode</strong>
              <p>Dark background and light text</p>
            </div>
            {mode === "dark" && <Check size={19} />}
          </button>
        </div>
      </section>

      <section className="settingsPanel">
        <h2>Dashboard Style</h2>
        <p className="settingsDescription">
          Choose your dashboard card appearance
        </p>

        <div className="styleGrid">
          {STYLES.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`styleOption ${
                style === item.id ? "selected" : ""
              }`}
              onClick={() => updateAppearance("style", item.id)}
              aria-pressed={style === item.id}
            >
              <div className={`stylePreview ${item.id}`}>
                <div className="previewHeader" />
                <div className="previewContent">
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <strong>{item.name}</strong>
              <p>{item.description}</p>

              {style === item.id && <Check size={18} />}
            </button>
          ))}
        </div>
      </section>

      <section className="settingsPanel">
        <h2>Live Preview</h2>
        <p className="settingsDescription">
          Preview your selections before saving
        </p>

        <div
          className={`settingsPreview ${mode} ${style}`}
          data-mode={mode}
          style={
            {
              "--preview-primary": selectedColor.color,
            } as React.CSSProperties
          }
        >
          <div className="previewDashboardHeader">
            <div className="previewDashboardIcon">
              <LayoutDashboard size={22} />
            </div>

            <div>
              <strong>IntellMeet Dashboard</strong>
              <p>Meetings & Collaboration Overview</p>
            </div>

            <Sparkles size={21} className="previewSparkle" />
          </div>

          <div className="previewStats">
            <div className="previewStatCard">
              <span>Total Meetings</span>
              <strong>12 Meetings</strong>
              <small>Meeting overview preview</small>
            </div>

            <div className="previewStatCard">
              <span>Tasks</span>
              <strong>08 Tasks</strong>
              <small>Task overview preview</small>
            </div>
          </div>

          <div className="previewFooter">
            <span
              className="previewStatusDot"
              style={{ backgroundColor: selectedColor.color }}
            />
            <span>
              {selectedColor.name} ·{" "}
              {mode === "dark" ? "Dark Mode" : "Light Mode"} ·{" "}
              {selectedStyle.name}
            </span>
          </div>
        </div>
      </section>

      <footer className="settingsSaveFooter">
        <div>
          <strong>
            {saved ? "Settings Saved" : "Customize Your Dashboard"}
          </strong>
          <p>
            {saved
              ? "Your preferences have been saved."
              : "Your selections will apply after you save."}
          </p>
        </div>

        <button
          type="button"
          className="settingsSaveButton"
          onClick={handleSave}
        >
          <Save size={17} />
          {saved ? "Saved" : "Save Changes"}
        </button>
      </footer>
    </div>
  );
}
