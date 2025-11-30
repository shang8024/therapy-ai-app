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
import LoadingScreen from "@/components/LoadingScreen";
import { LEGAL_ACCEPT_KEY } from "@/constants/legal";
import { migrateNotificationsIfNeeded } from "@/lib/notifications";
import { useAuth } from "@/contexts/AuthContext";

function RootLayoutNav() {
  const { session, user, loading: authLoading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();
  const [accepted, setAccepted] = React.useState<boolean | null>(null);
  const [bootDone, setBootDone] = React.useState(false);
  const pendingTargetRef = React.useRef<string | null>(null);
  const handledNotificationRef = React.useRef<string | null>(null);
  const hasMigratedRef = React.useRef(false);

  const isReady = bootDone && !authLoading;

  const firstSegment = segments[0];
  const isAppRoute = firstSegment === "(tabs)" || firstSegment === "index";
  const isAuthRoute = firstSegment === "(auth)";

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

  // Legal gate + notification migration
  React.useEffect(() => {
    if (!isReady) return;

    // If legal not accepted, always redirect to /legal
    if (!accepted && pathname !== "/legal") {
      router.replace("/legal");
      return;
    }

    // Only run migration + pending navigation once when we're fully ready
    if (!accepted || !session || !user?.id) return;

    if (hasMigratedRef.current) {
      const pending = pendingTargetRef.current;
      if (pending && pathname !== pending) {
        pendingTargetRef.current = null;
        router.push(pending);
      }
      return;
    }

    (async () => {
      try {
        await migrateNotificationsIfNeeded();
        hasMigratedRef.current = true;
      } finally {
        const pending = pendingTargetRef.current;
        if (pending && pathname !== pending) {
          pendingTargetRef.current = null;
          router.push(pending);
        }
      }
    })();
  }, [isReady, accepted, pathname, session, user?.id]);

  // Protect routes - redirect to login if not authenticated (after legal accepted)
  React.useEffect(() => {
    if (!isReady || !accepted) return;

    if (!session && isAppRoute && !isAuthRoute) {
      // Redirect to login if trying to access protected route
      router.replace("/(auth)/login");
    } else if (session && isAuthRoute) {
      // Redirect to dashboard if already logged in and trying to access auth routes
      router.replace("/(tabs)/dashboard");
    }
  }, [isReady, accepted, session, isAppRoute, isAuthRoute]);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
