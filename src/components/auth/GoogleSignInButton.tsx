"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type GoogleSignInButtonProps = {
  callbackUrl: string;
};

export default function GoogleSignInButton({ callbackUrl }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await signIn("google", { callbackUrl });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="auth-google-button"
      type="button"
      onClick={handleSignIn}
      disabled={isLoading}
      aria-busy={isLoading}
    >
      <span className="auth-google-mark" aria-hidden="true">
        G
      </span>
      <span>{isLoading ? "Đang kết nối Google…" : "Tiếp tục với Google"}</span>
      <span className="auth-button-arrow" aria-hidden="true">→</span>
    </button>
  );
}
