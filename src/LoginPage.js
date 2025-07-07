import React, { useState } from 'react';
import './App.css';

// Google OAuth client ID (replace with your own from Google Cloud Console)
const GOOGLE_CLIENT_ID = 'AIzaSyBOC01SkwAJ8Z9ObS204DFuCk6uJs0OQRM';

export default function LoginPage({ onLogin }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load Google API script
  React.useEffect(() => {
    if (!window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => {
        // gapi loaded
      };
    }
  }, []);

  const handleGoogleLogin = () => {
    setError('');
    setLoading(true);
    if (!window.google || !window.google.accounts) {
      setError('Google login not available. Please try again later.');
      setLoading(false);
      return;
    }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });
    window.google.accounts.id.prompt();
  };

  // Handle Google credential response
  function handleCredentialResponse(response) {
    setLoading(false);
    if (response.credential) {
      // Save token and proceed
      localStorage.setItem('token', response.credential);
      if (onLogin) onLogin(response.credential);
    } else {
      setError('Google login failed. Please try again.');
    }
  }

  return (
    <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div className="login-card" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: 40, maxWidth: 350, width: '100%', textAlign: 'center' }}>
        <img src="https://www.gstatic.com/images/branding/product/1x/googleg_32dp.png" alt="Google Logo" style={{ width: 48, marginBottom: 16 }} />
        <h1 className="login-title" style={{ fontWeight: 600, fontSize: 24, marginBottom: 8 }}>Sign in with Google</h1>
        <p className="login-desc" style={{ color: '#555', marginBottom: 24 }}>to access your research tools</p>
        <button
          className="login-btn"
          onClick={handleGoogleLogin}
          style={{
            background: '#fff',
            color: '#444',
            border: '1px solid #ddd',
            borderRadius: 4,
            padding: '10px 0',
            width: '100%',
            fontWeight: 500,
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
          disabled={loading}
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/googleg_32dp.png" alt="Google icon" style={{ width: 24, marginRight: 8 }} />
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
      </div>
    </div>
  );
}
