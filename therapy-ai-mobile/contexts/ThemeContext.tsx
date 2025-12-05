import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Theme {
  colors: {
    background: string;
    surface: string;
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    accent: string;
    gradient: {
      start: string;
      end: string;
    };
  };
}

export const lightTheme: Theme = {
  colors: {
    background: "#F8F9FF",
    surface: "#FFFFFF",
    primary: "#8B5CF6",
    primaryLight: "#A78BFA",
    primaryDark: "#7C3AED",
    secondary: "#6366F1",
    text: "#1E293B",
    textSecondary: "#64748B",
    border: "#E2E8F0",
    error: "#EF4444",
    success: "#10B981",
    accent: "#EC4899",
    gradient: {
      start: "#8B5CF6",
      end: "#6366F1",
    },
  },
};

export const darkTheme: Theme = {
  colors: {
    background: "#0F172A",
    surface: "#1E293B",
    primary: "#A78BFA",
    primaryLight: "#C4B5FD",
    primaryDark: "#8B5CF6",
    secondary: "#818CF8",
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    border: "#334155",
    error: "#F87171",
    success: "#34D399",
    accent: "#F472B6",
    gradient: {
      start: "#8B5CF6",
      end: "#6366F1",
    },
  },
};

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme preference from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("appv1:darkMode");
        if (storedTheme !== null) {
          setIsDarkMode(JSON.parse(storedTheme));
        }
      } catch (error) {
        // Handle error silently, defaults to light mode
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem("appv1:darkMode", JSON.stringify(newTheme));
    } catch (error) {
      // Handle error silently
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}