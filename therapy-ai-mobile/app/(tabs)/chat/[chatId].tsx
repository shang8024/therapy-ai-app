import React, { useEffect, useState } from "react";
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

// Crisis Resources Modal Component
function CrisisResourcesModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Crisis Resources</Text>
          <Text style={styles.modalSubtitle}>
            If you're having thoughts of self-harm or suicide, please reach out
            for immediate help:
          </Text>

          <View style={styles.resourcesList}>
            <Text style={styles.resourceItem}>
              🇺🇸 National Suicide Prevention Lifeline: 988
            </Text>
            <Text style={styles.resourceItem}>
              🇨🇦 Canada Suicide Prevention Service: 1-833-456-4566
            </Text>
            <Text style={styles.resourceItem}>🇬🇧 Samaritans: 116 123</Text>
            <Text style={styles.resourceItem}>
              🌍 Crisis Text Line: Text HOME to 741741
            </Text>
          </View>

          <Text style={styles.modalNote}>
            These resources are available 24/7. You are not alone, and help is
            available.
          </Text>

          <Pressable style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
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

  const currentSession = chatSessions.find((session) => session.id === chatId);

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

  const renderMessage = ({ item }: { item: any }) => (
    <MessageBubble message={item} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>Start the conversation</Text>
      <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textSecondary }]}>
        Share what's on your mind. Your AI companion is here to listen and
        provide gentle guidance.
      </Text>
    </View>
  );

  if (!currentChatId || currentChatId !== chatId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Crisis Resources Modal */}
      <CrisisResourcesModal
        visible={showCrisisModal}
        onClose={() => setShowCrisisModal(false)}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Pressable style={styles.backButton} onPress={handleBackPress}>
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {currentSession?.title || "Chat"}
        </Text>
        <Pressable
          style={[styles.crisisButton, { backgroundColor: theme.colors.error }]}
          onPress={() => setShowCrisisModal(true)}
        >
          <Text style={styles.crisisButtonText}>Crisis Help</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    marginBottom: -40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
    marginHorizontal: 16,
  },
  crisisButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  crisisButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
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
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
  },
  disclaimerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF9E6",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  disclaimerText: {
    fontSize: 12,
    color: "#8B7355",
    textAlign: "center",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
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
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#333333",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  resourcesList: {
    marginBottom: 20,
  },
  resourceItem: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 8,
    lineHeight: 20,
  },
  modalNote: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalCloseButton: {
    backgroundColor: "#007AFF",
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
