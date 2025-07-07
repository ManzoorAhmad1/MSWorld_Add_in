
'use client'
import  { useState } from "react";
import { Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPopup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");


  const handleSubmit = (e:any) => {
    e.preventDefault();
    setError("");
    if (email && password) {
      fetch("https://research-collab-backend-agep.onrender.com/api/v1/users/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Login failed");
          }
          return res.json();
        })
        .then((data) => {
          // Assuming the backend returns a token
          window.parent.postMessage(
            JSON.stringify({ email, token: data.token }),
            "*"
          );
        })
        .catch((err) => {
          setError(err.message || "Login failed");
        });
    } else {
      setError("Please enter both email and password.");
    }
  };

  const handleGoogleSignIn = () => {
    // Google sign-in logic
    console.log("Google sign-in clicked");
  };
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-600 font-sans">
      {/* Left Panel - Brand */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-orange-400 flex items-center justify-center mr-4">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-orange-400"></div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">ResearchCollab</h1>
          </div>
          <p className="text-white text-lg max-w-md">
            Smart Research, Simplified. Find papers, share ideas, stay organized - all in one place
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-indigo-700 mb-2">Welcome Back</h2>
          </div>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400">
                <Mail size={20} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 placeholder-gray-400 shadow-sm outline-none"
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>
            {/* Password Input */}
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 placeholder-gray-400 shadow-sm outline-none"
                placeholder="••••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-blue-500 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {/* Error Message */}
            {error && (
              <div className="w-full text-center text-red-600 bg-red-100 rounded-lg py-2 px-3 text-sm">
                {error}
              </div>
            )}
            {/* Login Button */}
            <button
              type="submit"
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:from-blue-600 hover:to-indigo-700 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
