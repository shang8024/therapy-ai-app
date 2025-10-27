import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Theme {
  colors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
  };
}

export const lightTheme: Theme = {
  colors: {
    background: "#F5F5F5",
    surface: "#FFFFFF",
    primary: "#007AFF",
    text: "#333333",
    textSecondary: "#666666",
    border: "#D1D1D6",
    error: "#FF3B30",
    success: "#34C759",
  },
};

export const darkTheme: Theme = {
  colors: {
    background: "#000000",
    surface: "#1C1C1E",
    primary: "#0A84FF",
    text: "#FFFFFF",
    textSecondary: "#8E8E93",
    border: "#48484A",
    error: "#FF453A",
    success: "#30D158",
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