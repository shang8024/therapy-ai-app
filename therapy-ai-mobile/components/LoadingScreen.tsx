import React from "react";
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  useColorScheme,
} from "react-native";

const LoadingScreen: React.FC<{ text?: string }> = ({ text = "Loading…" }) => {
  const isDark = useColorScheme() === "dark";
  return (
    <View
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <ActivityIndicator size="large" color={isDark ? "#9ec1ff" : "#1d72e8"} />
      <Text style={[styles.text, { color: isDark ? "#cfd8e3" : "#5f6e77" }]}>
        {text}
      </Text>
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { marginTop: 12, fontSize: 14 },
});
