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
    height: 50,
    paddingHorizontal: 16,
  },
  buttonAuth: {
    height: 50,
    marginTop: 10,
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
