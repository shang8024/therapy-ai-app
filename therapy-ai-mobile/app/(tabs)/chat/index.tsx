import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useChat } from "../../../contexts/ChatContext";
import ChatSessionItem from "../../../components/chat/ChatSessionItem";

export default function ChatIndexScreen() {
  const { chatSessions, createNewChat, loadChatSession } = useChat();

  const handleNewChat = async () => {
    try {
      const chatId = await createNewChat();
      await loadChatSession(chatId);
      router.push(`/chat/${chatId}`);
    } catch {
      Alert.alert("Error", "Failed to create new chat session");
    }
  };

  const handleSessionPress = async (sessionId: string) => {
    try {
      await loadChatSession(sessionId);
      router.push(`/chat/${sessionId}`);
    } catch {
      Alert.alert("Error", "Failed to load chat session");
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Welcome to Therapy AI</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation with your AI companion. Share your thoughts,
        feelings, or anything on your mind.
      </Text>
      <Pressable style={styles.startChatButton} onPress={handleNewChat}>
        <Text style={styles.startChatButtonText}>
          Start Your First Conversation
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat Sessions</Text>
        <Pressable style={styles.newChatButton} onPress={handleNewChat}>
          <Text style={styles.newChatButtonText}>+ New Chat</Text>
        </Pressable>
      </View>

      {chatSessions.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={chatSessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatSessionItem
              session={item}
              onPress={() => handleSessionPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Your conversations are stored privately on your device
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  newChatButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newChatButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    marginBottom: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  startChatButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  startChatButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  footerText: {
    fontSize: 12,
    color: "#999999",
    textAlign: "center",
    fontStyle: "italic",
  },
});
