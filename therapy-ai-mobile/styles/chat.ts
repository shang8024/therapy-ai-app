import { StyleSheet } from "react-native";
import { commonStyles } from "./common";

/**
 * Common chat screen styles for chat index and chat session screens
 * Extends commonStyles for shared patterns
 */
export const chatStyles = StyleSheet.create({
  ...commonStyles,
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
