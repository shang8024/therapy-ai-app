// context/AppProviders.tsx
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DatabaseProvider } from "./DatabaseContext";
import { CheckinProvider } from "./CheckinContext";
import { ChatProvider } from "./ChatContext";
import { ThemeProvider } from "./ThemeContext";

export const AppProviders: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DatabaseProvider>
          <CheckinProvider>
            <ChatProvider>{children}</ChatProvider>
          </CheckinProvider>
        </DatabaseProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};
