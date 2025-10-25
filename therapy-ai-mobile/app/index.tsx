// app/index.tsx
import React from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LEGAL_ACCEPT_KEY } from "@/constants/legal";
import LoadingScreen from "@/components/LoadingScreen";

export default function Index() {
  const [ready, setReady] = React.useState(false);
  const [accepted, setAccepted] = React.useState<boolean | null>(null);

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

    if (!ready) return <LoadingScreen />;

    if (accepted) return <Redirect href="/(tabs)/dashboard" />;
  return <Redirect href="/legal" />; // first launch → legal gate
}
