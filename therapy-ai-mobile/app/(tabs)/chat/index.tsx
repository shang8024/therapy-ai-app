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
import { useTheme } from "../../../contexts/ThemeContext";
import ChatSessionItem from "../../../components/chat/ChatSessionItem";
import { chatStyles } from "@/styles/chat";

export default function ChatIndexScreen() {
  const { theme } = useTheme();
  const {
    chatSessions,
    createNewChat,
    loadChatSession,
    deleteChatSession,
    togglePinChatSession,
  } = useChat();

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

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteChatSession(sessionId);
    } catch {
      Alert.alert("Error", "Failed to delete chat session");
    }
  };

  const handleTogglePin = async (sessionId: string) => {
    try {
      await togglePinChatSession(sessionId);
    } catch {
      Alert.alert("Error", "Failed to pin/unpin chat session");
    }
  };

  // Sort chat sessions: pinned first (newest pinned at top), then unpinned (newest first)
  const sortedChatSessions = [...chatSessions].sort((a, b) => {
    // If both are pinned or both are unpinned, sort by newest first
    if (a.isPinned === b.isPinned) {
      if (a.isPinned && b.isPinned) {
        // Both pinned: sort by pinnedAt date (newest first)
        const aPinnedAt = a.pinnedAt?.getTime() || 0;
        const bPinnedAt = b.pinnedAt?.getTime() || 0;
        return bPinnedAt - aPinnedAt;
      } else {
        // Both unpinned: sort by lastMessageAt or createdAt (newest first)
        const aDate = (a.lastMessageAt || a.createdAt).getTime();
        const bDate = (b.lastMessageAt || b.createdAt).getTime();
        return bDate - aDate;
      }
    }
    // Pinned sessions come first
    return a.isPinned ? -1 : 1;
  });

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Welcome to Therapy AI
      </Text>
      <Text
        style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}
      >
        Start a conversation with your AI companion. Share your thoughts,
        feelings, or anything on your mind.
      </Text>
      <Pressable
        style={[
          styles.startChatButton,
          { backgroundColor: theme.colors.primary },
        ]}
        onPress={handleNewChat}
      >
        <Text style={[styles.buttonText, { color: "#ffffff" }]}>
          Start Your First Conversation
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Chat Sessions
        </Text>
        <Pressable
          style={[
            styles.buttonSmall,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={handleNewChat}
        >
          <Text style={styles.buttonText}>+ New Chat</Text>
        </Pressable>
      </View>

      {chatSessions.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={sortedChatSessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatSessionItem
              session={item}
              onPress={() => handleSessionPress(item.id)}
              onDelete={handleDeleteSession}
              onTogglePin={handleTogglePin}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[styles.footerText, { color: theme.colors.textSecondary }]}
        >
          Your conversations are stored privately on your device
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...chatStyles,
  header: {
    ...chatStyles.header,
    paddingVertical: 16,
  },
  startChatButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
});
