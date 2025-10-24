// components/chat/ChatSessionItem.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ChatSession } from "../../types/chat";

interface ChatSessionItemProps {
  session: ChatSession;
  onPress?: () => void;
}

export default function ChatSessionItem({
  session,
  onPress,
}: ChatSessionItemProps) {
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
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {session.title}
        </Text>
        {session.lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={2}>
            {session.lastMessage}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.date}>
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
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
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
