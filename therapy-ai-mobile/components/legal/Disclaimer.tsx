import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Disclaimer() {
  return (
    <View style={styles.disclaimer}>
      <Text style={styles.disclaimerText}>
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
    color: "#856404",
    lineHeight: 20,
  },
});
