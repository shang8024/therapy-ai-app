import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { ChatSession } from "../../types/chat";
import { useTheme } from "../../contexts/ThemeContext";

interface ChatSessionMenuProps {
  session: ChatSession;
  onDelete: () => void;
  onTogglePin: () => void;
}

export default function ChatSessionMenu({
  session,
  onDelete,
  onTogglePin,
}: ChatSessionMenuProps) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  const handleDelete = () => {
    setIsVisible(false);
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete,
        },
      ],
    );
  };

  const handleTogglePin = () => {
    setIsVisible(false);
    onTogglePin();
  };

  return (
    <>
      <Pressable
        style={styles.menuButton}
        onPress={() => setIsVisible(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.menuIcon, { color: theme.colors.textSecondary }]}>⋯</Text>
      </Pressable>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setIsVisible(false)}
        >
          <View style={[styles.menu, { backgroundColor: theme.colors.surface }]}>
            <Pressable style={styles.menuItem} onPress={handleTogglePin}>
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                {session.isPinned ? "Unpin Chat" : "Pin Chat"}
              </Text>
            </Pressable>
            
            <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
            
            <Pressable style={styles.menuItem} onPress={handleDelete}>
              <Text style={[styles.menuItemText, styles.deleteText]}>
                Delete Chat
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  menuIcon: {
    fontSize: 16,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333333",
  },
  deleteText: {
    color: "#FF3B30",
  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 16,
  },
});