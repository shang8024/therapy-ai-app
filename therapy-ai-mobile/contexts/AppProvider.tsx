// context/AppProviders.tsx
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CheckinProvider } from "./CheckinContext";

export const AppProviders: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <SafeAreaProvider>
      <CheckinProvider>{children}</CheckinProvider>
    </SafeAreaProvider>
  );
};
