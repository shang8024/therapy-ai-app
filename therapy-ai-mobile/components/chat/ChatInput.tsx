// components/chat/ChatInput.tsx
import React, { useState } from "react";
import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";
import { useChat } from "../../contexts/ChatContext";

export default function ChatInput() {
  const { inputText, setInputText, sendMessage, isLoading } = useChat();
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = async () => {
    if (inputText.trim() && !isLoading) {
      await sendMessage(inputText);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
        ]}
      >
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Share what's on your mind..."
          placeholderTextColor="#999999"
          multiline
          maxLength={1000}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!isLoading}
        />
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
              (!inputText.trim() || isLoading) && styles.sendButtonTextDisabled,
            ]}
          >
            {isLoading ? "..." : "Send"}
          </Text>
        </Pressable>
      </View>
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
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 100,
    color: "#333333",
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
  disclaimer: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
});
