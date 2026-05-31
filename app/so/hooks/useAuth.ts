"use client";
import { useState, useEffect } from "react";

const PIN_RAHASIA = "123456";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isWrongPin, setIsWrongPin] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  useEffect(() => {
    const isLogin = sessionStorage.getItem("gmf_admin_auth");
    if (isLogin === "true") setIsAuthenticated(true);
  }, []);

  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 6) {
      setIsWrongPin(true);
      setTimeout(() => setIsWrongPin(false), 500);
      return;
    }
    setIsLoginLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (pinInput === PIN_RAHASIA) {
      setIsAuthenticated(true);
      sessionStorage.setItem("gmf_admin_auth", "true");
      setIsWrongPin(false);
    } else {
      setIsWrongPin(true);
      setTimeout(() => setIsWrongPin(false), 800);
      setPinInput("");
    }
    setIsLoginLoading(false);
  };

  const handleLogoutAdmin = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("gmf_admin_auth");
    setPinInput("");
    setIsWrongPin(false);
    setShowPin(false);
    setIsLoginLoading(false);
  };

  return {
    isAuthenticated,
    pinInput,
    setPinInput,
    showPin,
    setShowPin,
    isWrongPin,
    setIsWrongPin,
    isLoginLoading,
    handleLoginAdmin,
    handleLogoutAdmin,
  };
};