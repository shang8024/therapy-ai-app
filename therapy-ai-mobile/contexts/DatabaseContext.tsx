// contexts/DatabaseContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { database } from "../utils/database";

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

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await database.init();
        setIsInitialized(true);
        console.log("Database initialized successfully");
      } catch (err) {
        console.error("Failed to initialize database:", err);
        setError(
          err instanceof Error ? err.message : "Failed to initialize database",
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

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
