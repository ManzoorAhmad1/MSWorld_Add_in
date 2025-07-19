import React, { useEffect } from "react";
import "./App.css";
import "./index.css";

import LoginPage from "./LoginPage";
import LoginPopup from "./LoginPopup";
import Home from "./components/home";
// IMPROVED: Import the new reliable citation system
import SimplifiedHome from "./components/SimplifiedHome";

function App() {
  const [showLoginPopup, setShowLoginPopup] = React.useState(false);
  const [token, setToken] = React.useState(null);
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
  return (
    <div className="font-inter">
      {showLoginPopup  ? (
        <LoginPopup setShowLoginPopup={setShowLoginPopup}/>
      ) : token ? (
        // IMPROVED: Use the new reliable citation system instead of the problematic CSL version
        <SimplifiedHome setShowLoginPopup={setShowLoginPopup}/>
      ) : (
        <LoginPage setShowLoginPopup={setShowLoginPopup} />
      )}
    </div>
  );
}

export default App;
