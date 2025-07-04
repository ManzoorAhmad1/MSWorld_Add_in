import React from 'react';
import './App.css';

function generateToken() {
  // Simple random token generator
  return (
    Math.random().toString(36).substr(2, 9) +
    Math.random().toString(36).substr(2, 9)
  );
}

export default function LoginPage({ onLogin }) {
  const handleLogin = () => {
    const token = generateToken();
    window.location.href = `http://localhost:3000/login?token=${token}`;
    if (onLogin) onLogin();
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome to researchCollab</h1>
        <p className="login-desc">Sign in to access your research tools</p>
        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
}
