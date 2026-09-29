import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { installApiBase } from "./lib/apiBase";

// No-op unless VITE_API_BASE is set (static/Vercel deploys pointing at a remote
// backend). Local `npm start` keeps using the relative /api proxy unchanged.
installApiBase();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
