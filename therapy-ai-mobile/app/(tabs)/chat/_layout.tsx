// app/(tabs)/chat/_layout.tsx
import { Stack } from "expo-router";

export default function ChatStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Chat Sessions",
        }}
      />
      <Stack.Screen
        name="[chatId]"
        options={{
          title: "Chat",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
