import React, { useState, FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { MessageSquare, Mail, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface OTPLoginFormProps {
  onCodeSent: (email: string) => void;
}

export const OTPLoginForm: React.FC<OTPLoginFormProps> = ({ onCodeSent }) => {
  const { t } = useTranslation("auth");
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError(t("errors.emailRequired", "Please enter your email"));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t("errors.invalidEmail", "Please enter a valid email"));
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("flow", "signIn");
      
      await signIn("resend", formData);
      onCodeSent(email);
    } catch (err) {
      console.error("Failed to send OTP:", err);
      setError(t("errors.sendFailed", "Failed to send code. Please try again."));
    } finally {
      setIsLoading(false);
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
              {t("login.title", "Welcome Back")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("login.otpDescription", "Enter your email to receive a sign-in code")}
            </p>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1"
              >
                {t("login.email", "Email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("login.placeholders.email", "you@example.com")}
                  required
                  disabled={isLoading}
                  autoComplete="email"
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
                  {t("login.sending", "Sending code...")}
                </>
              ) : (
                t("login.sendCode", "Send Code")
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t("login.otpInfo", "We'll send a one-time code to your email")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPLoginForm;
