"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type Flow = "signIn" | "signUp" | "reset" | "reset-verification";

export function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<Flow>("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("flow", flow);

    try {
      await signIn("password", formData);
      if (flow === "reset") {
        setResetEmail(formData.get("email") as string);
        setFlow("reset-verification");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      // Check for duplicate email (signed up with Google)
      if (message.includes("already exists") || message.includes("duplicate")) {
        setError("An account with this email already exists. Try signing in with Google instead.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signIn("google");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  const cardClass = "w-full max-w-[380px] mx-auto bg-white rounded-xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6";
  const headingClass = "text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]";
  const subheadingClass = "text-sm text-gray-500 mt-1";
  const inputClass = "h-9 rounded-md border-gray-200 bg-gray-50 focus:bg-white focus:border-[hsl(48,96%,53%)] focus:ring-1 focus:ring-[hsl(48,96%,53%)] transition-colors";
  const primaryBtnClass = "w-full h-9 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors";
  const googleBtnClass = "flex items-center justify-center gap-2 w-full h-10 bg-[hsl(222.2,47.4%,11.2%)] border border-[hsl(222.2,47.4%,11.2%)] rounded-md text-sm font-medium text-white hover:bg-[hsl(222.2,47.4%,18%)] transition-all";

  // Password Reset: Request Code
  if (flow === "reset") {
    return (
      <div className={cardClass}>
        <div className="text-center mb-6">
          <h1 className={headingClass}>Reset password</h1>
          <p className={subheadingClass}>Enter your email to receive a reset code</p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={loading} className={primaryBtnClass}>
            {loading ? "Sending..." : "Send reset code"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <button
            type="button"
            className="text-[hsl(222.2,47.4%,11.2%)] hover:text-[hsl(222.2,47.4%,25%)] underline underline-offset-2 font-medium"
            onClick={() => setFlow("signIn")}
          >
            Back to sign in
          </button>
        </p>
      </div>
    );
  }

  // Password Reset: Enter Code + New Password
  if (flow === "reset-verification") {
    return (
      <div className={cardClass}>
        <div className="text-center mb-6">
          <h1 className={headingClass}>Check your email</h1>
          <p className={subheadingClass}>We sent a code to {resetEmail}</p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <input type="hidden" name="email" value={resetEmail} />

          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-sm font-medium text-gray-700">
              Reset code
            </Label>
            <Input
              id="code"
              name="code"
              type="text"
              placeholder="123456"
              required
              className={`${inputClass} text-center tracking-widest`}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
              New password
            </Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Enter new password"
              required
              minLength={8}
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={loading} className={primaryBtnClass}>
            {loading ? "Resetting..." : "Reset password"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <button
            type="button"
            className="text-[hsl(222.2,47.4%,11.2%)] hover:text-[hsl(222.2,47.4%,25%)] underline underline-offset-2 font-medium"
            onClick={() => setFlow("reset")}
          >
            Didn&apos;t receive a code? Try again
          </button>
        </p>
      </div>
    );
  }

  // Sign In / Sign Up
  return (
    <div className={cardClass}>
      <div className="text-center mb-6">
        <h1 className={headingClass}>
          {flow === "signIn" ? "Sign in to Mapdis" : "Create your account"}
        </h1>
        <p className={subheadingClass}>
          {flow === "signIn"
            ? "Welcome back! Please enter your details."
            : "Start exploring global relations today."}
        </p>
      </div>

      <div className="space-y-4">
        <button type="button" onClick={handleGoogleSignIn} className={googleBtnClass}>
          <GoogleIcon className="w-4 h-4" />
          Continue with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">or</span>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              {flow === "signIn" && (
                <button
                  type="button"
                  onClick={() => setFlow("reset")}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              minLength={8}
              className={inputClass}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500">
              {error}
              {error.includes("Google") && (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="block w-full mt-2 text-[hsl(222.2,47.4%,11.2%)] font-medium hover:text-[hsl(222.2,47.4%,25%)] underline"
                >
                  Sign in with Google
                </button>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading} className={primaryBtnClass}>
            {loading ? "Loading..." : flow === "signIn" ? "Sign in" : "Create account"}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        {flow === "signIn" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          className="text-[hsl(222.2,47.4%,11.2%)] hover:text-[hsl(222.2,47.4%,25%)] underline underline-offset-2 font-medium"
          onClick={() => {
            setFlow(flow === "signIn" ? "signUp" : "signIn");
            setError(null);
          }}
        >
          {flow === "signIn" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
