// components/chat/MessageBubble.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Message } from "../../types/chat";
import { useTheme } from "../../contexts/ThemeContext";
import AudioPlayer from "./AudioPlayer";

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export default function MessageBubble({
  message,
  isLatest = false,
}: MessageBubbleProps) {
  const { theme } = useTheme();
  const isUser = message.role === "user";
  const hasAudio = !!message.audioUri;
  // Ensure messageType is properly checked
  const isAudioMessage = message.messageType === "audio";
  const [showTranscript, setShowTranscript] = useState(false);

  // Only log once per mount, not on every render
  useEffect(() => {
    console.log("📨 MessageBubble:", {
      id: message.id.substring(0, 20),
      role: message.role,
      messageType: message.messageType,
      content: message.content.substring(0, 30),
    });
  }, [message.id]);

  // User voice message - show transcribed text with microphone indicator
  if (isUser && isAudioMessage) {
    // log message content to verify transcription
    const isTranscriptionError = message.content.includes(
      "❌ Transcription failed"
    );

    return (
      <View style={[styles.container, styles.userContainer]}>
        <View
          style={[styles.bubble, { backgroundColor: theme.colors.primary }]}
        >
          {/* Voice message indicator with transcribed text */}
          <View style={styles.voiceMessageHeader}>
            <Text style={styles.voiceIcon}>🎤</Text>
          </View>

          {/* Show actual transcribed text or error */}
          <Text
            style={[
              styles.text,
              { color: "#ffffff" },
              isTranscriptionError && styles.errorText,
            ]}
          >
            {message.content}
          </Text>

          <Text style={[styles.timestamp, { color: "rgba(255,255,255,0.7)" }]}>
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  }

  // Regular text or AI message
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
        ]}
      >
        {/* For AI voice responses, only show audio player + transcript toggle */}
        {hasAudio && !isUser ? (
          <>
            <AudioPlayer audioUri={message.audioUri!} autoPlay={isLatest} />

            <Pressable
              onPress={() => setShowTranscript(!showTranscript)}
              style={{ marginTop: 8 }}
            >
              <Text
                style={[
                  styles.transcriptToggle,
                  { color: theme.colors.primary },
                ]}
              >
                {showTranscript ? "Hide transcript ▼" : "Show transcript ▶"}
              </Text>
            </Pressable>

            {showTranscript && (
              <Text
                style={[
                  styles.transcript,
                  {
                    color: theme.colors.text,
                    borderTopColor: theme.colors.border,
                  },
                ]}
              >
                {message.content}
              </Text>
            )}
          </>
        ) : (
          // Regular text message
          <Text
            style={[
              styles.text,
              { color: isUser ? "#ffffff" : theme.colors.text },
            ]}
          >
            {message.content}
          </Text>
        )}

        <Text
          style={[
            styles.timestamp,
            {
              color: isUser
                ? "rgba(255,255,255,0.7)"
                : theme.colors.textSecondary,
            },
          ]}
        >
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
  voiceMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  voiceMessageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  voiceIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  errorText: {
    fontStyle: "italic",
    opacity: 0.9,
  },
  transcribingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transcribingText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  transcriptToggle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "500",
  },
  transcript: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    fontSize: 14,
    lineHeight: 20,
  },
});
