// contexts/ChatContext.tsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message, ChatSession, ChatContextType } from "../types/chat";
import { sendMessageToAI } from "../lib/groq-service";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import {
  getChatSessions as getChatSessionsCloud,
  createChatSession as createChatSessionCloud,
  updateChatSession as updateChatSessionCloud,
  deleteChatSession as deleteChatSessionCloud,
  getMessages as getMessagesCloud,
  createMessage as createMessageCloud,
  ChatSessionDB,
} from "../lib/supabase-services";

// Crisis detection keywords
const CRISIS_KEYWORDS = [
  "suicide",
  "kill myself",
  "end my life",
  "self-harm",
  "hurt myself",
  "overdose",
  "suicide plan",
  "want to die",
  "better off dead",
  "no point living",
  "worthless",
  "hopeless",
  "can't go on",
];

interface ChatState {
  currentChatId?: string;
  messages: Message[];
  chatSessions: ChatSession[];
  isLoading: boolean;
  isConnected: boolean;
  inputText: string;
}

type ChatAction =
  | { type: "SET_CURRENT_CHAT"; payload: string }
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_CHAT_SESSIONS"; payload: ChatSession[] }
  | { type: "ADD_CHAT_SESSION"; payload: ChatSession }
  | { type: "UPDATE_CHAT_SESSION"; payload: ChatSession }
  | { type: "DELETE_CHAT_SESSION"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CONNECTED"; payload: boolean }
  | { type: "SET_INPUT_TEXT"; payload: string }
  | { type: "CLEAR_CURRENT_CHAT" };

const initialState: ChatState = {
  messages: [],
  chatSessions: [],
  isLoading: false,
  isConnected: false,
  inputText: "",
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_CURRENT_CHAT":
      return { ...state, currentChatId: action.payload };
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "SET_CHAT_SESSIONS":
      return { ...state, chatSessions: action.payload };
    case "ADD_CHAT_SESSION":
      return {
        ...state,
        chatSessions: [action.payload, ...state.chatSessions],
      };
    case "UPDATE_CHAT_SESSION":
      return {
        ...state,
        chatSessions: state.chatSessions.map((session) =>
          session.id === action.payload.id ? action.payload : session,
        ),
      };
    case "DELETE_CHAT_SESSION":
      return {
        ...state,
        chatSessions: state.chatSessions.filter(
          (session) => session.id !== action.payload,
        ),
        currentChatId:
          state.currentChatId === action.payload
            ? undefined
            : state.currentChatId,
        messages: state.currentChatId === action.payload ? [] : state.messages,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_CONNECTED":
      return { ...state, isConnected: action.payload };
    case "SET_INPUT_TEXT":
      return { ...state, inputText: action.payload };
    case "CLEAR_CURRENT_CHAT":
      return {
        ...state,
        currentChatId: undefined,
        messages: [],
        inputText: "",
      };
    default:
      return state;
  }
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function mapCloudSession(session: ChatSessionDB): ChatSession {
  return {
    id: session.id,
    title: session.title,
    createdAt: new Date(session.created_at),
    lastMessage: session.last_message ?? undefined,
    lastMessageAt: session.last_message_at ? new Date(session.last_message_at) : undefined,
    messageCount: session.message_count ?? 0,
    isPinned: session.is_pinned ?? undefined,
    pinnedAt: session.pinned_at ? new Date(session.pinned_at) : undefined,
  };
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user } = useAuth();

  const getSessionsKey = useCallback(() => {
    if (!user?.id) return null;
    return `appv1:${user.id}:chatSessions`;
  }, [user?.id]);

  const getMessagesKey = useCallback(
    (chatId: string) => {
      if (!user?.id) return null;
      return `appv1:${user.id}:messages:${chatId}`;
    },
    [user?.id],
  );

  useEffect(() => {
    dispatch({ type: "CLEAR_CURRENT_CHAT" });
    dispatch({ type: "SET_CHAT_SESSIONS", payload: [] });
  }, [user?.id]);

  // Load chat sessions from Supabase (fallback to AsyncStorage)
  useEffect(() => {
    const loadChatSessions = async () => {
      let sessions: ChatSession[] | null = null;
      try {
        if (!user?.id) {
          dispatch({ type: "SET_CHAT_SESSIONS", payload: [] });
          return;
        }

        const storageKey = getSessionsKey();
        if (!storageKey) return;

        try {
          const cloudSessions = await getChatSessionsCloud(user.id);
          sessions = cloudSessions.map(mapCloudSession);
          await AsyncStorage.setItem(storageKey, JSON.stringify(sessions));
        } catch (error) {
          console.warn("Failed to load chat sessions from Supabase:", error);
        }

        if (!sessions) {
          const sessionsData = await AsyncStorage.getItem(storageKey);
          if (sessionsData) {
            sessions = JSON.parse(sessionsData).map((session: any) => ({
              ...session,
              createdAt: new Date(session.createdAt),
              lastMessageAt: session.lastMessageAt
                ? new Date(session.lastMessageAt)
                : undefined,
              pinnedAt: session.pinnedAt ? new Date(session.pinnedAt) : undefined,
            }));
          }
        }

        dispatch({ type: "SET_CHAT_SESSIONS", payload: sessions ?? [] });
      } catch (error) {
        console.error("Failed to load chat sessions:", error);
        dispatch({ type: "SET_CHAT_SESSIONS", payload: [] });
      }
    };

    loadChatSessions();
  }, [user?.id, getSessionsKey]);

  const saveChatSessions = useCallback(async (sessions: ChatSession[]) => {
    try {
      const storageKey = getSessionsKey();
      if (!storageKey) return;

      await AsyncStorage.setItem(storageKey, JSON.stringify(sessions));
    } catch {
      // Error saving chat sessions - silently handle
    }
  }, [getSessionsKey]);

  const loadChatMessages = useCallback(
    async (chatId: string) => {
      const storageKey = getMessagesKey(chatId);

      if (user?.id) {
        try {
          const cloudMessages = await getMessagesCloud(chatId);
          const mapped = cloudMessages.map((msg) => ({
            id: msg.id,
            chatId: msg.chat_id,
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.created_at),
            audioUri: msg.audio_uri ?? undefined,
            messageType: msg.message_type ?? "text",
          }));
          dispatch({ type: "SET_MESSAGES", payload: mapped });
          if (storageKey) {
            await AsyncStorage.setItem(storageKey, JSON.stringify(mapped));
          }
          return;
        } catch (error) {
          console.warn(`Failed to load messages for chat ${chatId} from Supabase:`, error);
        }
      }

      if (storageKey) {
        try {
          const messagesData = await AsyncStorage.getItem(storageKey);
          if (messagesData) {
            const messages: Message[] = JSON.parse(messagesData).map(
              (msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              }),
            );
            dispatch({ type: "SET_MESSAGES", payload: messages });
            return;
          }
        } catch (error) {
          console.warn(`Failed to load messages for chat ${chatId} from local storage:`, error);
        }
      }

      dispatch({ type: "SET_MESSAGES", payload: [] });
    },
    [getMessagesKey, user?.id],
  );

  const saveChatMessages = useCallback(
    async (chatId: string, messages: Message[]) => {
      try {
        const storageKey = getMessagesKey(chatId);
        if (!storageKey) return;

        await AsyncStorage.setItem(storageKey, JSON.stringify(messages));
      } catch {
        // Error saving messages - silently handle
      }
    },
    [getMessagesKey],
  );

  const detectCrisisKeywords = useCallback((text: string): boolean => {
    const lowercaseText = text.toLowerCase();
    return CRISIS_KEYWORDS.some((keyword) =>
      lowercaseText.includes(keyword.toLowerCase()),
    );
  }, []);

  const createNewChat = useCallback(async (): Promise<string> => {
    if (!user?.id) {
      throw new Error("Cannot create chat: no authenticated user");
    }

    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let newSession: ChatSession = {
      id: chatId,
      title: "New Conversation",
      createdAt: new Date(),
      messageCount: 0,
      isPinned: false,
    };

    try {
      const cloudSession = await createChatSessionCloud(user.id, chatId, newSession.title);
      newSession = mapCloudSession(cloudSession);
    } catch (error) {
      console.warn("Failed to create chat session in Supabase:", error);
    }

    const updatedSessions = [newSession, ...state.chatSessions];
    dispatch({ type: "ADD_CHAT_SESSION", payload: newSession });
    await saveChatSessions(updatedSessions);

    return chatId;
  }, [state.chatSessions, saveChatSessions, user?.id]);

  const loadChatSession = useCallback(
    async (chatId: string) => {
      dispatch({ type: "SET_CURRENT_CHAT", payload: chatId });
      await loadChatMessages(chatId);
    },
    [loadChatMessages],
  );

  // This function is now replaced by Groq AI streaming

  const sendMessage = useCallback(
    async (content: string) => {
      if (!state.currentChatId || !content.trim()) return;
      if (!user?.id) return;

      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_CONNECTED", payload: true });

      // Check for crisis keywords
      if (detectCrisisKeywords(content)) {
        // TODO: Trigger crisis resource modal
        console.warn('Crisis keywords detected');
      }

      const userMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        role: "user",
        timestamp: new Date(),
        chatId: state.currentChatId,
      };

      dispatch({ type: "ADD_MESSAGE", payload: userMessage });
      dispatch({ type: "SET_INPUT_TEXT", payload: "" });

      // Save user message locally
      const currentMessages = [...state.messages, userMessage];
      await saveChatMessages(state.currentChatId, currentMessages);

      try {
        await createMessageCloud(
          user.id,
          state.currentChatId,
          userMessage.id,
          userMessage.content,
          "user",
        );
      } catch (error) {
        console.warn("Failed to persist user message to Supabase:", error);
      }

      // Prepare conversation history for AI
      const conversationHistory = state.messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Create placeholder for AI response
      const aiMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let aiResponseContent = '';

      const aiMessage: Message = {
        id: aiMessageId,
        content: '',
        role: "assistant",
        timestamp: new Date(),
        chatId: state.currentChatId,
      };

      dispatch({ type: "ADD_MESSAGE", payload: aiMessage });

      // Send to Groq AI via Edge Function
      await sendMessageToAI(
        content.trim(),
        state.currentChatId,
        user.id,
        conversationHistory,
        // On chunk received
        (chunk: string) => {
          aiResponseContent += chunk;
          // Update message with streaming content
          dispatch({
            type: "SET_MESSAGES",
            payload: [...currentMessages, { ...aiMessage, content: aiResponseContent }]
          });
        },
        // On complete
        async (fullResponse: string) => {
          const finalAiMessage = { ...aiMessage, content: fullResponse };
          
          // Update session with last message info
          const updatedSessions = state.chatSessions.map((session) =>
            session.id === state.currentChatId
              ? {
                  ...session,
                  lastMessage: fullResponse.substring(0, 50) + "...",
                  lastMessageAt: new Date(),
                  messageCount: session.messageCount + 2,
                  title:
                    session.messageCount === 0
                      ? content.substring(0, 30) + "..."
                      : session.title,
                }
              : session,
          );

          dispatch({ type: "SET_CHAT_SESSIONS", payload: updatedSessions });
          await saveChatSessions(updatedSessions);

          const finalMessages = [...currentMessages, finalAiMessage];
          await saveChatMessages(state.currentChatId!, finalMessages);

          try {
            await createMessageCloud(
              user.id,
              state.currentChatId!,
              finalAiMessage.id,
              finalAiMessage.content,
              "assistant",
            );
          } catch (error) {
            console.warn("Failed to persist assistant message to Supabase:", error);
          }

          try {
            await updateChatSessionCloud(state.currentChatId!, {
              last_message: fullResponse.substring(0, 50) + "...",
              last_message_at: new Date().toISOString(),
              message_count: updatedSessions.find((session) => session.id === state.currentChatId)?.messageCount ?? 0,
              title:
                updatedSessions.find((session) => session.id === state.currentChatId)?.title ??
                "New Conversation",
            });
          } catch (error) {
            console.warn("Failed to update chat session metadata in Supabase:", error);
          }

          dispatch({ type: "SET_LOADING", payload: false });
          dispatch({ type: "SET_CONNECTED", payload: false });
        },
        // On error
        (error: Error) => {
          console.error('AI Error:', error);
          const errorMessage: Message = {
            ...aiMessage,
            content: "I'm sorry, I'm having trouble responding right now. Please try again.",
          };
          dispatch({
            type: "SET_MESSAGES",
            payload: [...currentMessages, errorMessage]
          });
          dispatch({ type: "SET_LOADING", payload: false });
          dispatch({ type: "SET_CONNECTED", payload: false });
        }
      );
    },
    [
      state.currentChatId,
      state.chatSessions,
      state.messages,
      detectCrisisKeywords,
      saveChatSessions,
      saveChatMessages,
      user?.id,
    ],
  );

  const sendAudioMessage = useCallback(
    async (audioUri: string) => {
      if (!state.currentChatId || !user?.id) return;

      dispatch({ type: "SET_LOADING", payload: true });

      // Create user audio message
      const userMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: "🎤 Voice message", // Display text for audio message
        role: "user",
        timestamp: new Date(),
        chatId: state.currentChatId,
        audioUri,
        messageType: "audio",
      };

      dispatch({ type: "ADD_MESSAGE", payload: userMessage });

      // Simulate AI audio response (replace with actual voice AI integration)
      setTimeout(
        async () => {
          const aiResponse: Message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: "🔊 AI Voice Response", // Display text for AI audio response
            role: "assistant",
            timestamp: new Date(),
            chatId: state.currentChatId!,
            messageType: "audio",
            // In the future, this will have an audioUri from ElevenLabs
          };

          dispatch({ type: "ADD_MESSAGE", payload: aiResponse });

          // Update session with last message info
          const updatedSessions = state.chatSessions.map((session) =>
            session.id === state.currentChatId
              ? {
                  ...session,
                  lastMessage: "🎤 Voice conversation",
                  lastMessageAt: new Date(),
                  messageCount: session.messageCount + 2, // user + AI message
                  title:
                    session.messageCount === 0 ? "Voice Chat" : session.title,
                }
              : session,
          );

          dispatch({ type: "SET_CHAT_SESSIONS", payload: updatedSessions });
          await saveChatSessions(updatedSessions);

          const currentMessages = [...state.messages, userMessage, aiResponse];
          await saveChatMessages(state.currentChatId!, currentMessages);

          dispatch({ type: "SET_LOADING", payload: false });
        },
        1000 + Math.random() * 1500,
      ); // Simulate network delay
    },
    [
      state.currentChatId,
      state.chatSessions,
      state.messages,
      saveChatSessions,
      saveChatMessages,
      user?.id,
    ],
  );

  const clearCurrentChat = useCallback(() => {
    dispatch({ type: "CLEAR_CURRENT_CHAT" });
  }, []);

  const setInputText = useCallback((text: string) => {
    dispatch({ type: "SET_INPUT_TEXT", payload: text });
  }, []);

  const deleteChatSession = useCallback(
    async (chatId: string) => {
      try {
        dispatch({ type: "DELETE_CHAT_SESSION", payload: chatId });

        if (user?.id) {
          try {
            await deleteChatSessionCloud(chatId);
          } catch (error) {
            console.warn("Failed to delete chat session from Supabase:", error);
          }
        }

        const updatedSessions = state.chatSessions.filter((session) => session.id !== chatId);
        await saveChatSessions(updatedSessions);

        const messageKey = getMessagesKey(chatId);
        if (messageKey) {
          await AsyncStorage.removeItem(messageKey);
        }
      } catch {
        // Handle error silently or use proper error reporting
      }
    },
    [getMessagesKey, saveChatSessions, state.chatSessions, user?.id],
  );

  const togglePinChatSession = useCallback(
    async (chatId: string) => {
      try {
        const updatedSessions = state.chatSessions.map((session) => {
          if (session.id === chatId) {
            const isPinned = !session.isPinned;
            return {
              ...session,
              isPinned,
              pinnedAt: isPinned ? new Date() : undefined,
            };
          }
          return session;
        });

        dispatch({ type: "SET_CHAT_SESSIONS", payload: updatedSessions });
        await saveChatSessions(updatedSessions);

        if (user?.id) {
          const toggled = updatedSessions.find((session) => session.id === chatId);
          if (toggled) {
            try {
              await updateChatSessionCloud(chatId, {
                is_pinned: toggled.isPinned ?? false,
                pinned_at: toggled.isPinned ? new Date().toISOString() : null,
              });
            } catch (error) {
              console.warn("Failed to update pin state in Supabase:", error);
            }
          }
        }
      } catch {
        // Handle error silently or use proper error reporting
      }
    },
    [saveChatSessions, state.chatSessions, user?.id],
  );

  const value: ChatContextType = {
    currentChatId: state.currentChatId,
    messages: state.messages,
    chatSessions: state.chatSessions,
    isLoading: state.isLoading,
    isConnected: state.isConnected,
    inputText: state.inputText,
    setInputText,
    sendMessage,
    sendAudioMessage,
    createNewChat,
    loadChatSession,
    clearCurrentChat,
    deleteChatSession,
    togglePinChatSession,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
