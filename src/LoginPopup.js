import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

export default function LoginPopup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    // Dummy login logic, replace with real authentication
    if (email && password) {
      // On successful login, you might want to send a message to the parent window
      // or redirect, depending on your Office add-in logic
      window.parent.postMessage(
        JSON.stringify({ email, token: 'dummy-token' }),
        '*'
      );
      // Optionally close the popup or navigate
      // window.close();
    } else {
      setError('Please enter both email and password.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Sign in to ResearchCollab</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
}
