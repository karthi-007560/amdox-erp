
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";

function applyInitialTheme() {
  try {
    const appearanceSaved = localStorage.getItem("intellmeet_appearance");
    const settingsSaved = localStorage.getItem("intellmeet_settings");

    const appearance = appearanceSaved
      ? JSON.parse(appearanceSaved)
      : null;

    const settings = settingsSaved
      ? JSON.parse(settingsSaved)
      : null;

    // Support both the Appearance page and older Settings format.
    const mode =
      appearance?.mode ??
      (settings?.theme === "Dark" ? "dark" :
       settings?.theme === "System"
         ? (window.matchMedia("(prefers-color-scheme: dark)").matches
             ? "dark"
             : "light")
         : "light");

    const accent = appearance?.theme ?? "indigo";
    const style = appearance?.style ?? "modern";

    const colors: Record<string, string> = {
      indigo: "#6366f1",
      blue: "#2563eb",
      green: "#059669",
      purple: "#8b5cf6",
      orange: "#f97316",
      rose: "#e11d48",
    };

    const root = document.documentElement;

    root.dataset.theme = mode;
    root.dataset.mode = mode;
    root.dataset.accent = accent;
    root.dataset.style = style;
    root.style.colorScheme = mode;

    root.style.setProperty(
      "--primary-color",
      colors[accent] ?? colors.indigo
    );
  } catch (error) {
    console.error("Could not initialize theme:", error);
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.mode = "light";
    document.documentElement.style.colorScheme = "light";
  }
}

applyInitialTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
