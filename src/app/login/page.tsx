"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Extend Window for Office typings
declare global {
  interface Window {
    Office: typeof Office;
  }
}

type User = {
  email: string;
  token: string;
};

export default function LoginPage() {
  const [user, setUser] = useState<User | null>(null);
  const [dialog, setDialog] = useState<any>(null);
  const [officeReady, setOfficeReady] = useState(false);
  const router = useRouter();

  // Ensure Office is initialized
  useEffect(() => {
    if (typeof window !== "undefined" && window.Office) {
      window.Office.onReady().then(() => {
        console.log("✅ Office is ready");
        setOfficeReady(true);
      });
    } else {
      console.warn("❌ Office.js not found");
    }
  }, []);

  const handleLogin = () => {
    if (!officeReady || !window.Office.context?.ui) {
      alert("This feature is only available inside Microsoft Word/Office.");
      return;
    }

    console.log("Opening login dialog");

    window.Office.context.ui.displayDialogAsync(
      "https://ms-world-add-in.vercel.app/login_popup.html",
      { height: 60, width: 60, displayInIframe: true },
      (asyncResult: any) => {
        if (asyncResult.status === window.Office.AsyncResultStatus.Failed) {
          alert("Failed to open dialog: " + asyncResult.error.message);
          return;
        }

        const dialogInstance = asyncResult.value;
        setDialog(dialogInstance);

        dialogInstance.addEventHandler(
          window.Office.EventType.DialogMessageReceived,
          (arg: any) => {
            try {
              const message = JSON.parse(arg.message);
              if (message.token) {
                setUser({ email: message.email, token: message.token });
                dialogInstance.close();
                setDialog(null);
              } else if (message.error) {
                alert("Login error: " + message.error);
              }
            } catch (e) {
              alert("Invalid message received from dialog");
            }
          }
        );

        dialogInstance.addEventHandler(
          window.Office.EventType.DialogEventReceived,
          (event: any) => {
            if (event.error === 12006) {
              setDialog(null); // Dialog closed by user
            }
          }
        );
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 p-4">
      <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-indigo-700 mb-2 tracking-tight">
          Welcome to <span className="text-blue-500">researchCollab</span>
        </h1>
        {!user ? (
          <>
            <p className="text-gray-600 mb-6 text-center">
              Sign in to access your research tools
            </p>
            <button
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:from-blue-600 hover:to-indigo-700 transition mb-2"
              onClick={handleLogin}
              disabled={!officeReady}
            >
              {officeReady ? "Login" : "Loading Office..."}
            </button>
          </>
        ) : (
          <>
            <p className="text-green-600 font-medium mb-2">
              Signed in as <span className="font-semibold">{user.email}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
