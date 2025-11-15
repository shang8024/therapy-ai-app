import { StyleSheet } from "react-native";
import { commonStyles } from "./common";

export const checkinStyles = StyleSheet.create({
  // Explicitly select only the needed common styles
  ...(commonStyles.container && { container: commonStyles.container }),
  ...(commonStyles.title && { title: commonStyles.title }),
  sectionCheckin: {
    marginBottom: 24,
  },
  notesInput: {
    minHeight: 100,
  },
  buttonCheckin: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  buttonTextCheckin: {
    fontSize: 18,
  },
});
