import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import EmojiPicker from "./EmojiPicker";
import { MOOD_LEVELS } from "@/constants/checkin";
import { useCheckin } from "@/contexts/CheckinContext";

const CheckinForm: React.FC = () => {
  const { draft, setDraft, save, cancelEdit, record } = useCheckin();

  const handleSave = async () => {
    try {
      await save();
      Alert.alert("Saved", "Your check-in has been saved for today.");
    } catch (e: any) {
      if (e?.message === "Missing mood") {
        Alert.alert("Missing Information", "Please select your mood level.");
      } else {
        Alert.alert("Save Failed", "Could not save your check-in.");
      }
    }
  };

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How are you feeling today?</Text>
        <EmojiPicker
          options={MOOD_LEVELS}
          selectedValue={draft.mood}
          onChange={(m) => setDraft((d) => ({ ...d, mood: m }))}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional notes</Text>
        <TextInput
          style={styles.notesInput}
          value={draft.notes}
          onChangeText={(t) => setDraft((d) => ({ ...d, notes: t }))}
          placeholder="How was your day? Any thoughts or feelings you'd like to share?"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity style={[styles.submitButton, { flex: 1 }]} onPress={handleSave}>
          <Text style={styles.submitButtonText}>Save</Text>
        </TouchableOpacity>
        {record && (
          <TouchableOpacity style={[styles.cancelButton, { flex: 0.5 }]} onPress={cancelEdit}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

export default CheckinForm;

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#2c3e50", marginBottom: 12 },
  notesInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: "#3498db",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "600" },
  cancelButton: {
    backgroundColor: "#eaeef3",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: { color: "#2c3e50", fontSize: 16, fontWeight: "600" },
});
