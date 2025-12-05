// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Tabs, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LEGAL_ACCEPT_KEY } from "@/constants/legal";
import LoadingScreen from "@/components/LoadingScreen";
import { useTheme } from "@/contexts/ThemeContext";

export default function ProtectedTabsLayout() {
  const [ready, setReady] = React.useState(false);
  const [accepted, setAccepted] = React.useState<boolean | null>(null);
  const { theme } = useTheme();

  React.useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(LEGAL_ACCEPT_KEY);
        setAccepted(v === "true");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    if (!accepted) router.replace("/legal");
  }, [ready, accepted]);

  if (!ready) return <LoadingScreen />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        lazy: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
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
              name="chatbubble-outline"
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
              name="heart-outline"
              size={Number(size)}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="journal/index"
        options={{
          title: "Journal",
          tabBarLabel: "Journal",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="book-outline"
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
