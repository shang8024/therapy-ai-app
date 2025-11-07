import { Slot, router, usePathname, useSegments } from "expo-router";
import { AppProviders } from "@/contexts/AppProvider";
import React from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingScreen from "@/components/LoadingScreen";
import { LEGAL_ACCEPT_KEY } from "@/constants/legal";
import { migrateNotificationsIfNeeded } from "@/lib/notifications";
import { useAuth } from "@/contexts/AuthContext";

function RootLayoutNav() {
  const { session, loading: authLoading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const [accepted, setAccepted] = React.useState<boolean | null>(null);
  const [bootDone, setBootDone] = React.useState(false);
  const pendingTargetRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(LEGAL_ACCEPT_KEY);
        setAccepted(v === "true");
      } finally {
        setBootDone(true);
      }
    })();
  }, []);

  React.useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (resp) => {
        const target = resp.notification.request.content.data?.target as
          | string
          | undefined;
        if (!target) return;
        if (accepted && session) router.push(target);
        else pendingTargetRef.current = target;
      }
    );
    return () => sub.remove();
  }, [accepted, session]);

  React.useEffect(() => {
    (async () => {
      const last = await Notifications.getLastNotificationResponseAsync();
      const target = last?.notification.request.content.data?.target as
        | string
        | undefined;
      if (target) {
        if (accepted && session) router.push(target);
        else pendingTargetRef.current = target;
      }
    })();
  }, [accepted, session]);

  React.useEffect(() => {
    if (!bootDone || authLoading) return;
    if (accepted && session) {
      (async () => {
        try {
          await migrateNotificationsIfNeeded();
        } finally {
          const pending = pendingTargetRef.current;
          if (pending && pathname !== pending) {
            pendingTargetRef.current = null;
            router.push(pending);
          }
        }
      })();
    }
  }, [bootDone, accepted, pathname, session, authLoading]);

  // Protect routes - redirect to login if not authenticated
  React.useEffect(() => {
    if (authLoading || !bootDone) return;

    const inAuthGroup = segments[0] === "(tabs)" || segments[0] === "index";
    const isAuthRoute = pathname === "/login" || pathname === "/signup" || pathname === "/legal";

    if (!session && inAuthGroup && !isAuthRoute) {
      // Redirect to login if trying to access protected route
      router.replace("/login");
    } else if (session && (pathname === "/login" || pathname === "/signup")) {
      // Redirect to dashboard if already logged in and trying to access auth routes
      router.replace("/(tabs)/dashboard");
    }
  }, [session, authLoading, segments, pathname, bootDone]);

  if (!bootDone || authLoading) return <LoadingScreen />;
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
