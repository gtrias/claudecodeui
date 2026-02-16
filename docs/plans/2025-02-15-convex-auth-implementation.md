# Convex Auth Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Express/SQLite/JWT authentication with Convex Auth using Email OTP via Resend.

**Architecture:** Convex backend handles auth (OTP generation, verification, sessions). React frontend uses custom OTP forms styled with TailwindCSS. Existing Express server remains for non-auth functionality.

**Tech Stack:** Convex, @convex-dev/auth, Resend, React, TypeScript, TailwindCSS

**Design Document:** `docs/plans/2025-02-15-convex-auth-migration-design.md`

---

## Task 1: Install Convex and Initialize Project

**Files:**
- Modify: `package.json`
- Create: `convex/` directory (auto-generated)

**Step 1: Install Convex CLI and dependencies**

Run:
```bash
npm install convex @convex-dev/auth @auth/core resend
```

Expected: Dependencies added to package.json

**Step 2: Initialize Convex project**

Run:
```bash
npx convex dev
```

Expected: 
- Prompts for Convex login (browser opens)
- Prompts to create new project or link existing
- Creates `convex/` directory with `_generated/`
- Creates `.env.local` with `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL`

**Step 3: Verify Convex is running**

Check that `convex/` folder exists and `.env.local` contains:
```
CONVEX_DEPLOYMENT=dev:your-project-name
VITE_CONVEX_URL=https://your-project.convex.cloud
```

**Step 4: Commit**

```bash
git add package.json package-lock.json convex/ .env.local
git commit -m "chore: install and initialize Convex"
```

---

## Task 2: Configure Convex Auth with Resend OTP

**Files:**
- Create: `convex/auth.config.ts`
- Create: `convex/auth.ts`

**Step 1: Create auth.config.ts**

Create file `convex/auth.config.ts`:

```typescript
import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Resend({
      from: "onboarding@resend.dev",
    }),
  ],
});
```

**Step 2: Create auth.ts with auth functions**

Create file `convex/auth.ts`:

```typescript
import { query } from "./_generated/server";
import { auth } from "./auth.config";

export const { signIn, signOut, store } = auth;

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    return user;
  },
});
```

**Step 3: Commit**

```bash
git add convex/auth.config.ts convex/auth.ts
git commit -m "feat: configure Convex auth with Resend OTP"
```

---

## Task 3: Create Convex Schema for Users

**Files:**
- Create: `convex/schema.ts`

**Step 1: Create schema.ts with auth tables**

Create file `convex/schema.ts`:

```typescript
import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
});
```

**Step 2: Verify schema syncs**

Run (if not already running):
```bash
npx convex dev
```

Expected: Convex syncs schema, no errors

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add Convex schema with auth tables"
```

---

## Task 4: Create HTTP Routes for Auth

**Files:**
- Create: `convex/http.ts`

**Step 1: Create http.ts for auth endpoints**

Create file `convex/http.ts`:

```typescript
import { httpRouter } from "convex/server";
import { auth } from "./auth.config";

const http = httpRouter();

auth.addHttpRoutes(http);

