"use client";

import { createContext, useContext, useState, useEffect, ReactNode, ReactElement } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import { antdTheme as customAntdTheme, antdDarkTheme } from "@/lib/theme/antd-theme";
import type { UserFormData } from "@/lib/types";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import ToastProvider from "@/lib/contexts/ToastContext";
import { clearLocalDraft, loadLocalDraft, saveLocalDraft } from "@/lib/utils/localDraft";

// ============================================================================
// FORM DATA CONTEXT (for multi-step forms)
// ============================================================================

interface FormDataContextType {
  formData: Partial<UserFormData>;
  updateFormData: (newData: Partial<UserFormData>) => void;
  resetFormData: () => void;
}

const FormDataContext = createContext<FormDataContextType | undefined>(undefined);
const SIGNUP_FORM_DRAFT_KEY = "myharvesthub.signup.form-data.v1";
const SIGNUP_DRAFT_ALLOWED_KEYS: (keyof UserFormData)[] = [
  "email",
  "firstName",
  "lastName",
  "phoneNumber",
  "dateOfBirth",
  "gender",
  "userType",
  "storeName",
  "storeType",
  "storeCategory",
  "whatsappNumber",
  "campus",
  "position",
  "storeDescription",
  "businessAddress",
  "bankName",
  "accountName",
  "accountNumber",
  "serviceCategory",
  "isChurchAffiliated",
  "serviceLocation",
  "username",
  "bio",
  "profilePicture",
  "verificationDocuments",
  "password",
  "agreement",
];

export function useFormData(): FormDataContextType {
  const context = useContext(FormDataContext);
  if (context === undefined) {
    throw new Error("useFormData must be used within a FormDataProvider");
  }
  return context;
}

export function FormDataProvider({ children }: { children: ReactNode }): ReactElement {
  const [formData, setFormData] = useState<Partial<UserFormData>>({});

  const sanitizeDraft = (draft: Partial<UserFormData>): Partial<UserFormData> => {
    const safeDraft: Partial<UserFormData> = {};
    for (const key of SIGNUP_DRAFT_ALLOWED_KEYS) {
      if (draft[key] !== undefined) {
        (safeDraft as Record<string, unknown>)[key] = draft[key];
      }
    }
    return safeDraft;
  };

  useEffect(() => {
    const draft = loadLocalDraft<Partial<UserFormData>>(SIGNUP_FORM_DRAFT_KEY);
    if (draft) {
      setFormData(sanitizeDraft(draft));
    }
  }, []);

  const updateFormData = (newData: Partial<UserFormData>): void => {
    setFormData((prevData) => {
      const merged = { ...prevData, ...newData };
      saveLocalDraft(SIGNUP_FORM_DRAFT_KEY, merged);
      return merged;
    });
  };

  const resetFormData = (): void => {
    setFormData({});
    clearLocalDraft(SIGNUP_FORM_DRAFT_KEY);
  };

  return (
    <FormDataContext.Provider value={{ formData, updateFormData, resetFormData }}>
      {children}
    </FormDataContext.Provider>
  );
}

// ============================================================================
// THEME CONTEXT (for light/dark mode)
// ============================================================================

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as ThemeMode | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setMode(savedTheme || (prefersDark ? "dark" : "light"));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("theme", mode);
      document.documentElement.classList.toggle("dark", mode === "dark");
    }
  }, [mode, mounted]);

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// ROOT PROVIDERS (combines all providers)
// ============================================================================

export function Providers({ children }: { children: ReactNode }): ReactElement {
  return (
    <AntdRegistry>
      <ThemeProvider>
        <AntdThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <ToastProvider>
                <FormDataProvider>{children}</FormDataProvider>
              </ToastProvider>
            </NotificationProvider>
          </AuthProvider>
        </AntdThemeProvider>
      </ThemeProvider>
    </AntdRegistry>
  );
}

// Internal Ant Design theme wrapper
function AntdThemeProvider({ children }: { children: ReactNode }): ReactElement {
  const { mode } = useTheme();

  return (
    <ConfigProvider
      theme={mode === "dark" ? antdDarkTheme : customAntdTheme}
      componentSize="middle"
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
