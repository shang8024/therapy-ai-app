import { Slot, router, usePathname } from "expo-router";
import { AppProviders } from "@/contexts/AppProvider";
import React from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingScreen from "@/components/LoadingScreen";
import { LEGAL_ACCEPT_KEY } from "@/constants/legal";
import { migrateNotificationsIfNeeded } from "@/lib/notifications";

export default function RootLayout() {
  const [accepted, setAccepted] = React.useState<boolean | null>(null);
  const [bootDone, setBootDone] = React.useState(false);
  const pendingTargetRef = React.useRef<string | null>(null);
  const pathname = usePathname();

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
        if (accepted) router.push(target);
        else pendingTargetRef.current = target;
      }
    );
    return () => sub.remove();
  }, [accepted]);

  React.useEffect(() => {
    (async () => {
      const last = await Notifications.getLastNotificationResponseAsync();
      const target = last?.notification.request.content.data?.target as
        | string
        | undefined;
      if (target) {
        if (accepted) router.push(target);
        else pendingTargetRef.current = target;
      }
    })();
  }, [accepted]);

  React.useEffect(() => {
    if (!bootDone) return;
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
  }, [bootDone, accepted, pathname]);

  if (!bootDone) return <LoadingScreen />;
  return (
    <AppProviders>
      <Slot />
    </AppProviders>
  );
}
