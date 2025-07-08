import React, { useEffect } from "react";
import "./App.css";
import "./index.css";

import LoginPage from "./LoginPage";
import LoginPopup from "./LoginPopup";
import Home from "./components/home";

function App() {
  const [showLoginPopup, setShowLoginPopup] = React.useState(false);
  const [token, setToken] = React.useState(null);
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
    <div>
      {showLoginPopup  ? (
        <LoginPopup setShowLoginPopup={setShowLoginPopup}/>
      ) : token ? (
        <Home />
      ) : (
        <LoginPage setShowLoginPopup={setShowLoginPopup} />
      )}
    </div>
  );
}

export default App;
