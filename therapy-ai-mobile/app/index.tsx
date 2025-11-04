// app/index.tsx
import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return null; // LoadingScreen will be shown by _layout
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
