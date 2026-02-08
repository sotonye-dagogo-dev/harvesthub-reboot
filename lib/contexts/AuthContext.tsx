/**
 * Authentication Context
 *
 * Provides authentication state and actions throughout the app
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserRole } from "@/lib/constants";

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
  isChurchAffiliated?: boolean;
}

// Auth context type
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Login function
  const login = async (credentials: LoginCredentials) => {
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
  };

  // Register function
  const register = async (data: RegisterData) => {
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
    setUser(responseData.user);
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
