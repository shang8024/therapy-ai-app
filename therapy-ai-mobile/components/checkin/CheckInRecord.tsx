import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useCheckin } from "@/contexts/CheckinContext";
import { useTheme } from "@/contexts/ThemeContext";
import { MOOD_LEVELS } from "@/constants/checkin";
import { checkinStyles } from "@/styles/checkin";
import { AnimatedMoodItem } from "./EmojiPicker";
import { useSharedValue } from "react-native-reanimated";

const CheckinRecord: React.FC = () => {
  const { record, startEdit } = useCheckin();
  const { theme } = useTheme();
  const sidePad = useSharedValue(0);
  const scrollX = useSharedValue(0);
  const moodInfo = useMemo(
    () => MOOD_LEVELS.find((m) => m.value === record?.mood),
    [record?.mood]
  );

  return (
    <>
      <View style={checkinStyles.sectionCheckin}>
        <Text
          style={[checkinStyles.sectionTitle, { color: theme.colors.text }]}
        >
          I am feeling:
        </Text>
        <View
          style={{ alignItems: "center", paddingVertical: 6, minHeight: 200 }}
        >
          {moodInfo && (
            <AnimatedMoodItem
              item={moodInfo}
              index={0}
              selected={true}
              onPress={() => {}}
              sidePad={sidePad}
              layoutW={0}
              scrollX={scrollX}
            />
          )}
        </View>
      </View>
      <View style={checkinStyles.sectionCheckin}>
        <Text
          style={[checkinStyles.sectionTitle, { color: theme.colors.text }]}
        >
          Additional notes:
        </Text>
        <TextInput
          style={[
            checkinStyles.input,
            checkinStyles.notesInput,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          value={record?.notes || "No notes."}
          editable={false}
          multiline
        />
      </View>

      <View style={{ flexDirection: "row", gap: 12, display: "flex" }}>
        <TouchableOpacity
          style={[
            checkinStyles.button,
            checkinStyles.buttonCheckin,
            { flex: 1, backgroundColor: theme.colors.primary },
          ]}
          onPress={startEdit}
        >
          <Text style={[checkinStyles.buttonText, { color: "#ffffff" }]}>
            Edit
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default CheckinRecord;
