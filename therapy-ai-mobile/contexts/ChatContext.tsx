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

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadChatSessions = async () => {
      try {
        const sessionsData = await AsyncStorage.getItem("appv1:chatSessions");
        if (sessionsData) {
          const sessions: ChatSession[] = JSON.parse(sessionsData).map(
            (session: any) => ({
              ...session,
              createdAt: new Date(session.createdAt),
              lastMessageAt: session.lastMessageAt
                ? new Date(session.lastMessageAt)
                : undefined,
            }),
          );
          dispatch({ type: "SET_CHAT_SESSIONS", payload: sessions });
        }
      } catch {
        // Error loading chat sessions - silently handle
      }
    };

    loadChatSessions();
  }, []); // Empty dependency array - only run once on mount

  const saveChatSessions = useCallback(async (sessions: ChatSession[]) => {
    try {
      await AsyncStorage.setItem(
        "appv1:chatSessions",
        JSON.stringify(sessions),
      );
    } catch {
      // Error saving chat sessions - silently handle
    }
  }, []);

  const loadChatMessages = useCallback(async (chatId: string) => {
    try {
      const messagesData = await AsyncStorage.getItem(
        `appv1:messages:${chatId}`,
      );
      if (messagesData) {
        const messages: Message[] = JSON.parse(messagesData).map(
          (msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }),
        );
        dispatch({ type: "SET_MESSAGES", payload: messages });
      } else {
        dispatch({ type: "SET_MESSAGES", payload: [] });
      }
    } catch {
      // Error loading messages - silently handle
    }
  }, []);

  const saveChatMessages = useCallback(
    async (chatId: string, messages: Message[]) => {
      try {
        await AsyncStorage.setItem(
          `appv1:messages:${chatId}`,
          JSON.stringify(messages),
        );
      } catch {
        // Error saving messages - silently handle
      }
    },
    [],
  );

  const detectCrisisKeywords = useCallback((text: string): boolean => {
    const lowercaseText = text.toLowerCase();
    return CRISIS_KEYWORDS.some((keyword) =>
      lowercaseText.includes(keyword.toLowerCase()),
    );
  }, []);

  const createNewChat = useCallback(async (): Promise<string> => {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession: ChatSession = {
      id: chatId,
      title: "New Conversation",
      createdAt: new Date(),
      messageCount: 0,
    };

    const updatedSessions = [newSession, ...state.chatSessions];
    dispatch({ type: "ADD_CHAT_SESSION", payload: newSession });
    await saveChatSessions(updatedSessions);

    return chatId;
  }, [state.chatSessions, saveChatSessions]);

  const loadChatSession = useCallback(
    async (chatId: string) => {
      dispatch({ type: "SET_CURRENT_CHAT", payload: chatId });
      await loadChatMessages(chatId);
    },
    [loadChatMessages],
  );

  const generateAIResponse = useCallback((_userInput: string): string => {
    // Simple CBT-inspired response generator (replace with actual AI integration)
    const responses = [
      "I hear that you're going through something difficult. Can you tell me more about what you're feeling right now?",
      "That sounds challenging. What thoughts are going through your mind when you experience this?",
      "Thank you for sharing that with me. Let's explore this feeling together. What do you think might be contributing to this?",
      "I understand this is hard for you. Have you noticed any patterns in when these feelings tend to come up?",
      "It's brave of you to talk about this. What would you say to a friend who was going through something similar?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!state.currentChatId || !content.trim()) return;

      dispatch({ type: "SET_LOADING", payload: true });

      // Check for crisis keywords
      if (detectCrisisKeywords(content)) {
        // TODO: Trigger crisis resource modal
        // Crisis keywords detected - should show crisis resources modal
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

      // Simulate AI response (replace with actual WebSocket integration)
      setTimeout(
        async () => {
          const aiResponse: Message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: generateAIResponse(content),
            role: "assistant",
            timestamp: new Date(),
            chatId: state.currentChatId!,
          };

          dispatch({ type: "ADD_MESSAGE", payload: aiResponse });

          // Update session with last message info
          const updatedSessions = state.chatSessions.map((session) =>
            session.id === state.currentChatId
              ? {
                  ...session,
                  lastMessage: aiResponse.content.substring(0, 50) + "...",
                  lastMessageAt: new Date(),
                  messageCount: session.messageCount + 2, // user + AI message
                  title:
                    session.messageCount === 0
                      ? content.substring(0, 30) + "..."
                      : session.title,
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
      detectCrisisKeywords,
      saveChatSessions,
      saveChatMessages,
      generateAIResponse,
    ],
  );

  const clearCurrentChat = useCallback(() => {
    dispatch({ type: "CLEAR_CURRENT_CHAT" });
  }, []);

  const setInputText = useCallback((text: string) => {
    dispatch({ type: "SET_INPUT_TEXT", payload: text });
  }, []);

  const value: ChatContextType = {
    currentChatId: state.currentChatId,
    messages: state.messages,
    chatSessions: state.chatSessions,
    isLoading: state.isLoading,
    isConnected: state.isConnected,
    inputText: state.inputText,
    setInputText,
    sendMessage,
    createNewChat,
    loadChatSession,
    clearCurrentChat,
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
