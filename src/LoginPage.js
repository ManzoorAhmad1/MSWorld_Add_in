import React, { useState } from "react";
import "./App.css";

export default function LoginPage({ setShowLoginPopup }) {
  const [user, setUser] = useState(null);

  const handleLogin = () => {
    setShowLoginPopup(true);
    // if (window.Office && typeof Office.onReady === "function") {
    //   Office.onReady().then(() => {
    //     console.log("Office.js is loaded and ready", Office.context);
    //     if (
    //       Office.context &&
    //       Office.context.ui &&
    //       Office.context.ui.displayDialogAsync
    //     ) {
    //       Office.context.ui.displayDialogAsync(
    //         "https://ms-world-add-in.vercel.app",
    //         { height: 60, width: 60, displayInIframe: true },
    //         (asyncResult) => {
    //           setShowLoginPopup(true);
    //         }
    //       );
    //     } else {
    //       alert(
    //         "Office.js is loaded, but not running inside an Office Add-in."
    //       );
    //     }
    //   });
    // } else {
    //   alert(
    //     "Office.js is not loaded. Please run this inside an Office Add-in."
    //   );
    // }
  };

  return (
    <div className="font-inter bg-gradient-to-br from-slate-50 to-slate-200 min-h-screen text-slate-800">
      <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-soft mt-5 mb-5">
        <div className="text-center mb-8 bg-gradient-to-r from-white to-slate-50 p-5 rounded-xl shadow-medium">
          <div className="text-4xl mb-4 flex items-center justify-center">
            <img
              src="https://ihgjcrfmdpdjvnoqknoh.supabase.co/storage/v1/object/public/images/researchcollab-logo.svg"
              alt="Logo"
              height={90}
              width={90}
              className="w-[90px] h-[90px] drop-shadow-lg hover:drop-shadow-2xl transition-all duration-300"
            />{" "}
          </div>
          <h1 className="text-blue-600 mb-2 text-4xl font-bold">
            Welcome to researchCollab
          </h1>
          <p className="text-slate-600 text-lg">
            Your intelligent research companion
          </p>
        </div>

        {!user ? (
          <div>
            <div className="space-y-4 mb-6">
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-2xl mr-3">📚</span>
                <span className="text-slate-700">Search academic papers</span>
              </div>
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-2xl mr-3">📝</span>
                <span className="text-slate-700">Generate citations</span>
              </div>
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-2xl mr-3">📖</span>
                <span className="text-slate-700">Manage bibliography</span>
              </div>
            </div>

            <p className="text-slate-700 text-center mb-6">
              Sign in to access your research tools
            </p>
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-5 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-primary flex items-center justify-center"
              onClick={handleLogin}
            >
              <span className="mr-2">🚀</span>
              Get Started
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              👤
            </div>
            <p className="text-slate-700 mb-4">Welcome back, {user.email}!</p>
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 hover:border-slate-400 rounded-lg px-5 py-3 text-sm font-medium transition-all">
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
