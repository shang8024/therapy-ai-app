// components/chat/ChatSessionItem.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ChatSession } from "../../types/chat";
import { useTheme } from "../../contexts/ThemeContext";
import ChatSessionMenu from "./ChatSessionMenu";

interface ChatSessionItemProps {
  session: ChatSession;
  onPress?: () => void;
  onDelete: (sessionId: string) => void;
  onTogglePin: (sessionId: string) => void;
}

export default function ChatSessionItem({
  session,
  onPress,
  onDelete,
  onTogglePin,
}: ChatSessionItemProps) {
  const { theme } = useTheme();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/chat/${session.id}`);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container, 
        { 
          backgroundColor: pressed 
            ? (theme.colors.background === '#F5F5F5' ? '#E5E5E5' : '#2C2C2E') 
            : theme.colors.surface,
          borderBottomColor: theme.colors.border,
        }
      ]} 
      onPress={handlePress}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {session.isPinned && <Text style={styles.pinIcon}>📌</Text>}
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
              {session.title}
            </Text>
          </View>
          <ChatSessionMenu
            session={session}
            onDelete={() => onDelete(session.id)}
            onTogglePin={() => onTogglePin(session.id)}
          />
        </View>
        {session.lastMessage && (
          <Text style={[styles.lastMessage, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {session.lastMessage}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
            {formatDate(session.lastMessageAt || session.createdAt)}
          </Text>
          <Text style={[styles.messageCount, { color: theme.colors.textSecondary }]}>
            {session.messageCount} message
            {session.messageCount !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  pinIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 12,
    color: "#999999",
  },
  messageCount: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
});
