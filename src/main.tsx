import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Ensure we're using the correct React instance
// This prevents "Cannot read properties of null" errors from duplicate React instances
if (typeof React.useCallback !== 'function') {
  console.error('React is not properly initialized. This may be due to duplicate React instances.');
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
