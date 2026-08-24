import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { HeroUIProvider } from "@heroui/react";

// Legacy links from the omid.github.io/calf/ days: strip the leading /calf
// segment before App reads the location, so old shared events still resolve.
if (window.location.pathname === "/calf" || window.location.pathname.startsWith("/calf/")) {
  const rest = window.location.pathname.slice("/calf".length) || "/";
  window.history.replaceState(null, "", rest + window.location.search + window.location.hash);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HeroUIProvider>
      <App />
    </HeroUIProvider>
  </StrictMode>
);
