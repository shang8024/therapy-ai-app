// components/chat/ChatInput.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import { useChat } from "../../contexts/ChatContext";
import { useTheme } from "../../contexts/ThemeContext";
import { speechToText } from "../../lib/groq-audio";

type RecordingState = "idle" | "recording" | "stopped" | "transcribing";

export default function ChatInput() {
  const { theme } = useTheme();
  const { inputText, setInputText, sendMessage, isLoading } = useChat();
  const [isFocused, setIsFocused] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  useEffect(() => {
    return () => {
      // Cleanup recording on unmount
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {
          // Ignore errors during cleanup - recording might already be unloaded
        });
      }
    };
  }, [recording]);

  const checkMicrophonePermission = async () => {
    if (permissionResponse?.status !== "granted") {
      const permission = await requestPermission();
      if (!permission.granted) {
        Alert.alert(
          "Microphone Permission Required",
          "To use voice messaging, please enable microphone access in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                /* Could open device settings */
              },
            },
          ]
        );
        return false;
      }
    }
    return true;
  };

  const startRecording = async () => {
    try {
      // Clean up any existing recording first
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch {
          // Ignore errors from cleanup
        }
        setRecording(null);
      }

      setRecordingState("recording"); // Set state immediately for UI feedback

      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        setRecordingState("idle"); // Reset if permission denied
        return;
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      // Keep recording state as "recording" since we set it earlier
    } catch {
      setRecordingState("idle"); // Reset on error
      setRecording(null);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    if (!recording || recordingState !== "recording") return;

    try {
      // Stop recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        throw new Error("No audio URI");
      }

      // Transcribe audio to text
      setRecordingState("transcribing");

      try {
        const transcribedText = await speechToText(uri);
        if (!transcribedText || transcribedText.trim() === "") {
          Alert.alert("No Speech Detected", "Please try speaking again.");
          setRecordingState("idle");
          return;
        }

        // Send the transcribed text as audio message (shows as voice bubble)
        setRecordingState("idle");
        await sendMessage(transcribedText.trim(), "audio");
      } catch (transcriptionError) {
        console.error("Transcription failed:", transcriptionError);
        // Send error message as failed transcription
        setRecordingState("idle");
        await sendMessage("❌ Transcription failed", "audio");
        Alert.alert(
          "Transcription Failed",
          "Could not convert speech to text. Please try again or type your message."
        );
      }
    } catch (error) {
      console.error("Stop recording error:", error);
      setRecordingState("idle");
      setRecording(null);
      Alert.alert("Error", "Failed to process recording. Please try again.");
    }
  };

  const handleMicrophonePress = async () => {
    // Prevent rapid tapping
    if (isLoading) return;

    if (recordingState === "idle") {
      await startRecording();
    } else if (recordingState === "recording") {
      await stopRecording();
    }
  };

  const handleSend = async () => {
    if (inputText.trim() && !isLoading) {
      await sendMessage(inputText);
      setRecordingState("idle");
    }
  };

  const showMicButton =
    inputText.trim() === "" &&
    (recordingState === "idle" || recordingState === "recording");
  const showSendButton = inputText.trim() !== "" && recordingState === "idle";
  const isTranscribing = recordingState === "transcribing";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          },
          isFocused && { borderColor: theme.colors.primary },
          recordingState === "recording" && { borderColor: "#ff0000" },
        ]}
      >
        <TextInput
          style={[styles.textInput, { color: theme.colors.text }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={
            recordingState === "recording"
              ? "Recording..."
              : recordingState === "transcribing"
                ? "Transcribing..."
                : "Share what's on your mind..."
          }
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={1000}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!isLoading && recordingState === "idle"}
        />

        {isTranscribing && (
          <View style={styles.micButton}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}

        {showMicButton && !isTranscribing && (
          <Pressable
            style={[
              styles.micButton,
              recordingState === "recording" && styles.micButtonRecording,
            ]}
            onPress={handleMicrophonePress}
            disabled={isLoading}
          >
            <Text style={styles.micButtonText}>
              {recordingState === "recording" ? "🛑" : "🎤"}
            </Text>
          </Pressable>
        )}

        {showSendButton && (
          <Pressable
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Text
              style={[
                styles.sendButtonText,
                (!inputText.trim() || isLoading) &&
                  styles.sendButtonTextDisabled,
              ]}
            >
              {isLoading ? "..." : "Send"}
            </Text>
          </Pressable>
        )}
      </View>

      {recordingState === "recording" && (
        <Text
          style={[
            styles.recordingIndicator,
            { color: theme.colors.textSecondary },
          ]}
        >
          🔴 Recording... Tap the stop button when finished
        </Text>
      )}

      {recordingState === "transcribing" && (
        <Text
          style={[styles.recordingIndicator, { color: theme.colors.primary }]}
        >
          Converting speech to text...
        </Text>
      )}

      <Text style={styles.disclaimer}>
        This AI companion provides emotional support but is not a replacement
        for professional therapy.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F8F9FF",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 56,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: "#8B5CF6",
    backgroundColor: "white",
  },
  inputContainerRecording: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 100,
    color: "#1E293B",
  },
  micButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 10,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  micButtonRecording: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
  },
  micButtonText: {
    fontSize: 20,
  },
  sendButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 10,
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
  },
  sendButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  sendButtonTextDisabled: {
    color: "#94A3B8",
  },
  recordingIndicator: {
    fontSize: 13,
    color: "#EF4444",
    textAlign: "center",
    marginTop: 6,
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
    lineHeight: 16,
  },
});
