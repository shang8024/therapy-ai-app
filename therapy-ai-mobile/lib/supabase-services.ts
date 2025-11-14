/**
 * Supabase Service Layer
 * 
 * This file contains all Supabase database operations.
 * Handles cloud sync for chat sessions, messages, check-ins, and journal entries.
 */

import { supabase } from './supabase';

// ============================================================================
// USER PROFILE OPERATIONS
// ============================================================================

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  theme_preference: 'light' | 'dark' | 'system';
  reminder_time: string;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as UserProfile;
}

/**
 * Create user profile (called after sign up)
 */
export async function createUserProfile(userId: string, email: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      email,
      display_name: email.split('@')[0], // Default to email username
      theme_preference: 'light',
      reminder_time: '20:00:00',
      notification_enabled: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as UserProfile;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as UserProfile;
}

// ============================================================================
// CHAT SESSION OPERATIONS
// ============================================================================

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

/**
 * Get all chat sessions for a user
 */
export async function getChatSessions(userId: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ChatSessionDB[];
}

/**
 * Create a new chat session
 */
export async function createChatSession(userId: string, sessionId: string, title: string = 'New Conversation') {
  const { data, error } = await supabase
    .from('chat_sessions')
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

/**
 * Update chat session
 */
export async function updateChatSession(
  sessionId: string,
  updates: Partial<Omit<ChatSessionDB, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data as ChatSessionDB;
}

/**
 * Delete chat session (cascades to messages)
 */
export async function deleteChatSession(sessionId: string) {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}

/**
 * Toggle pin status for chat session
 */
export async function togglePinChatSession(sessionId: string, isPinned: boolean) {
  const updates: Partial<ChatSessionDB> = {
    is_pinned: isPinned,
    pinned_at: isPinned ? new Date().toISOString() : null,
  };

  return updateChatSession(sessionId, updates);
}

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

export interface MessageDB {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  message_type: 'text' | 'audio';
  audio_uri: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Get all messages for a chat session
 */
export async function getMessages(chatId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as MessageDB[];
}

/**
 * Create a new message
 */
export async function createMessage(
  userId: string,
  chatId: string,
  messageId: string,
  content: string,
  role: 'user' | 'assistant',
  messageType: 'text' | 'audio' = 'text',
  audioUri: string | null = null
) {
  const { data, error } = await supabase
    .from('messages')
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

/**
 * Delete all messages in a chat session
 */
export async function deleteMessages(chatId: string) {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('chat_id', chatId);

  if (error) throw error;
}

// ============================================================================
// CHECK-IN OPERATIONS
// ============================================================================

export interface CheckinDB {
  id: number;
  user_id: string;
  mood: number;
  notes: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all check-ins for a user
 */
export async function getCheckins(userId: string) {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data as CheckinDB[];
}

/**
 * Get check-in by date
 */
export async function getCheckinByDate(userId: string, date: string) {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data as CheckinDB | null;
}

/**
 * Create check-in
 */
export async function createCheckin(userId: string, mood: number, notes: string | null, date: string) {
  const { data, error } = await supabase
    .from('checkins')
    .insert({
      user_id: userId,
      mood,
      notes,
      date,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CheckinDB;
}

/**
 * Update check-in
 */
export async function updateCheckin(checkinId: number, mood: number, notes: string | null) {
  const { data, error } = await supabase
    .from('checkins')
    .update({ mood, notes })
    .eq('id', checkinId)
    .select()
    .single();

  if (error) throw error;
  return data as CheckinDB;
}

/**
 * Delete check-in
 */
export async function deleteCheckin(checkinId: number) {
  const { error } = await supabase
    .from('checkins')
    .delete()
    .eq('id', checkinId);

  if (error) throw error;
}

// ============================================================================
// JOURNAL ENTRY OPERATIONS
// ============================================================================

export interface JournalEntryDB {
  id: number;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all journal entries for a user
 */
export async function getJournalEntries(userId: string) {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as JournalEntryDB[];
}

/**
 * Get single journal entry
 */
export async function getJournalEntry(entryId: number) {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (error) throw error;
  return data as JournalEntryDB;
}

/**
 * Create journal entry
 */
export async function createJournalEntry(userId: string, title: string, content: string) {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: userId,
      title,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data as JournalEntryDB;
}

/**
 * Update journal entry
 */
export async function updateJournalEntry(entryId: number, title: string, content: string) {
  const { data, error } = await supabase
    .from('journal_entries')
    .update({ title, content })
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw error;
  return data as JournalEntryDB;
}

/**
 * Delete journal entry
 */
export async function deleteJournalEntry(entryId: number) {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
}

// ============================================================================
// GLOBAL STATISTICS OPERATIONS
// ============================================================================

export interface GlobalChatStats {
  date: string;
  active_users: number;
  total_messages: number;
  avg_messages_per_user: number;
}

/**
 * Get global chat statistics for a date range
 * This aggregates data across all users
 */
export async function getGlobalChatStatistics(
  startDate: string,
  endDate: string
): Promise<GlobalChatStats[]> {
  try {
    // Query messages grouped by date to get daily statistics
    // Note: This requires appropriate RLS policies or a database function
    // For now, we'll query all messages in the date range and aggregate client-side
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('user_id, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (messagesError) {
      console.warn('Error fetching global chat statistics:', messagesError);
      return [];
    }

    // Aggregate messages by date
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

    // Convert to array format
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

    // Sort by date
    result.sort((a, b) => a.date.localeCompare(b.date));

    return result;
  } catch (error) {
    console.error('Error getting global chat statistics:', error);
    return [];
  }
}

// ============================================================================
// SYNC UTILITIES
// ============================================================================

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  // In a real app, check network connectivity
  // For now, just check if session exists
  return true;
}

/**
 * Get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