export default http;
```

**Step 2: Verify Convex syncs**

Check `npx convex dev` output shows no errors

**Step 3: Commit**

```bash
git add convex/http.ts
git commit -m "feat: add HTTP routes for Convex auth"
```

---

## Task 5: Set Convex Environment Variables

**Files:**
- Convex Dashboard (not local files)

**Step 1: Generate AUTH_SECRET**

Run:
```bash
npx convex auth genSecret
```

Expected: Outputs a secret string

**Step 2: Set AUTH_SECRET in Convex Dashboard**

Run:
```bash
npx convex env set AUTH_SECRET "<the-secret-from-step-1>"
```

Expected: "Environment variable AUTH_SECRET set"

**Step 3: Get Resend API Key**

Go to https://resend.com/api-keys
- Create new API key (or use existing)
- Copy the key (starts with `re_`)

**Step 4: Set RESEND_API_KEY in Convex Dashboard**

Run:
```bash
npx convex env set AUTH_RESEND_KEY "<your-resend-api-key>"
```

Expected: "Environment variable AUTH_RESEND_KEY set"

**Step 5: Verify environment variables**

Run:
```bash
npx convex env list
```

Expected: Shows AUTH_SECRET and AUTH_RESEND_KEY (values hidden)

**Step 6: Commit (nothing to commit - env vars are in Convex cloud)**

No git commit needed for this task.

---

## Task 6: Create ConvexClientProvider

**Files:**
- Create: `src/ConvexClientProvider.tsx`

**Step 1: Create the provider component**

Create file `src/ConvexClientProvider.tsx`:

```typescript
import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider>
        {children}
      </ConvexAuthProvider>
    </ConvexProvider>
  );
}
```

**Step 2: Run typecheck**

Run:
```bash
npm run typecheck
```

Expected: No new type errors related to ConvexClientProvider

**Step 3: Commit**

```bash
git add src/ConvexClientProvider.tsx
git commit -m "feat: add ConvexClientProvider component"
```

---

## Task 7: Create OTPLoginForm Component

**Files:**
- Create: `src/components/OTPLoginForm.tsx`

**Step 1: Create OTPLoginForm component**

Create file `src/components/OTPLoginForm.tsx`:

```typescript
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
```

**Step 2: Run typecheck**

Run:
```bash
npm run typecheck
```

Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/OTPLoginForm.tsx
git commit -m "feat: add OTPLoginForm component"
```

---

## Task 8: Create OTPVerifyForm Component

**Files:**
- Create: `src/components/OTPVerifyForm.tsx`

**Step 1: Create OTPVerifyForm component**

Create file `src/components/OTPVerifyForm.tsx`:

```typescript
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
```

**Step 2: Run typecheck**

Run:
```bash
npm run typecheck
```

Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/OTPVerifyForm.tsx
git commit -m "feat: add OTPVerifyForm component"
```

---

## Task 9: Create Unified OTPAuthFlow Component

**Files:**
- Create: `src/components/OTPAuthFlow.tsx`

**Step 1: Create OTPAuthFlow orchestration component**

Create file `src/components/OTPAuthFlow.tsx`:

```typescript
import React, { useState } from "react";
import { OTPLoginForm } from "./OTPLoginForm";
import { OTPVerifyForm } from "./OTPVerifyForm";

type AuthStep = "email" | "verify";

export const OTPAuthFlow: React.FC = () => {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");

  const handleCodeSent = (sentEmail: string) => {
    setEmail(sentEmail);
    setStep("verify");
  };

  const handleBack = () => {
    setStep("email");
  };

  if (step === "verify") {
    return <OTPVerifyForm email={email} onBack={handleBack} />;
  }

  return <OTPLoginForm onCodeSent={handleCodeSent} />;
};

export default OTPAuthFlow;
```

**Step 2: Run typecheck**

Run:
```bash
npm run typecheck
```

Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/OTPAuthFlow.tsx
git commit -m "feat: add OTPAuthFlow orchestration component"
```

---

## Task 10: Update AuthContext to Use Convex

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

**Step 1: Backup original AuthContext**

Run:
```bash
cp src/contexts/AuthContext.tsx src/contexts/AuthContext.tsx.backup
```

**Step 2: Rewrite AuthContext to use Convex**

