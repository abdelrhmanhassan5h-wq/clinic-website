import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import Admin from "./Admin.jsx";
import AdminLogin from "./AdminLogin.jsx";

import "./index.css";
import "./Admin.css";

function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(
    Boolean(
      localStorage.getItem("adminToken")
    )
  );

  const logout = () => {
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return (
      <AdminLogin
        onLogin={() =>
          setLoggedIn(true)
        }
      />
    );
  }

  return (
    <Admin
      onLogout={logout}
    />
  );
}

const path =
  window.location.pathname;

const Page =
  path === "/admin"
    ? AdminPage
    : App;

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);