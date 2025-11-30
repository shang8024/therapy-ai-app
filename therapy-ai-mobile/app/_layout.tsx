import {
  Slot,
  router,
  usePathname,
  useSegments,
  useRootNavigationState,
} from "expo-router";
import { AppProviders } from "@/contexts/AppProvider";
import React from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";
import LoadingScreen from "@/components/LoadingScreen";
import { LEGAL_ACCEPT_KEY } from "@/constants/legal";
import { migrateNotificationsIfNeeded } from "@/lib/notifications";
import { useAuth } from "@/contexts/AuthContext";

function RootLayoutNav() {
  const { session, loading: authLoading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();
  const [accepted, setAccepted] = React.useState<boolean | null>(null);
  const [bootDone, setBootDone] = React.useState(false);
  const pendingTargetRef = React.useRef<string | null>(null);
  const handledNotificationRef = React.useRef<string | null>(null);

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

  // Handle notification responses (taps on notifications)
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  React.useEffect(() => {
    if (!rootNavigationState?.key) return; // Wait for router to be ready
    if (lastNotificationResponse) {
      const notificationId =
        lastNotificationResponse.notification.request.identifier;

      // Skip if we've already handled this notification
      if (handledNotificationRef.current === notificationId) {
        return;
      }

      const target = lastNotificationResponse.notification.request.content.data
        ?.target as string | undefined;
      if (target) {
        // If user is already in the app (not on auth screens), they must have accepted
        const isInApp = segments[0] === "(tabs)";
        const canNavigate = session && (accepted || isInApp);

        if (canNavigate) {
          // Mark as handled before navigating
          handledNotificationRef.current = notificationId;
          setImmediate(() => {
            console.log("🚀 Navigating to:", target);
            router.push(target);
          });
        } else {
          pendingTargetRef.current = target;
        }
      }
    }
  }, [
    lastNotificationResponse,
    accepted,
    session,
    rootNavigationState?.key,
    segments,
  ]);

  React.useEffect(() => {
    if (!bootDone || authLoading) return;
    if (accepted) {
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
  }, [bootDone, accepted, pathname, authLoading]);

  // Protect routes - redirect to login if not authenticated
  React.useEffect(() => {
    if (authLoading || !bootDone) return;

    const first = segments[0];
    const isProtected = first === "(tabs)";
    const isAuthRoute = first === "(auth)";

    // Legal gate first
    if (!accepted && pathname !== "/legal") {
      router.replace("/legal");
      return;
    }

    // Auth protection for protected routes
    if (accepted && !session && !isAuthRoute) {
      router.replace("/(auth)/login");
      return;
    } else if (accepted && session && !isProtected) {
      // If user is logged in and past legal, prefer any pending deep-link target from notifications
      const pending = pendingTargetRef.current;
      if (pending && pathname !== pending) {
        pendingTargetRef.current = null;
        router.replace(pending);
        return;
      }
      // Otherwise, go to dashboard
      router.replace("/(tabs)/dashboard");
    }
  }, [accepted, session, authLoading, segments, pathname, bootDone]);

  // Listen for 'legal-accepted' event to update state immediately
  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener("legal-accepted", () => {
      setAccepted(true);
    });
    return () => sub.remove();
  }, []);

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
