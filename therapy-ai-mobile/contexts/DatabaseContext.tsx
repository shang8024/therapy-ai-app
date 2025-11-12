// contexts/DatabaseContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { database } from "../utils/database";
import { useAuth } from "./AuthContext";

interface DatabaseContextValue {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({
  children,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const currentUserId = user?.id || null;

  // Reset initialization when user logs out
  useEffect(() => {
    if (!currentUserId) {
      setIsInitialized(false);
    }
  }, [currentUserId]);

  // Initialize database when user is available
  useEffect(() => {
    const initializeDatabase = async () => {
      if (!currentUserId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        await database.init(currentUserId);
        setIsInitialized(true);
        console.log("Database initialized successfully");
      } catch (err) {
        console.error("Failed to initialize database:", err);
        setError(
          err instanceof Error ? err.message : "Failed to initialize database"
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, [currentUserId]);

  const value: DatabaseContextValue = {
    isInitialized,
    isLoading,
    error,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};
