import React, { useState, FormEvent, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { MessageSquare, KeyRound, Loader2, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface OTPVerifyFormProps {
  email: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export const OTPVerifyForm: React.FC<OTPVerifyFormProps> = ({
  email,
  onBack,
  onSuccess,
}) => {
  const { t } = useTranslation("auth");
  const { signIn } = useAuthActions();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendCooldown]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!code || code.length < 6) {
      setError(t("errors.codeRequired", "Please enter the 6-digit code"));
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("code", code);
      formData.set("flow", "signIn");
      
      await signIn("resend", formData);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to verify OTP:", err);
      setError(t("errors.invalidCode", "Invalid code. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("flow", "signIn");
      
      await signIn("resend", formData);
      setResendCooldown(60); // 60 second cooldown
    } catch (err) {
      console.error("Failed to resend OTP:", err);
      setError(t("errors.resendFailed", "Failed to resend code. Please try again."));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8 space-y-6">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <MessageSquare className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("verify.title", "Enter Code")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("verify.description", "We sent a code to")}
              <br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          {/* Code Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-foreground mb-1"
              >
                {t("verify.code", "Verification Code")}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest font-mono"
                  placeholder="000000"
                  required
                  disabled={isLoading}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={8}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("verify.verifying", "Verifying...")}
                </>
              ) : (
                t("verify.submit", "Verify Code")
              )}
            </button>
          </form>

          {/* Actions */}
          <div className="space-y-3">
            <div className="text-center">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-muted-foreground transition-colors"
              >
                {isResending ? (
                  t("verify.resending", "Resending...")
                ) : resendCooldown > 0 ? (
                  t("verify.resendCooldown", "Resend code in {{seconds}}s", {
                    seconds: resendCooldown,
                  })
                ) : (
                  t("verify.resend", "Resend code")
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={onBack}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("verify.useAnother", "Use a different email")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerifyForm;
