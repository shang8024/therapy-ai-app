// components/chat/MessageBubble.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Message } from "../../types/chat";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[styles.text, isUser ? styles.userText : styles.assistantText]}
        >
          {message.content}
        </Text>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: "flex-end",
  },
  assistantContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 2,
  },
  userBubble: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#F0F0F0",
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "white",
  },
  assistantText: {
    color: "#333333",
  },
  timestamp: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
    opacity: 0.7,
  },
});
