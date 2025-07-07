import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import "./index.css";


import LoginPage from "./LoginPage";
import LoginPopup from "./LoginPopup";
import Home from "./components/home";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login-popup" element={<LoginPopup />} />
      <Route path="/home" element={<Home />} />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