Replace contents of `src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, ReactNode } from "react";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { IS_PLATFORM } from "../constants/config";

interface User {
  email?: string;
  id?: string;
  _id?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null; // Kept for interface compatibility, but unused
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsSetup: boolean; // No longer used with Convex, always false
  hasCompletedOnboarding: boolean;
  refreshOnboardingStatus: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isLoading: isConvexLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const convexUser = useQuery(
    api.auth.currentUser,
    isAuthenticated ? {} : "skip"
  );

  // Platform mode bypass (existing behavior)
  if (IS_PLATFORM) {
    const platformValue: AuthContextValue = {
      user: { email: "platform-user" },
      token: null,
      logout: async () => {},
      isLoading: false,
      isAuthenticated: true,
      needsSetup: false,
      hasCompletedOnboarding: true,
      refreshOnboardingStatus: async () => {},
      error: null,
    };

    return (
      <AuthContext.Provider value={platformValue}>
        {children}
      </AuthContext.Provider>
    );
  }

  const user: User | null = convexUser
    ? {
        email: convexUser.email as string | undefined,
        id: convexUser._id,
        _id: convexUser._id,
      }
    : null;

  const logout = async (): Promise<void> => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshOnboardingStatus = async (): Promise<void> => {
    // TODO: Implement onboarding status in Convex if needed
  };

  const value: AuthContextValue = {
    user,
    token: null, // Convex manages sessions, no JWT token
    logout,
    isLoading: isConvexLoading,
    isAuthenticated,
    needsSetup: false, // No setup needed with Convex OTP
    hasCompletedOnboarding: true, // TODO: Implement if needed
    refreshOnboardingStatus,
    error: null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**Step 3: Run typecheck**

Run:
```bash
npm run typecheck
```

Expected: May have errors related to api import - will fix in next task

**Step 4: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "refactor: update AuthContext to use Convex auth"
```

---

## Task 11: Wrap App with ConvexClientProvider

**Files:**
- Modify: `src/App.tsx` or `src/main.tsx`

**Step 1: Find main entry point**

Run:
```bash
head -50 src/main.tsx
```

Check where providers are wrapped.

**Step 2: Add ConvexClientProvider**

Modify the main entry point to wrap with ConvexClientProvider. The exact location depends on where `AuthProvider` is currently rendered.

Example pattern for `src/main.tsx`:

```typescript
import { ConvexClientProvider } from "./ConvexClientProvider";

// Wrap existing providers:
<ConvexClientProvider>
  <AuthProvider>
    {/* existing app */}
  </AuthProvider>
</ConvexClientProvider>
```

**Step 3: Run typecheck**

Run:
```bash
npm run typecheck
```

**Step 4: Commit**

```bash
git add src/main.tsx  # or src/App.tsx
git commit -m "feat: wrap app with ConvexClientProvider"
```

---

## Task 12: Update LoginForm to Use OTPAuthFlow

**Files:**
- Modify: `src/components/LoginForm.tsx`

**Step 1: Replace LoginForm with OTPAuthFlow**

Replace contents of `src/components/LoginForm.tsx`:

```typescript
import React from "react";
import { OTPAuthFlow } from "./OTPAuthFlow";

const LoginForm: React.FC = () => {
  return <OTPAuthFlow />;
};

export default LoginForm;
```

**Step 2: Run typecheck**

Run:
```bash
npm run typecheck
```

**Step 3: Commit**

```bash
git add src/components/LoginForm.tsx
git commit -m "refactor: replace LoginForm with OTPAuthFlow"
```

---

## Task 13: Update ProtectedRoute Component

**Files:**
- Modify: `src/components/ProtectedRoute.tsx`

**Step 1: Read current ProtectedRoute**

Run:
```bash
cat src/components/ProtectedRoute.tsx
```

**Step 2: Update to use Convex auth**

The component should use `useAuth()` which now wraps Convex. Verify it works with the new auth:

```typescript
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```

**Step 3: Run typecheck**

Run:
```bash
npm run typecheck
```

**Step 4: Commit**

```bash
git add src/components/ProtectedRoute.tsx
git commit -m "refactor: update ProtectedRoute for Convex auth"
```

---

## Task 14: Add i18n Translations for OTP Auth

**Files:**
- Modify: `src/i18n/locales/en/auth.json` (or equivalent)
- Modify: `src/i18n/locales/zh/auth.json` (if Chinese support)

**Step 1: Find i18n auth translations file**

Run:
```bash
find src/i18n -name "*.json" | head -10
```

**Step 2: Add OTP-related translations**

Add these keys to the auth namespace:

