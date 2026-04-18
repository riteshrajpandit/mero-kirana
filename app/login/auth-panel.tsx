"use client";

import { useState } from "react";

import LoginForm from "@/app/login/login-form";
import RegisterForm from "@/app/login/register-form";

export default function AuthPanel() {
  const [mode, setMode] = useState<"login" | "register">("login");

  if (mode === "register") {
    return <RegisterForm onSwitchToLogin={() => setMode("login")} />;
  }

  return <LoginForm onSwitchToRegister={() => setMode("register")} />;
}