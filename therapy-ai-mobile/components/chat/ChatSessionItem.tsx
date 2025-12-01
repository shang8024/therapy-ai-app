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
          <Text style={styles.messageCount}>
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
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 20,
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  content: {
    padding: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  pinIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    letterSpacing: -0.2,
  },
  lastMessage: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 21,
    marginBottom: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  date: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  messageCount: {
    fontSize: 12,
    color: "#8B5CF6",
    fontWeight: "600",
  },
});
