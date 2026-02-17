import React, { createContext, useContext, ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { IS_PLATFORM } from "../constants/config";

interface User {
  email?: string;
  username?: string; // For backward compatibility
  id?: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null; // Kept for interface compatibility, but unused with Convex
  login: (username: string, password: string) => Promise<AuthResponse>; // Deprecated - kept for compatibility
  register: (username: string, password: string) => Promise<AuthResponse>; // Deprecated - kept for compatibility
  logout: () => void;
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

  // Get onboarding status from Convex (only when authenticated)
  const onboardingStatus = useQuery(
    api.userProfile.hasCompletedOnboarding,
    isAuthenticated ? {} : "skip"
  );

  // Platform mode bypass (existing behavior)
  if (IS_PLATFORM) {
    const platformValue: AuthContextValue = {
      user: { email: "platform-user", username: "platform-user" },
      token: null,
      login: async () => ({ success: true }),
      register: async () => ({ success: true }),
      logout: () => {},
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

  // For now, we use a placeholder user when authenticated
  const user: User | null = isAuthenticated
    ? {
        email: "authenticated-user",
        username: "authenticated-user",
        id: "convex-user",
      }
    : null;

  const logout = (): void => {
    signOut().catch((error: unknown) => {
      console.error("Logout error:", error);
    });
  };

  // Deprecated methods - kept for backward compatibility
  // These now return errors since we use OTP flow
  const login = async (): Promise<AuthResponse> => {
    console.warn("login() is deprecated with Convex OTP auth. Use OTPAuthFlow component instead.");
    return { success: false, error: "Use OTP authentication" };
  };

  const register = async (): Promise<AuthResponse> => {
    console.warn("register() is deprecated with Convex OTP auth. Use OTPAuthFlow component instead.");
    return { success: false, error: "Use OTP authentication" };
  };

  const refreshOnboardingStatus = async (): Promise<void> => {
    // Convex queries auto-refresh, no manual refresh needed
  };

  const value: AuthContextValue = {
    user,
    token: null, // Convex manages sessions, no JWT token
    login,
    register,
    logout,
    // Loading if Convex is loading OR if authenticated but onboarding status not yet fetched
    isLoading: isConvexLoading || (isAuthenticated && onboardingStatus === undefined),
    isAuthenticated,
    needsSetup: false, // No setup needed with Convex OTP
    hasCompletedOnboarding: onboardingStatus ?? false,
    refreshOnboardingStatus,
    error: null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
