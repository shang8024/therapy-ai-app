import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { isInitialized, isLoading: dbLoading } = useDatabase();
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    if (isInitialized) {
      loadEntries();
    }
  }, [isInitialized, user]);

  const loadEntries = async () => {
    if (!isInitialized) return;

    try {
      setIsLoading(true);

      if (user) {
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
        } catch (cloudError) {
          console.warn("Failed to load journal entries from Supabase:", cloudError);
        }
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
          content.trim(),
        );

        if (user) {
          try {
            await updateJournalEntryCloud(editingEntry.id, title.trim(), content.trim());
            cloudSuccess = true;
            cloudId = editingEntry.id;
          } catch (cloudError) {
            console.warn("Failed to update journal entry in Supabase:", cloudError);
          }
        }

        Alert.alert("Success", "Journal entry updated successfully");
      } else {
        if (user) {
          try {
            const cloudEntry = await createJournalEntryCloud(user.id, title.trim(), content.trim());
            cloudId = cloudEntry?.id;
            cloudCreatedAt = cloudEntry?.created_at;
            cloudUpdatedAt = cloudEntry?.updated_at;
            cloudSuccess = Boolean(cloudId);
          } catch (cloudError) {
            console.warn("Failed to create journal entry in Supabase:", cloudError);
          }
        }

        await database.createJournalEntry(
          title.trim(),
          content.trim(),
          cloudId,
          {
            createdAt: cloudCreatedAt,
            updatedAt: cloudUpdatedAt,
            userEmail: user?.email ?? null,
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
          console.warn("Failed to refresh journal entries from Supabase:", syncError);
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
                      console.warn("Failed to delete journal entry in Supabase:", cloudError);
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
      ],
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
      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryTitle}>{item.title}</Text>
          <View style={styles.entryActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(item)}
            >
              <Ionicons name="pencil" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.entryContent} numberOfLines={3}>
          {item.content}
        </Text>
        <Text style={styles.entryDate}>{formatDate(item.createdAt)}</Text>
      </View>
    );
  };

  if (!isInitialized || dbLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Initializing Journal...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Journal</Text>
          <Text style={styles.headerSubtitle}>
            Write your thoughts and feelings
          </Text>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.titleInput}
            placeholder="Entry title..."
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <TextInput
            style={styles.contentInput}
            placeholder="Write your thoughts here..."
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />

          <View style={styles.buttonContainer}>
            {editingEntry && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.disabledButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingEntry ? "Update" : "Save"} Entry
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.entriesSection}>
          <View style={styles.entriesHeader}>
            <Text style={styles.entriesTitle}>
              Your Entries ({entries.length})
            </Text>
            <TouchableOpacity
              onPress={loadEntries}
              style={styles.refreshButton}
            >
              <Ionicons name="refresh" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading entries...</Text>
            </View>
          ) : entries.length === 0 ? (
            <Text style={styles.emptyText}>
              No journal entries yet. Start writing!
            </Text>
          ) : (
            <FlatList
              data={entries}
              renderItem={renderEntry}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.entriesList}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E7",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#8E8E93",
  },
  inputSection: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: "#E5E5E7",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#F8F9FA",
  },
  contentInput: {
    borderWidth: 1,
    borderColor: "#E5E5E7",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
    marginBottom: 16,
    backgroundColor: "#F8F9FA",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cancelButton: {
    backgroundColor: "#8E8E93",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: "#C7C7CC",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
  entriesTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#F2F2F7",
  },
  entriesList: {
    paddingBottom: 20,
  },
  entryCard: {
    backgroundColor: "#FFFFFF",
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
  entryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1,
    marginRight: 12,
  },
  entryActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#F2F2F7",
  },
  entryContent: {
    fontSize: 16,
    color: "#3A3A3C",
    lineHeight: 22,
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 14,
    color: "#8E8E93",
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#8E8E93",
    marginTop: 40,
    fontStyle: "italic",
  },
});
