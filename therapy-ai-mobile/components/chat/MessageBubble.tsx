// components/chat/MessageBubble.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Message } from "../../types/chat";
import { useTheme } from "../../contexts/ThemeContext";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { theme } = useTheme();
  const isUser = message.role === "user";
  const isAudioMessage = message.messageType === "audio";

  const handlePlayAudio = () => {
    // TODO: Implement audio playback when ElevenLabs integration is added
    // For now, just show that it's an audio message
  };

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
          isUser 
            ? { backgroundColor: theme.colors.primary }
            : { backgroundColor: theme.colors.surface },
          isAudioMessage && styles.audioBubble,
        ]}
      >
        {isAudioMessage ? (
          <Pressable onPress={handlePlayAudio} style={styles.audioContent}>
            <Text style={styles.audioIcon}>{isUser ? "🎤" : "🔊"}</Text>
            <Text
              style={[
                styles.audioText,
                { color: isUser ? "#ffffff" : theme.colors.text },
              ]}
            >
              {isUser ? "Voice message" : "AI Voice Response"}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={[
              styles.text,
              { color: isUser ? "#ffffff" : theme.colors.text },
            ]}
          >
            {message.content}
          </Text>
        )}
        <Text style={[styles.timestamp, { color: isUser ? "rgba(255,255,255,0.7)" : theme.colors.textSecondary }]}>
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
  audioBubble: {
    minWidth: 120,
  },
  audioContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  audioIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  audioText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
