import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { database, JournalEntry } from "../../../utils/database";
import { useDatabase } from "../../../contexts/DatabaseContext";
import {
  createJournalEntry as createJournalEntryCloud,
  updateJournalEntry as updateJournalEntryCloud,
  deleteJournalEntry as deleteJournalEntryCloud,
  getJournalEntries as getJournalEntriesCloud,
} from "../../../lib/supabase-services";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { isInitialized, isLoading: dbLoading } = useDatabase();
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    if (isInitialized && user) {
      loadEntries();
    }
  }, [isInitialized, user]);

  const loadEntries = async () => {
    if (!isInitialized || !user) return;

    try {
      setIsLoading(true);

      try {
        const cloudEntries = await getJournalEntriesCloud(user.id);
        for (const entry of cloudEntries) {
          await database.createJournalEntry(
            entry.title,
            entry.content,
            entry.id,
            {
              createdAt: entry.created_at,
              updatedAt: entry.updated_at,
              userEmail: user.email ?? null,
              journal_id: entry.journal_id, // Pass the UUID from cloud entry
            }
          );
        }
      } catch (cloudError) {
        console.warn(
          "Failed to load journal entries from Supabase:",
          cloudError
        );
      }

      const journalEntries = await database.getAllJournalEntries();
      setEntries(journalEntries);
    } catch (error) {
      console.error("Failed to load entries:", error);
      Alert.alert("Error", "Failed to load journal entries");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Please enter both title and content");
      return;
    }

    try {
      setIsLoading(true);

      let cloudSuccess = false;
      let cloudId: number | undefined;
      let cloudCreatedAt: string | undefined;
      let cloudUpdatedAt: string | undefined;

      if (editingEntry) {
        await database.updateJournalEntry(
          editingEntry.id,
          title.trim(),
          content.trim()
        );

        if (user) {
          try {
            await updateJournalEntryCloud(
              editingEntry.id,
              title.trim(),
              content.trim()
            );
            cloudSuccess = true;
            cloudId = editingEntry.id;
          } catch (cloudError) {
            console.warn(
              "Failed to update journal entry in Supabase:",
              cloudError
            );
          }
        }

        Alert.alert("Success", "Journal entry updated successfully");
      } else {
        // Generate UUID for journal_id before creating entries
        const journalId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === 'x' ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });

        if (user) {
          try {
            // Pass the UUID when creating cloud entry
            const cloudEntry = await createJournalEntryCloud(
              user.id,
              title.trim(),
              content.trim(),
              journalId
            );
            cloudId = cloudEntry?.id;
            cloudCreatedAt = cloudEntry?.created_at;
            cloudUpdatedAt = cloudEntry?.updated_at;
            cloudSuccess = Boolean(cloudId);
          } catch (cloudError) {
            console.warn(
              "Failed to create journal entry in Supabase:",
              cloudError
            );
          }
        }

        // Pass the same UUID when creating local entry
        await database.createJournalEntry(
          title.trim(),
          content.trim(),
          cloudId,
          {
            createdAt: cloudCreatedAt,
            updatedAt: cloudUpdatedAt,
            userEmail: user?.email ?? null,
            journal_id: journalId, // Pass the UUID
          }
        );

        if (!cloudSuccess) {
          console.warn("Journal entry saved locally (cloud sync pending).");
        }

        Alert.alert("Success", "Journal entry saved successfully");
      }

      setTitle("");
      setContent("");
      setEditingEntry(null);

      if (user && (cloudSuccess || cloudId)) {
        try {
          const cloudEntries = await getJournalEntriesCloud(user.id);
          for (const entry of cloudEntries) {
            await database.createJournalEntry(
              entry.title,
              entry.content,
              entry.id,
              {
                createdAt: entry.created_at,
                updatedAt: entry.updated_at,
                userEmail: user.email ?? null,
              }
            );
          }
        } catch (syncError) {
          console.warn(
            "Failed to refresh journal entries from Supabase:",
            syncError
          );
        }
      }

      await loadEntries();
    } catch (error) {
      console.error("Failed to save entry:", error);
      Alert.alert("Error", "Failed to save journal entry");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setTitle(entry.title);
    setContent(entry.content);
    setEditingEntry(entry);
  };

  const handleDelete = (entry: JournalEntry) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this journal entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await database.deleteJournalEntry(entry.id);
              if (user) {
                try {
                  await deleteJournalEntryCloud(entry.id);
                } catch (cloudError) {
                  console.warn(
                    "Failed to delete journal entry in Supabase:",
                    cloudError
                  );
                }
              }
              Alert.alert("Success", "Journal entry deleted successfully");
              await loadEntries();
            } catch (error) {
              console.error("Failed to delete entry:", error);
              Alert.alert("Error", "Failed to delete journal entry");
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setEditingEntry(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => {
    return (
      <View
        style={[styles.entryCard, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.entryHeader}>
          <Text
            style={[
              styles.title,
              styles.entryTitle,
              { color: theme.colors.text },
            ]}
          >
            {item.title}
          </Text>
          <View style={styles.entryActions}>
            <TouchableOpacity
              style={[
                styles.smallButton,
                { backgroundColor: theme.colors.background },
              ]}
              onPress={() => handleEdit(item)}
            >
              <Ionicons name="pencil" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.smallButton,
                { backgroundColor: theme.colors.background },
              ]}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        <Text
          style={[
            styles.text,
            styles.entryContent,
            { color: theme.colors.text },
          ]}
          numberOfLines={3}
        >
          {item.content}
        </Text>
        <Text style={[styles.entryDate, { color: theme.colors.textSecondary }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    );
  };

  if (!isInitialized || dbLoading) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            Initializing Journal...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: theme.colors.background },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Journal
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
        >
          Write your thoughts and feelings
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <View
                style={[
                  styles.inputSection,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    styles.titleInput,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Entry title..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  returnKeyType="next"
                />
                <TextInput
                  style={[
                    styles.input,
                    styles.contentInput,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Write your thoughts here..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  textAlignVertical="top"
                  maxLength={2000}
                  blurOnSubmit={false}
                />

                <View style={styles.buttonContainer}>
                  {editingEntry && (
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.cancelButton,
                        { backgroundColor: theme.colors.surface },
                      ]}
                      onPress={handleCancel}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          { color: theme.colors.text },
                        ]}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.saveButton,
                      { backgroundColor: theme.colors.primary },
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.buttonText, styles.saveButtonText]}>
                        {editingEntry ? "Update" : "Save"} Entry
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.entriesSection}>
                <View style={styles.entriesHeader}>
                  <Text
                    style={[
                      styles.title,
                      styles.entriesTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    Your Entries ({entries.length})
                  </Text>
                  <TouchableOpacity
                    onPress={loadEntries}
                    style={[
                      styles.smallButton,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <Ionicons
                      name="refresh"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.text,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Loading entries...
                    </Text>
                  </View>
                ) : entries.length === 0 ? (
                  <Text
                    style={[
                      styles.text,
                      styles.emptyText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    No journal entries yet. Start writing!
                  </Text>
                ) : (
                  <View>
                    {entries.map((item) => (
                      <View key={item.id.toString()}>
                        {renderEntry({ item })}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  inputSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  titleInput: {
    marginBottom: 12,
  },
  contentInput: {
    height: 100,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  button: {
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  smallButton: {
    padding: 8,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: "#C7C7CC",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#FFFFFF",
  },
  entriesSection: {
    flex: 1,
    margin: 16,
  },
  entriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  entriesList: {
    paddingBottom: 20,
  },
  entryCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  entriesTitle: {
    fontSize: 20,
  },
  entryTitle: {
    fontSize: 18,
    flex: 1,
    marginRight: 12,
  },
  text: {
    fontSize: 16,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  entryActions: {
    flexDirection: "row",
    gap: 8,
  },
  entryContent: {
    lineHeight: 22,
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontStyle: "italic",
  },
});
