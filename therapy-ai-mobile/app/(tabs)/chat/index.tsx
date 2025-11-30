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
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No conversations yet
      </Text>
      <Text
        style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}
      >
        Start a conversation with your AI companion. Share your thoughts, feelings, or anything on your mind.
      </Text>
      <Pressable
        style={[
          styles.startChatButton,
          { backgroundColor: theme.colors.primary },
        ]}
        onPress={handleNewChat}
      >
        <Text style={[styles.buttonText, { color: "#ffffff" }]}>
          Start Conversation
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextWrapper}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Conversations
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {chatSessions.length} {chatSessions.length === 1 ? 'session' : 'sessions'}
            </Text>
          </View>
          <Pressable
            style={[
              styles.newChatButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleNewChat}
          >
            <Text style={styles.newChatButtonIcon}>+</Text>
          </Pressable>
        </View>
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

      {chatSessions.length > 0 && (
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...chatStyles,
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  headerTextWrapper: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  newChatButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 2,
    flexShrink: 0,
  },
  newChatButtonIcon: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "200",
    lineHeight: 32,
  },
  startChatButton: {
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 28,
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
