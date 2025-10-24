// types/chat.ts
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  chatId: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  lastMessage?: string;
  lastMessageAt?: Date;
  messageCount: number;
}

export interface ChatContextType {
  currentChatId?: string;
  messages: Message[];
  chatSessions: ChatSession[];
  isLoading: boolean;
  isConnected: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  sendMessage: (content: string) => Promise<void>;
  createNewChat: () => Promise<string>;
  loadChatSession: (chatId: string) => Promise<void>;
  clearCurrentChat: () => void;
}

export interface CrisisKeywords {
  keywords: string[];
  urgentKeywords: string[];
}
