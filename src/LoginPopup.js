import React, { useState } from "react";
import axios from "axios";
import { Mail, Eye, EyeOff } from "lucide-react";
import { signin } from "./api";

export default function LoginPopup({setShowLoginPopup}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await signin({ email, password })
       console.log("Login response:", response);
      const data = response.data;

      setShowLoginPopup(false);
      localStorage.setItem("user", JSON.stringify({  token: data?.token }));

      window.parent.postMessage(
        JSON.stringify({ email, token: data?.data?.token }),
        "*"
      );
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg = error.response?.data?.message || error.message || "An unexpected error occurred. Please try again later.";
      setError(errorMsg);
    } finally {
      setLoading(false);
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
                disabled={loading}
              >
                {loading ? (
                  <span className="login-popup-loader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 50 50" style={{ marginRight: 8 }}>
                      <circle cx="25" cy="25" r="20" fill="none" stroke="#fff" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                      </circle>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
           
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
