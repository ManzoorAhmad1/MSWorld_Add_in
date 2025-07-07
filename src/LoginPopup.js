import React, { useState } from "react";
import { Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPopup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");


  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (email && password) {
      window.parent.postMessage(
        JSON.stringify({ email, token: "dummy-token" }),
        "*"
      );
    } else {
      setError("Please enter both email and password.");
    }
  };

  const handleGoogleSignIn = () => {
    // Google sign-in logic
    console.log("Google sign-in clicked");
  };

  return (
    <div
      className="login-popup-root"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Left Panel - Brand */}
      <div className="login-popup-left-panel">
        <div className="login-popup-brand-center">
          <div className="login-popup-brand-row">
            <div className="login-popup-logo-outer">
              <div className="login-popup-logo-inner">
                <div className="login-popup-logo-dot"></div>
              </div>
            </div>
            <h1 className="login-popup-title">ResearchCollab</h1>
          </div>
          <p className="login-popup-subtitle">
            Smart Research, Simplified. Find papers, share ideas, stay organized
            - all in one place
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-popup-right-panel">
        <div className="login-popup-form-container">
          <div className="login-popup-form-bg">
            <div className="login-popup-form-title-row">
              <h2 className="login-popup-form-title">Welcome Back</h2>
            </div>
            <div className="login-popup-form-fields">
              {/* Email Input */}
              <div className="login-popup-input-row">
                <div className="login-popup-input-icon">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-popup-input"
                  placeholder="Enter your email"
                />
              </div>
              {/* Password Input */}
              <div className="login-popup-input-row">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-popup-input"
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-popup-password-toggle"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
          
              {error && (
                <div className="login-popup-error">
                  {error}
                </div>
              )}
              {/* Login Button */}
              <button
                onClick={handleSubmit}
                className="login-popup-login-btn"
              >
                Login
              </button>
           
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
