import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ChatProvider } from "../contexts/ChatContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ChatProvider>
        <Slot />
      </ChatProvider>
    </SafeAreaProvider>
  );
}
