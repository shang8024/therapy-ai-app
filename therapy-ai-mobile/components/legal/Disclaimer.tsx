import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

export default function Disclaimer() {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.disclaimer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.disclaimerText, { color: theme.colors.text }]}>
        ⚠️ Important: This app is not a substitute for professional mental
        health care. If you're experiencing a mental health emergency, please
        contact emergency services or a crisis hotline immediately.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    margin: 20,
    padding: 16,
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
