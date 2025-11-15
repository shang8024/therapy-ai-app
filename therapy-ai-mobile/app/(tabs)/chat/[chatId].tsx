import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useChat } from "../../../contexts/ChatContext";
import { useTheme } from "../../../contexts/ThemeContext";
import MessageBubble from "../../../components/chat/MessageBubble";
import ChatInput from "../../../components/chat/ChatInput";
import { chatStyles } from "@/styles/chat";

// Crisis Resources Modal Component
function CrisisResourcesModal({
  visible,
  onClose,
  theme,
}: {
  visible: boolean;
  onClose: () => void;
  theme: any;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.error }]}>
            Crisis Resources
          </Text>
          <Text style={[styles.modalSubtitle, { color: theme.colors.text }]}>
            If you're having thoughts of self-harm or suicide, please reach out
            for immediate help:
          </Text>

          <View style={styles.resourcesList}>
            <Text style={[styles.resourceItem, { color: theme.colors.text }]}>
              🇺🇸 National Suicide Prevention Lifeline: 988
            </Text>
            <Text style={[styles.resourceItem, { color: theme.colors.text }]}>
              🇨🇦 Canada Suicide Prevention Service: 1-833-456-4566
            </Text>
            <Text style={[styles.resourceItem, { color: theme.colors.text }]}>
              🇬🇧 Samaritans: 116 123
            </Text>
            <Text style={[styles.resourceItem, { color: theme.colors.text }]}>
              🌍 Crisis Text Line: Text HOME to 741741
            </Text>
          </View>

          <Text
            style={[styles.modalNote, { color: theme.colors.textSecondary }]}
          >
            These resources are available 24/7. You are not alone, and help is
            available.
          </Text>

          <Pressable
            style={[
              styles.modalCloseButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, styles.modalCloseText]}>
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function ChatSessionScreen() {
  const { theme } = useTheme();
  const { chatId } = useLocalSearchParams();
  const {
    currentChatId,
    messages,
    loadChatSession,
    chatSessions,
    clearCurrentChat,
  } = useChat();
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const previousMessageCountRef = useRef<number>(0);
  const [lastNewMessageId, setLastNewMessageId] = useState<string | null>(null);

  const currentSession = chatSessions.find((session) => session.id === chatId);

  // Track when NEW messages are added (not just loaded from storage)
  useEffect(() => {
    if (messages.length > previousMessageCountRef.current) {
      // New message was added
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessage.audioUri) {
        setLastNewMessageId(lastMessage.id);
        // Clear after a short delay to prevent re-playing on re-renders
        setTimeout(() => setLastNewMessageId(null), 1000);
      }
    }
    previousMessageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (typeof chatId === "string") {
      loadChatSession(chatId);
    }

    return () => {
      // Cleanup when leaving the chat
      clearCurrentChat();
    };
  }, [chatId, loadChatSession, clearCurrentChat]);

  useEffect(() => {
    // Listen for crisis detection (this would be triggered from ChatContext)
    // For now, this is a placeholder for the crisis detection system
  }, []);

  const handleBackPress = () => {
    router.back();
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    // Only auto-play if this is the newly generated message
    const isLatest = item.id === lastNewMessageId;

    return <MessageBubble message={item} isLatest={isLatest} />;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text
        style={[
          styles.emptyTitle,
          styles.emptyTitleChat,
          { color: theme.colors.text },
        ]}
      >
        Start the conversation
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          styles.emptySubtitleChat,
          { color: theme.colors.textSecondary },
        ]}
      >
        Share what's on your mind. Your AI companion is here to listen and
        provide gentle guidance.
      </Text>
    </View>
  );

  if (!currentChatId || currentChatId !== chatId) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Loading conversation...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      {/* Crisis Resources Modal */}
      <CrisisResourcesModal
        visible={showCrisisModal}
        onClose={() => setShowCrisisModal(false)}
        theme={theme}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Pressable style={styles.backButton} onPress={handleBackPress}>
          <Text
            style={[styles.backButtonText, { color: theme.colors.primary }]}
          >
            ← Back
          </Text>
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {currentSession?.title || "Chat"}
        </Text>
        <Pressable
          style={[styles.buttonSmall, { backgroundColor: theme.colors.error }]}
          onPress={() => setShowCrisisModal(true)}
        >
          <Text style={styles.buttonText}>Crisis Help</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages List */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={
            messages.length === 0 ? styles.emptyMessagesContainer : undefined
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          inverted={false}
        />

        {/* Chat Input */}
        <ChatInput />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...chatStyles,
  headerTitle: {
    ...chatStyles.headerTitle,
    flex: 1,
    marginHorizontal: 16,
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingVertical: 8,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: "center",
  },
  emptyTitleChat: {
    fontSize: 28,
    marginBottom: 16,
  },
  emptySubtitleChat: {
    marginBottom: 32,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  resourcesList: {
    marginBottom: 20,
  },
  resourceItem: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  modalNote: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
  },
  modalCloseText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
