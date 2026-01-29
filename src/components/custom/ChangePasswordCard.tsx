"use client";

import { useState, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

function PasswordInput({
  id,
  name,
  placeholder,
  className,
  minLength,
  value,
  onChange,
}: {
  id: string;
  name: string;
  placeholder: string;
  className: string;
  minLength?: number;
  value: string;
  onChange: (val: string) => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

type Step = "idle" | "code-sent" | "success";

export function ChangePasswordCard({ email }: { email: string }) {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<Step>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const sendCode = async () => {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("flow", "reset");
      await signIn("password", formData);
      setStep("code-sent");
      setResendCooldown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("code", code);
      formData.set("newPassword", newPassword);
      formData.set("flow", "reset-verification");
      await signIn("password", formData);
      setStep("success");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("idle");
    setError(null);
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const inputClass =
    "h-9 rounded-md border-gray-200 bg-gray-50 focus:bg-white focus:border-[hsl(48,96%,53%)] focus:ring-1 focus:ring-[hsl(48,96%,53%)] transition-colors";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your account password
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "success" ? (
          <div className="space-y-3">
            <p className="text-sm text-green-600 font-medium">
              Password changed successfully.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
            >
              Done
            </Button>
          </div>
        ) : step === "idle" ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              We&apos;ll send a verification code to <span className="font-medium">{email}</span> to confirm the change.
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              variant="outline"
              size="sm"
              onClick={sendCode}
              disabled={loading}
            >
              {loading ? "Sending..." : "Change password"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-slate-600">
              Enter the code sent to <span className="font-medium">{email}</span>.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="change-code" className="text-sm font-medium text-gray-700">
                Verification code
              </Label>
              <Input
                id="change-code"
                type="text"
                placeholder="123456"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`${inputClass} text-center tracking-widest`}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="change-new-pw" className="text-sm font-medium text-gray-700">
                New password
              </Label>
              <PasswordInput
                id="change-new-pw"
                name="newPassword"
                placeholder="Enter new password"
                minLength={8}
                value={newPassword}
                onChange={setNewPassword}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="change-confirm-pw" className="text-sm font-medium text-gray-700">
                Confirm new password
              </Label>
              <PasswordInput
                id="change-confirm-pw"
                name="confirmPassword"
                placeholder="Confirm new password"
                minLength={8}
                value={confirmPassword}
                onChange={setConfirmPassword}
                className={inputClass}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex items-center gap-3">
              <Button type="submit" variant="outline" size="sm" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </Button>
              <button
                type="button"
                onClick={reset}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-500">
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                className={
                  resendCooldown > 0
                    ? "text-slate-400 cursor-not-allowed"
                    : "underline hover:text-slate-700"
                }
                onClick={sendCode}
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Resend code"}
              </button>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
