import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useCheckin } from "@/contexts/CheckinContext";
import { MOOD_LEVELS } from "@/constants/checkin";

const CheckinRecord: React.FC = () => {
  const { record, startEdit } = useCheckin();

  const moodInfo = useMemo(
    () => MOOD_LEVELS.find((m) => m.value === record?.mood),
    [record?.mood],
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.sectionTitle}>Today’s Status</Text>
        <TouchableOpacity onPress={startEdit} style={styles.changeBtn}>
          <Text style={styles.changeBtnText}>Change</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.moodRow}>
        <View
          style={[
            styles.moodBadge,
            {
              borderColor: moodInfo?.color ?? "#e1e8ed",
              backgroundColor: "#fff",
            },
          ]}
        >
          <Text style={styles.moodEmojiReadonly}>{moodInfo?.emoji ?? "—"}</Text>
          <Text style={styles.moodLabelReadonly}>{moodInfo?.label ?? "—"}</Text>
        </View>
      </View>

      <View>
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Notes</Text>
        <Text style={styles.notesReadonly}>
          {record?.notes?.trim()?.length ? record!.notes : "No notes."}
        </Text>
      </View>
    </View>
  );
};

export default CheckinRecord;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    marginBottom: 24,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#2c3e50" },
  changeBtn: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#eef6ff",
  },
  changeBtnText: { color: "#1d72e8", fontSize: 13, fontWeight: "600" },
  moodRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  moodBadge: {
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 96,
  },
  moodEmojiReadonly: { fontSize: 30, marginBottom: 4 },
  moodLabelReadonly: { fontSize: 12, color: "#7f8c8d", fontWeight: "600" },
  notesReadonly: {
    marginTop: 6,
    fontSize: 15,
    color: "#34495e",
    lineHeight: 21,
  },
});
