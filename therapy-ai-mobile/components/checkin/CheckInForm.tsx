import React from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import EmojiPicker from "./EmojiPicker";
import { MOOD_LEVELS } from "@/constants/checkin";
import { useCheckin } from "@/contexts/CheckinContext";
import { useTheme } from "@/contexts/ThemeContext";
import { checkinStyles } from "@/styles/checkin";

const CheckinForm: React.FC = () => {
  const { draft, setDraft, save, cancelEdit, record } = useCheckin();
  const { theme } = useTheme();

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
      <View style={[checkinStyles.sectionCard, { backgroundColor: theme.colors.surface }]}>
        <View style={checkinStyles.sectionCheckin}>
          <Text
            style={[checkinStyles.sectionTitle, { color: theme.colors.text }]}
          >
            How are you feeling today?
          </Text>
          <Text style={[checkinStyles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Select your current mood
          </Text>
          <View style={checkinStyles.emojiPickerContainer}>
            <EmojiPicker
              options={MOOD_LEVELS}
              selectedValue={draft.mood}
              onChange={(m) => setDraft((d) => ({ ...d, mood: m }))}
            />
          </View>
        </View>
      </View>

      <View style={[checkinStyles.sectionCard, { backgroundColor: theme.colors.surface }]}>
        <View style={checkinStyles.sectionCheckin}>
          <Text
            style={[checkinStyles.sectionTitle, { color: theme.colors.text }]}
          >
            Additional notes
          </Text>
          <Text style={[checkinStyles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Share any thoughts or feelings
          </Text>
          <TextInput
            style={[
              checkinStyles.input,
              checkinStyles.notesInput,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={draft.notes}
            onChangeText={(t) => setDraft((d) => ({ ...d, notes: t }))}
            placeholder="How was your day? Any thoughts or feelings you'd like to share?"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12, display: "flex" }}>
        {record && (
          <TouchableOpacity
            style={[
              checkinStyles.button,
              checkinStyles.buttonCheckin,
              { flex: 1, backgroundColor: theme.colors.surface },
            ]}
            onPress={cancelEdit}
          >
            <Text
              style={[
                checkinStyles.buttonText,
                checkinStyles.buttonTextCheckin,
                { color: theme.colors.text },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            checkinStyles.button,
            checkinStyles.buttonCheckin,
            { flex: 1, backgroundColor: theme.colors.primary },
          ]}
          onPress={handleSave}
        >
          <Text
            style={[
              checkinStyles.buttonText,
              checkinStyles.buttonTextCheckin,
              { color: "#ffffff" },
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default CheckinForm;
