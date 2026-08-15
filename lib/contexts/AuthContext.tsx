/**
 * Authentication Context
 *
 * Provides authentication state and actions throughout the app
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserRole } from "@/lib/constants";

// localStorage key for cached user data
const CACHED_USER_KEY = "myharvesthub_user";
const REMEMBER_ME_KEY = "myharvesthub_remember_me";

function getCachedUser(): AuthUser | null {
  try {
    const data = typeof window !== "undefined" ? localStorage.getItem(CACHED_USER_KEY) : null;
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: AuthUser | null): void {
  try {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CACHED_USER_KEY);
    }
  } catch {
    // localStorage may be unavailable
  }
}

// Auth User interface (frontend representation)
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  role: UserRole;
  profilePicture?: string | null;
  emailVerified: boolean;
  isActive: boolean;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  // Buyer-specific
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  // Vendor-specific
  storeName?: string;
  storeDescription?: string;
  category?: string;
  whatsappNumber?: string;
  campus?: string;
  position?: string;
  isChurchAffiliated?: boolean;
}

// Registration response (surface the email-delivery outcome so callers can react).
export interface RegisterResponse {
  success?: boolean;
  needsEmailVerification?: boolean;
  emailDelivered?: boolean;
  user?: AuthUser;
}

// Auth context type
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials & { rememberMe?: boolean }) => Promise<void>;
  register: (data: RegisterData) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user — network-resilient with localStorage fallback
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setCachedUser(data.user);
      } else if (response.status === 401) {
        // Explicitly unauthorized — clear cached data
        setUser(null);
        setCachedUser(null);
      } else {
        // Other errors (500, etc.) — use cached data if available
        const cached = getCachedUser();
        if (cached) {
          setUser(cached);
        } else {
          setUser(null);
        }
      }
    } catch {
      // Network error (offline) — preserve cached auth state
      const cached = getCachedUser();
      if (cached) {
        setUser(cached);
      }
      // If no cached user, leave user as-is (null from initial state)
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Login function
  const login = async (credentials: LoginCredentials & { rememberMe?: boolean }) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    setUser(data.user);
    setCachedUser(data.user);

    // Persist "remember me" preference
    try {
      if (credentials.rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, "true");
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
    } catch {
      // ignore
    }
  };

  // Register function
  const register = async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    const responseData = await response.json();

    // If email verification is required, do not set user as logged in yet.
    if (responseData.needsEmailVerification) {
      setUser(null);
      setCachedUser(null);
      return responseData;
    }

    setUser(responseData.user);
    setCachedUser(responseData.user);

    return responseData;
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setCachedUser(null);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    await fetchUser();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// Role check hooks
export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === UserRole.ADMIN;
}

export function useIsVendor() {
  const { user } = useAuth();
  return user?.role === UserRole.VENDOR;
}

export function useIsBuyer() {
  const { user } = useAuth();
  return user?.role === UserRole.BUYER;
}

// Require auth hooks (throws if not authenticated)
export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (!isLoading && !isAuthenticated) {
    throw new Error("Authentication required");
  }

  return { user, isLoading };
}

export function useRequireRole(role: UserRole) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (!isLoading && !isAuthenticated) {
    throw new Error("Authentication required");
  }

  if (!isLoading && user?.role !== role) {
    throw new Error(`${role} role required`);
  }

  return { user, isLoading };
}
