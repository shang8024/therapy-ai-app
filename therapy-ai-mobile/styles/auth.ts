import { StyleSheet } from "react-native";
import { commonStyles } from "./common";

/**
 * Common authentication screen styles for login and signup
 * Extends commonStyles for shared patterns
 */
export const authStyles = StyleSheet.create({
  ...commonStyles,
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  headerAuth: {
    marginBottom: 40,
    alignItems: "center",
  },
  titleAuth: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputAuth: {
    height: 56,
    paddingHorizontal: 18,
    borderRadius: 14,
    fontSize: 16,
  },
  buttonAuth: {
    height: 56,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontWeight: "600",
  },
});
