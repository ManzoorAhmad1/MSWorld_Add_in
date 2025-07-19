import React, { useState, useEffect } from "react";
import axios from "axios";
import { Mail, Eye, EyeOff, X, Lock, LoaderCircle } from "lucide-react";
import { signin } from "./api";

export default function LoginPopup({ setShowLoginPopup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Add CSS animation for spinner and enhanced effects
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes slideInUp {
        0% { 
          transform: translateY(30px); 
          opacity: 0; 
        }
        100% { 
          transform: translateY(0); 
          opacity: 1; 
        }
      }
      
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      
      .login-modal {
        animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .shimmer-effect {
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
      }
      
      .float-animation {
        animation: float 6s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowLoginPopup(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [setShowLoginPopup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await signin({ email, password });
      const data = response.data;

      setShowLoginPopup(false);
      localStorage.setItem("user", JSON.stringify({ token: data?.token }));

      window.parent.postMessage(
        JSON.stringify({ email, token: data?.data?.token }),
        "*"
      );
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred. Please try again later.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/layoutBg.svg')`,
          filter: "brightness(40%) contrast(70%) saturate(120%)",
        }}
      />

      {/* Animated overlay gradient */}
      <div className="absolute inset-0  animate-pulse" />

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-bounce"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        />
        <div
          className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-300/30 rounded-full animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-purple-300/25 rounded-full animate-bounce"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        />
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-1 lg:max-w-[1100px] lg:grid-cols-2 relative z-10 items-center justify-center text-center sm:m-6 m-4 rounded-2xl md:grid-cols-1 backdrop-blur-sm border border-white/10 shadow-2xl login-modal"
        style={{
          boxShadow:
            "rgba(0, 0, 0, 0.8) 0px 25px 60px -15px, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
          borderRadius: "20px",
        }}
      >
        <div
          className="hidden sm:block relative overflow-hidden rounded-tl-2xl lg:rounded-bl-2xl md:rounded-bl-none min-h-full md:rounded-tr-2xl lg:rounded-tr-none rounded-tr-2xl md:flex flex-col md:justify-center"
          style={{
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/20 to-orange-500/20 rounded-full blur-2xl" />

          <div className="relative z-10 md:px-[80px] px-[20px] md:py-[44.5px] py-[14.5px]">
            <div className="flex items-center mb-8 gap-4 transform hover:scale-105 transition-transform duration-300 float-animation">
              <div className="relative">
                <img
                  src="https://ihgjcrfmdpdjvnoqknoh.supabase.co/storage/v1/object/public/images/researchcollab-logo.svg"
                  alt="Logo"
                  height={90}
                  width={90}
                  className="w-[90px] h-[90px] drop-shadow-lg hover:drop-shadow-2xl transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-xl animate-pulse" />
              </div>
              <h1
                className="font-bold text-[28px] font-semibold leading-[36px] text-gray-800 drop-shadow-sm"
                style={{
                  overflowWrap: "break-word",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                ResearchCollab
              </h1>
            </div>
            <p className="font-medium text-[16px] text-left font-normal leading-[24px] text-gray-700 hidden md:block break-words drop-shadow-sm">
              Smart Research, Simplified. Find papers, share ideas, stay
              organized - all in one place
            </p>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-tr-2xl rounded-br-2xl lg:rounded-tl-none md:rounded-tl-2xl lg:rounded-bl-none md:rounded-bl-2xl backdrop-blur-xl border-l border-white/10"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full  bg-[#39393933] backdrop-blur-[12px] ">
            <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-full blur-2xl animate-pulse" />
            <div
              className="absolute bottom-1/3 left-1/4 w-16 h-16 bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-full blur-xl animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </div>

          <div className="relative z-10 md:overflow-y-auto overflow-y-auto lg:max-h-[fit-content] md:max-h-[50vh] sm:max-h-full max-h-full p-8 md:p-12">
            {/* Close button with enhanced styling */}
            <button
              type="button"
              onClick={() => setShowLoginPopup(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 p-2 rounded-full backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-110 transform"
              aria-label="Close login popup"
            >
              <X size={20} className="drop-shadow-lg" />
            </button>

            <div className="w-full max-w-sm mx-auto mt-4 ">
              {/* Enhanced welcome heading */}
              <div className="text-center mb-8">
                <h1
                  className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Welcome Back
                </h1>
                <p className="text-white/70 text-sm font-medium drop-shadow-sm">
                  Sign in to continue your research journey
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input with enhanced styling */}
                <div className="group">
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 group-focus-within:text-white/80 transition-colors duration-300"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-base border border-white/30 bg-white/10 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-white/60 focus:bg-white/20 outline-none transition-all duration-300 placeholder-white/50 text-white hover:border-white/40 hover:bg-white/15"
                      placeholder="Enter your email"
                      required
                      autoComplete="email"
                      aria-label="Email address"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>

                {/* Password Input with enhanced styling */}
                <div className="group">
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 group-focus-within:text-white/80 transition-colors duration-300"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-14 py-4 text-base border border-white/30 bg-white/10 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-white/60 focus:bg-white/20 outline-none transition-all duration-300 placeholder-white/50 text-white hover:border-white/40 hover:bg-white/15"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      aria-label="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/90 transition-all duration-300 p-1 rounded-md hover:bg-white/10"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>

                {error && (
                  <div className="p-4 text-sm text-red-200 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl animate-pulse">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {/* Enhanced Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className=" text-white rounded-[30px] bg-gradient-to-r from-[#0D4DA9] to-[#0E70FF] backdrop-blur-[32px] pt-[10px] pb-[10px] shadow-[0px_2px_1px_rgba(0,0,0,0.09),0px_4px_2px_rgba(0,0,0,0.09),0px_8px_4px_rgba(0,0,0,0.09),0px_16px_8px_rgba(0,0,0,0.09),0px_32px_16px_rgba(0,0,0,0.09)]"
                  style={{
                    background:
                      "linear-gradient(273.51deg, #0D4DA9 -1.46%, #0E70FF 86.99%)",
                    width: "100%",
                  }}
                >
                  {loading ? (
                    <div className="w-full flex items-center justify-center relative z-10">
                      <LoaderCircle size={20} className="mr-3 animate-spin" />
                      <span>Logging in...</span>
                    </div>
                  ) : (
                    <span className="relative z-10 font-semibold tracking-wide">
                      Sign In
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