```json
{
  "login": {
    "title": "Welcome Back",
    "email": "Email",
    "otpDescription": "Enter your email to receive a sign-in code",
    "sendCode": "Send Code",
    "sending": "Sending code...",
    "otpInfo": "We'll send a one-time code to your email",
    "placeholders": {
      "email": "you@example.com"
    }
  },
  "verify": {
    "title": "Enter Code",
    "description": "We sent a code to",
    "code": "Verification Code",
    "submit": "Verify Code",
    "verifying": "Verifying...",
    "resend": "Resend code",
    "resending": "Resending...",
    "resendCooldown": "Resend code in {{seconds}}s",
    "useAnother": "Use a different email"
  },
  "errors": {
    "emailRequired": "Please enter your email",
    "invalidEmail": "Please enter a valid email",
    "sendFailed": "Failed to send code. Please try again.",
    "codeRequired": "Please enter the 6-digit code",
    "invalidCode": "Invalid code. Please try again.",
    "resendFailed": "Failed to resend code. Please try again."
  }
}
```

**Step 3: Commit**

```bash
git add src/i18n/
git commit -m "feat: add i18n translations for OTP auth"
```

---

## Task 15: Test End-to-End OTP Flow

**Files:**
- None (manual testing)

**Step 1: Start Convex dev server**

Run in terminal 1:
```bash
npx convex dev
```

**Step 2: Start frontend dev server**

Run in terminal 2:
```bash
npm run dev
```

**Step 3: Test OTP flow**

1. Open browser to http://localhost:5173 (or your Vite port)
2. Enter your email (must be your verified Resend email in onboarding mode)
3. Check email for OTP code
4. Enter code in verification form
5. Verify you're redirected to authenticated state
6. Test logout functionality

**Step 4: Fix any issues found**

Address any runtime errors or UX issues.

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve issues from end-to-end testing"
```

---

## Task 16: Clean Up Old Auth Code (After Verification)

**Files:**
- Remove: Old Express auth routes (in server/)
- Remove: `src/components/SetupForm.tsx` (if exists)
- Remove: `src/contexts/AuthContext.tsx.backup`

**Step 1: Identify old auth server code**

Run:
```bash
grep -r "login\|register" server/ --include="*.ts" --include="*.js" -l
```

**Step 2: Remove or comment out old auth routes**

Review and remove/comment Express auth endpoints that are no longer needed.

**Step 3: Remove backup file**

Run:
```bash
rm src/contexts/AuthContext.tsx.backup
```

**Step 4: Remove SetupForm if exists**

Run:
```bash
rm src/components/SetupForm.tsx 2>/dev/null || echo "SetupForm not found"
```

**Step 5: Run full validation**

Run:
```bash
npm run validate
```

**Step 6: Commit cleanup**

```bash
git add -A
git commit -m "chore: remove old auth code after Convex migration"
```

---

## Summary

| Task | Description | Time Est. |
|------|-------------|-----------|
| 1 | Install Convex & Initialize | 5 min |
| 2 | Configure Convex Auth with Resend | 3 min |
| 3 | Create Convex Schema | 2 min |
| 4 | Create HTTP Routes | 2 min |
| 5 | Set Environment Variables | 5 min |
| 6 | Create ConvexClientProvider | 3 min |
| 7 | Create OTPLoginForm | 5 min |
| 8 | Create OTPVerifyForm | 5 min |
| 9 | Create OTPAuthFlow | 2 min |
| 10 | Update AuthContext | 5 min |
| 11 | Wrap App with Provider | 3 min |
| 12 | Update LoginForm | 2 min |
| 13 | Update ProtectedRoute | 3 min |
| 14 | Add i18n Translations | 5 min |
| 15 | Test End-to-End | 15 min |
| 16 | Clean Up Old Code | 10 min |

**Total estimated time: ~75 minutes**

---

## References

- Design Document: `docs/plans/2025-02-15-convex-auth-migration-design.md`
- [Convex Quickstart (React)](https://docs.convex.dev/quickstart/react)
- [Convex Auth OTP](https://labs.convex.dev/auth/config/otps)
- [Resend Documentation](https://resend.com/docs)
