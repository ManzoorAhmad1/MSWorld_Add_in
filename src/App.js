import React, { useEffect } from "react";
import "./App.css";
import "./index.css";

import LoginPage from "./LoginPage";
import LoginPopup from "./LoginPopup";
import Home from "./components/home";

function App() {
  const [showLoginPopup, setShowLoginPopup] = React.useState(false);
  const [token, setToken] = React.useState(null);
  const [status, setStatus] = React.useState("Loading...");

  useEffect(() => {
    let intervalId;
    let attempts = 0;
    const maxAttempts = 20;
  
    const tryConnect = async () => {
      attempts++;
      try {
        if (window.Office && window.Office.onReady) {
          let response = await window.Office.onReady();
          console.log("Office.js is ready", response);
          clearInterval(intervalId);
        } else {
          console.log("Office.js is not available. Retrying in 2s...");
          if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            console.error("Failed to connect to Office.js after 20 attempts.");
          }
        }
      } catch (err) {
        clearInterval(intervalId);
        console.error("Error while connecting to Office.js:", err);
      }
    };
  
    intervalId = setInterval(tryConnect, 2000);
    // Try immediately as well
    tryConnect();
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      setToken(parsedUser.token);
      window.parent.postMessage(
        JSON.stringify({ email: parsedUser.email, token: parsedUser.token }),
        "*"
      );
    }
  }, [token,showLoginPopup]);
  
  const handleLogout = () => {
    try {
      // Clear all user-related data from localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      // Reset state
      setToken("");
      setShowLoginPopup(true);
      setStatus("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      setStatus("Error during logout");
    }
  };
  return (
    <div className="font-inter">
      {showLoginPopup  ? (
        <LoginPopup setShowLoginPopup={setShowLoginPopup}/>
      ) : token ? (
        <Home handleLogout={handleLogout} setStatus={setStatus} status={status}/>
      ) : (
        <LoginPage setShowLoginPopup={setShowLoginPopup} />
      )}
    </div>
  );
}

export default App;
