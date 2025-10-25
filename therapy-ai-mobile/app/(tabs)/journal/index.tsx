import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { database, JournalEntry } from '../../../utils/database';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢', label: 'Very Sad', color: '#FF3B30' },
  { value: 2, emoji: '😔', label: 'Sad', color: '#FF9500' },
  { value: 3, emoji: '😐', label: 'Neutral', color: '#FFCC00' },
  { value: 4, emoji: '😊', label: 'Happy', color: '#34C759' },
  { value: 5, emoji: '😄', label: 'Very Happy', color: '#007AFF' },
];

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      setIsLoading(true);
      await database.init();
      setIsInitialized(true);
      await loadEntries();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      Alert.alert('Error', 'Failed to initialize database. Please restart the app.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEntries = async () => {
    if (!isInitialized) return;
    
    try {
      setIsLoading(true);
      const journalEntries = await database.getAllJournalEntries();
      setEntries(journalEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
      Alert.alert('Error', 'Failed to load journal entries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please enter both title and content');
      return;
    }

    try {
      setIsLoading(true);
      
      if (editingEntry) {
        await database.updateJournalEntry(editingEntry.id, title.trim(), content.trim(), mood);
        Alert.alert('Success', 'Journal entry updated successfully');
      } else {
        await database.createJournalEntry(title.trim(), content.trim(), mood);
        Alert.alert('Success', 'Journal entry saved successfully');
      }

      setTitle('');
      setContent('');
      setMood(3);
      setEditingEntry(null);
      await loadEntries();
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Error', 'Failed to save journal entry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood);
    setEditingEntry(entry);
  };

  const handleDelete = (entry: JournalEntry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.deleteJournalEntry(entry.id);
              Alert.alert('Success', 'Journal entry deleted successfully');
              await loadEntries();
            } catch (error) {
              console.error('Failed to delete entry:', error);
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setMood(3);
    setEditingEntry(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => {
    const moodOption = MOOD_OPTIONS.find(option => option.value === item.mood) || MOOD_OPTIONS[2];
    
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
        <View style={styles.entryMoodContainer}>
          <Text style={styles.entryMoodEmoji}>{moodOption.emoji}</Text>
        </View>
        <Text style={styles.entryContent} numberOfLines={3}>
          {item.content}
        </Text>
        <Text style={styles.entryDate}>{formatDate(item.createdAt)}</Text>
      </View>
    );
  };

  if (!isInitialized) {
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Journal</Text>
          <Text style={styles.headerSubtitle}>Write your thoughts and feelings</Text>
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
          
          <View style={styles.moodSection}>
            <Text style={styles.moodLabel}>How are you feeling?</Text>
            <View style={styles.moodPicker}>
              {MOOD_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.moodOption,
                    mood === option.value && styles.moodOptionSelected,
                    { borderColor: option.color }
                  ]}
                  onPress={() => setMood(option.value)}
                >
                  <Text style={styles.moodEmoji}>{option.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            {editingEntry && (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
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
                  {editingEntry ? 'Update' : 'Save'} Entry
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.entriesSection}>
          <View style={styles.entriesHeader}>
            <Text style={styles.entriesTitle}>Your Entries ({entries.length})</Text>
            <TouchableOpacity onPress={loadEntries} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading entries...</Text>
            </View>
          ) : entries.length === 0 ? (
            <Text style={styles.emptyText}>No journal entries yet. Start writing!</Text>
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
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  inputSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  entriesSection: {
    flex: 1,
    margin: 16,
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entriesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  entriesList: {
    paddingBottom: 20,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 12,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  entryContent: {
    fontSize: 16,
    color: '#3A3A3C',
    lineHeight: 22,
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 40,
    fontStyle: 'italic',
  },
  moodSection: {
    marginBottom: 12,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  moodPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  moodOption: {
    flex: 1,
    alignItems: 'center',
    padding: 6,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E5E7',
    backgroundColor: '#F8F9FA',
  },
  moodOptionSelected: {
    backgroundColor: '#F0F8FF',
    borderWidth: 2,
  },
  moodEmoji: {
    fontSize: 18,
  },
  entryMoodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryMoodEmoji: {
    fontSize: 16,
  },
  entryMoodLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
});
