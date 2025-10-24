import { Slot } from "expo-router";
import { AppProviders } from "@/contexts/AppProvider";

export default function RootLayout() {
  return (
    <AppProviders>
      <AppProviders>
        <Slot />
      </AppProviders>
    </AppProviders>
  );
}
