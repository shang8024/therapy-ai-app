import { supabase } from "./supabase";
import { AuthError } from "@supabase/supabase-js";

function isAuthError(error: any): boolean {
  return (
    error instanceof AuthError ||
    error?.message?.includes("Refresh Token") ||
    error?.message?.includes("JWT") ||
    error?.message?.includes("not authenticated")
  );
}

export async function handleSupabaseError(
  error: any,
  operation: string
): Promise<never> {
  console.error(`Supabase ${operation} error:`, error);

  if (isAuthError(error)) {
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error("Error during sign out:", signOutError);
    }
    throw new Error("Session expired. Please sign in again.");
  }

  throw error;
}

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  theme_preference: "light" | "dark" | "system";
  reminder_time: string;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data as UserProfile;
  } catch (error) {
    return await handleSupabaseError(error, "getUserProfile");
  }
}

export async function createUserProfile(userId: string, email: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .insert({
      id: userId,
      email,
      display_name: email.split("@")[0],
      theme_preference: "light",
      reminder_time: "20:00:00",
      notification_enabled: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, "id" | "created_at" | "updated_at">>
) {
  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export interface ChatSessionDB {
  id: string;
  user_id: string;
  title: string;
  last_message: string | null;
  last_message_at: string | null;
  message_count: number;
  is_pinned: boolean;
  pinned_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getChatSessions(userId: string) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as ChatSessionDB[];
}

export async function createChatSession(
  userId: string,
  sessionId: string,
  title: string = "New Conversation"
) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      id: sessionId,
      user_id: userId,
      title,
      message_count: 0,
      is_pinned: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ChatSessionDB;
}


export async function updateChatSession(
  sessionId: string,
  updates: Partial<
    Omit<ChatSessionDB, "id" | "user_id" | "created_at" | "updated_at">
  >
) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .update(updates)
    .eq("id", sessionId)
    .select()
    .single();

  if (error) throw error;
  return data as ChatSessionDB;
}


export async function deleteChatSession(sessionId: string) {
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) throw error;
}

export async function togglePinChatSession(
  sessionId: string,
  isPinned: boolean
) {
  const updates: Partial<ChatSessionDB> = {
    is_pinned: isPinned,
    pinned_at: isPinned ? new Date().toISOString() : null,
  };

  return updateChatSession(sessionId, updates);
}

export interface MessageDB {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  role: "user" | "assistant";
  message_type: "text" | "audio";
  audio_uri: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export async function getMessages(chatId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as MessageDB[];
}

export async function createMessage(
  userId: string,
  chatId: string,
  messageId: string,
  content: string,
  role: "user" | "assistant",
  messageType: "text" | "audio" = "text",
  audioUri: string | null = null
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      id: messageId,
      chat_id: chatId,
      user_id: userId,
      content,
      role,
      message_type: messageType,
      audio_uri: audioUri,
      metadata: {},
    })
    .select()
    .single();

  if (error) throw error;
  return data as MessageDB;
}

export async function deleteMessages(chatId: string) {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("chat_id", chatId);

  if (error) throw error;
}

export interface CheckinDB {
  id: number;
  checkin_id: string;
  user_id: string;
  mood: number;
  notes: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export async function getCheckins(userId: string) {
  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data as CheckinDB[];
}

export async function getCheckinByDate(userId: string, date: string) {
  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) throw error;
  return data as CheckinDB | null;
}

export async function getCheckinByUuid(userId: string, checkin_id: string) {
  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_id", userId)
    .eq("checkin_id", checkin_id)
    .maybeSingle();

  if (error) throw error;
  return data as CheckinDB | null;
}

export async function createCheckin(
  userId: string,
  mood: number,
  notes: string | null,
  date: string,
  checkinId?: string
) {
  const uuid = checkinId || generateUUID();
  
  const insertData: any = {
    checkin_id: uuid,
    user_id: userId,
    mood,
    notes,
    date,
  };

  const { data, error } = await supabase
    .from("checkins")
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data as CheckinDB;
}

export async function updateCheckin(
  checkinId: number,
  mood: number,
  notes: string | null
) {
  const { data, error } = await supabase
    .from("checkins")
    .update({ mood, notes })
    .eq("id", checkinId)
    .select()
    .single();

  if (error) throw error;
  return data as CheckinDB;
}

export async function deleteCheckin(checkinId: number) {
  const { error } = await supabase
    .from("checkins")
    .delete()
    .eq("id", checkinId);

  if (error) throw error;
}

export interface JournalEntryDB {
  id: number;
  journal_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export async function getJournalEntries(userId: string) {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as JournalEntryDB[];
}

export async function getJournalEntry(entryId: number) {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", entryId)
    .single();

  if (error) throw error;
  return data as JournalEntryDB;
}

export async function getJournalEntryByUuid(userId: string, journal_id: string) {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("journal_id", journal_id)
    .maybeSingle();

  if (error) throw error;
  return data as JournalEntryDB | null;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createJournalEntry(
  userId: string,
  title: string,
  content: string,
  journalId?: string
) {
  const uuid = journalId || generateUUID();
  
  const insertData: any = {
    journal_id: uuid,
    user_id: userId,
    title,
    content,
  };

  const { data, error } = await supabase
    .from("journal_entries")
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data as JournalEntryDB;
}

export async function updateJournalEntry(
  entryId: number,
  title: string,
  content: string
) {
  const { data, error } = await supabase
    .from("journal_entries")
    .update({ title, content })
    .eq("id", entryId)
    .select()
    .single();

  if (error) throw error;
  return data as JournalEntryDB;
}

export async function deleteJournalEntry(entryId: number) {
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", entryId);

  if (error) throw error;
}

export interface GlobalChatStats {
  date: string;
  active_users: number;
  total_messages: number;
  avg_messages_per_user: number;
}

export async function getGlobalChatStatistics(
  startDate: string,
  endDate: string
): Promise<GlobalChatStats[]> {
  try {
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('user_id, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (messagesError) {
      console.warn('Error fetching global chat statistics:', messagesError);
      return [];
    }

    const statsByDate = new Map<string, {
      users: Set<string>;
      messageCount: number;
    }>();

    messages?.forEach((msg) => {
      const date = new Date(msg.created_at).toISOString().split('T')[0];
      if (!statsByDate.has(date)) {
        statsByDate.set(date, {
          users: new Set(),
          messageCount: 0,
        });
      }
      const stats = statsByDate.get(date)!;
      stats.users.add(msg.user_id);
      stats.messageCount++;
    });

    const result: GlobalChatStats[] = [];
    statsByDate.forEach((stats, date) => {
      const activeUsers = stats.users.size;
      const totalMessages = stats.messageCount;
      result.push({
        date,
        active_users: activeUsers,
        total_messages: totalMessages,
        avg_messages_per_user: activeUsers > 0 
          ? Math.round((totalMessages / activeUsers) * 10) / 10 
          : 0,
      });
    });

    result.sort((a, b) => a.date.localeCompare(b.date));

    return result;
  } catch (error) {
    console.error('Error getting global chat statistics:', error);
    return [];
  }
}

export function isOnline(): boolean {
  return true;
}

export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}
