import React, { useState } from 'react';
import './App.css';

export default function LoginPage() {
  const [user, setUser] = useState(null);
  const [dialog, setDialog] = useState(null);

  const handleLogin = () => {
   Office.context.ui.displayDialogAsync(
  'https://ms-world-add-in.vercel.app/login',  // Updated to /login route
  { height: 100, width: 200, displayInIframe: true },
  (asyncResult) => {
    if (asyncResult.status === Office.AsyncResultStatus.Failed) {
      alert('Failed to open dialog: ' + asyncResult.error.message);
      return;
    }
    const dialogInstance = asyncResult.value;
    setDialog(dialogInstance);

    // Event handler for dialog messages (receives OAuth token)
    dialogInstance.addEventHandler(
      Office.EventType.DialogMessageReceived,
      (arg) => {
        try {
          const message = JSON.parse(arg.message);
          if (message.token) {
            setUser({ email: message.email, token: message.token });
            dialogInstance.close();
            setDialog(null);
          } else if (message.error) {
            alert('Login error: ' + message.error);
          }
        } catch (e) {
          alert('Invalid message received from dialog');
        }
      }
    );

    // Optional: handle dialog closed without login
    dialogInstance.addEventHandler(
      Office.EventType.DialogEventReceived,
      (event) => {
        if (event.error === 12006) {
          // Dialog closed by user
          setDialog(null);
        }
      }
    );
  }
);

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
