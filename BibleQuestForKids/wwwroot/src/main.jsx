import React from "react";
import ReactDOM from "react-dom/client";

// Optional: import a stylesheet if you have one
import "./style.css";

// Main app component
function App() {
  return (
    <div
      style={{
        fontFamily: "Open Sans, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1>📖 Bible Quest for Kids</h1>
      <p>Welcome to Bible Quest for Kids! This React view is running inside the MAUI WebView.</p>
      <p>
        🚀 If you see this screen, your Vite + React build succeeded and is
        loading correctly inside your .NET MAUI app.
      </p>
    </div>
  );
}

// Render the app into the #app container
ReactDOM.createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);