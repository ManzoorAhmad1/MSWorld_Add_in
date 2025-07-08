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
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome to researchCollab</h1>
        {!user ? (
          <>
            <p className="login-desc">Sign in to access your research tools</p>
            <button className="login-btn" onClick={handleLogin}>
              Login
            </button>
          </>
        ) : (
          <>
            <p className="login-desc">Signed in as {user.email}</p>
            {/* Add sign out button or other UI here */}
          </>
        )}
      </div>
    </div>
  );
}
