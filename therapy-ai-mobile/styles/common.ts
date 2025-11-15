import { StyleSheet } from "react-native";

/**
 * Common styles shared across multiple screens
 * Use these base styles and extend with specific overrides
 */
export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // Header styles
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerWithBorder: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },

  // Section styles
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionContent: {
    borderRadius: 12,
    marginHorizontal: 15,
    overflow: "hidden",
  },

  // Text styles
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  text: {
    fontSize: 16,
  },
  textSmall: {
    fontSize: 14,
  },

  // Input styles
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },

  // Button styles
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLarge: {
    height: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextSmall: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Footer styles
  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },

  // Card styles
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },

  // List styles
  listContainer: {
    paddingVertical: 8,
  },
});
