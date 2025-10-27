// components/chat/ChatInput.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import { useChat } from "../../contexts/ChatContext";
import { useTheme } from "../../contexts/ThemeContext";

type RecordingState = "idle" | "recording" | "stopped";

export default function ChatInput() {
  const { theme } = useTheme();
  const { inputText, setInputText, sendMessage, sendAudioMessage, isLoading } =
    useChat();
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
          ],
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
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
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
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingState("stopped");
      setRecording(null); // Clear the recording reference immediately
      
      // Send audio message directly instead of transcribing
      if (uri) {
        await sendAudioMessage(uri);
      }
      
      // Reset state after sending
      setRecordingState("idle");
    } catch {
      // Reset state even if stopping fails
      setRecordingState("idle");
      setRecording(null);
      Alert.alert("Error", "Failed to stop recording. Please try again.");
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
  const showSendButton =
    inputText.trim() !== "" || recordingState === "stopped";

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
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
              : "Share what's on your mind..."
          }
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={1000}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!isLoading && recordingState !== "recording"}
        />
        
        {showMicButton && (
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
              (!inputText.trim() || isLoading) &&
                recordingState === "idle" &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={
              (!inputText.trim() || isLoading) && recordingState === "idle"
            }
          >
            <Text
              style={[
                styles.sendButtonText,
                (!inputText.trim() || isLoading) &&
                  recordingState === "idle" &&
                  styles.sendButtonTextDisabled,
              ]}
            >
              {isLoading ? "..." : "Send"}
            </Text>
          </Pressable>
        )}
      </View>
      
      {recordingState === "recording" && (
        <Text style={styles.recordingIndicator}>
          🔴 Recording... Tap the stop button when finished
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
    paddingVertical: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F8F8F8",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputContainerFocused: {
    borderColor: "#007AFF",
    backgroundColor: "white",
  },
  inputContainerRecording: {
    borderColor: "#FF3B30",
    backgroundColor: "#FFF5F5",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 100,
    color: "#333333",
  },
  micButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
    minWidth: 40,
    alignItems: "center",
  },
  micButtonRecording: {
    backgroundColor: "#FF3B30",
  },
  micButtonText: {
    fontSize: 18,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  sendButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  sendButtonTextDisabled: {
    color: "#999999",
  },
  recordingIndicator: {
    fontSize: 12,
    color: "#FF3B30",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "500",
  },
  disclaimer: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
});
