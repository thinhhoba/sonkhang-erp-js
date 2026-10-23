"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";

export default function SignOutActions() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    if (isLoading) return;
    setIsLoading(true);
    await signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <div className="auth-action-row">
      <Link className="auth-secondary-button" href="/dashboard">Quay lại hệ thống</Link>
      <button
        className="auth-danger-button"
        type="button"
        disabled={isLoading}
        aria-busy={isLoading}
        onClick={handleSignOut}
      >
        {isLoading ? "Đang đăng xuất…" : "Đăng xuất"}
      </button>
    </div>
  );
}
