// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // boolean
        tabBarShowLabel: true, // boolean
        lazy: true, // boolean
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="analytics-outline"
              size={Number(size)}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarLabel: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="chatbubbles-outline"
              size={Number(size)}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="checkin/index"
        options={{
          title: "Check-in",
          tabBarLabel: "Check-in",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="calendar-outline"
              size={Number(size)}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="settings-outline"
              size={Number(size)}
              color={String(color)}
            />
          ),
        }}
      />
    </Tabs>
  );
}
