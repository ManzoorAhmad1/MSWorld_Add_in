import React, { useState } from "react";
import "./App.css";

export default function LoginPage({ setShowLoginPopup }) {
  const [user, setUser] = useState(null);

  const handleLogin = () => {
    setShowLoginPopup(true);
    // if (window.Office && typeof Office.onReady === "function") {
    //   Office.onReady().then(() => {
    //     console.log("Office.js is loaded and ready", Office.context);
    //     if (
    //       Office.context &&
    //       Office.context.ui &&
    //       Office.context.ui.displayDialogAsync
    //     ) {
    //       Office.context.ui.displayDialogAsync(
    //         "https://ms-world-add-in.vercel.app",
    //         { height: 60, width: 60, displayInIframe: true },
    //         (asyncResult) => {
    //           setShowLoginPopup(true);
    //         }
    //       );
    //     } else {
    //       alert(
    //         "Office.js is loaded, but not running inside an Office Add-in."
    //       );
    //     }
    //   });
    // } else {
    //   alert(
    //     "Office.js is not loaded. Please run this inside an Office Add-in."
    //   );
    // }
  };

  return (
    <div className="App">
      <div className="App-header">
        <div className="login-container">
          <div className="login-header">
            <div className="login-icon">
              🔬
            </div>
            <h1 className="login-title">Welcome to researchCollab</h1>
            <p className="login-subtitle">Your intelligent research companion</p>
          </div>
          
          {!user ? (
            <div className="login-content">
              <div className="login-features">
                <div className="feature-item">
                  <span className="feature-icon">📚</span>
                  <span>Search academic papers</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📝</span>
                  <span>Generate citations</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📖</span>
                  <span>Manage bibliography</span>
                </div>
              </div>
              
              <p className="login-desc">Sign in to access your research tools</p>
              <button className="btn-primary login-btn" onClick={handleLogin}>
                <span>🚀</span>
                Get Started
              </button>
            </div>
          ) : (
            <div className="login-content">
              <div className="user-welcome">
                <div className="user-avatar">👤</div>
                <p className="login-desc">Welcome back, {user.email}!</p>
                <button className="btn-secondary">
                  Continue to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
