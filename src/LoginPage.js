
import './App.css';

export default function LoginPage() {
  // Open Office dialog for login
  const handleLogin = () => {
    if (window.Office && Office.context && Office.context.ui && Office.context.ui.displayDialogAsync) {
      Office.context.ui.displayDialogAsync(
        window.location.origin + '/login-dialog.html',
        { height: 50, width: 30, displayInIframe: true },
        function () {
          // Optionally handle dialog events here
        }
      );
    } else {
      alert('Office.js not available. Please run this add-in in Microsoft Word.');
    }
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
