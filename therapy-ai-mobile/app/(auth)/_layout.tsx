import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { TOS_URL, PRIVACY_URL } from "@/constants/legal";
import { openUrl } from "@/lib/legal";

export default function AuthLayout() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
          animation: "fade",
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            title: "Sign In",
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            title: "Sign Up",
          }}
        />
      </Stack>

      <View style={styles.footerContainer}>
        <View style={styles.legalFooter}>
          <Text
            style={[styles.legalText, { color: theme.colors.textSecondary }]}
          >
            <Text
              style={[
                styles.legalText,
                styles.legalLink,
                { color: theme.colors.primary },
              ]}
              onPress={() => openUrl(TOS_URL)}
            >
              Terms of Service
            </Text>
            {" | "}
            <Text
              style={[
                styles.legalText,
                styles.legalLink,
                { color: theme.colors.primary },
              ]}
              onPress={() => openUrl(PRIVACY_URL)}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
  },
  legalFooter: {
    marginTop: 20,
    alignItems: "center",
  },
  legalText: {
    fontSize: 12,
    textAlign: "center",
  },
  legalLink: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
