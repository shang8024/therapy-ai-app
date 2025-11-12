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
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUserId = user?.id ?? null;

  // Reset initialization when user logs out
  useEffect(() => {
    if (!currentUserId) {
      setIsInitialized(false);
    }
  }, [currentUserId]);

  // Initialize database when user is available
  useEffect(() => {
    let cancelled = false;

    const initializeDatabase = async () => {
      setIsInitialized(false);
      try {
        setIsLoading(true);
        setError(null);
        database.setUser(user ? { id: user.id, email: user.email ?? null } : null);

        if (!user) {
          console.log("Database reset: no authenticated user");
          return;
        }

        await database.init();
        if (!cancelled) {
          setIsInitialized(true);
          console.log(`Database initialized successfully for user ${user.id}`);
        }
      } catch (err) {
        console.error("Failed to initialize database:", err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to initialize database",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    initializeDatabase();

    return () => {
      cancelled = true;
    };
  }, [user]);

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
