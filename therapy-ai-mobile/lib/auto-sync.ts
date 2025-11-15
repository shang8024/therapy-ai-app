/**
 * Auto-Sync Service
 * Automatically syncs data to cloud when user is logged in
 */

import { supabase } from './supabase';
import * as SupabaseService from './supabase-services';

/**
 * Check if user is logged in
 */
export async function isUserLoggedIn(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  } catch {
    return false;
  }
}

/**
 * Get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Auto-save message to cloud (if logged in)
 */
export async function autoSyncMessage(
  messageId: string,
  chatId: string,
  content: string,
  role: 'user' | 'assistant',
  messageType: 'text' | 'audio' = 'text',
  audioUri: string | null = null
): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return; // Not logged in, skip cloud sync

    await SupabaseService.createMessage(
      userId,
      chatId,
      messageId,
      content,
      role,
      messageType,
      audioUri
    );
  } catch (error) {
    console.log('Auto-sync message failed (offline or error):', error);
    // Fail silently - data is already saved locally
  }
}

/**
 * Auto-save chat session to cloud (if logged in)
 */
export async function autoSyncChatSession(
  chatId: string,
  updates: {
    title?: string;
    lastMessage?: string;
    lastMessageAt?: Date;
    messageCount?: number;
    isPinned?: boolean;
  }
): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.lastMessage) updateData.last_message = updates.lastMessage;
    if (updates.lastMessageAt) updateData.last_message_at = updates.lastMessageAt.toISOString();
    if (updates.messageCount !== undefined) updateData.message_count = updates.messageCount;
    if (updates.isPinned !== undefined) {
      updateData.is_pinned = updates.isPinned;
      updateData.pinned_at = updates.isPinned ? new Date().toISOString() : null;
    }

    await SupabaseService.updateChatSession(chatId, updateData);
  } catch (error) {
    console.log('Auto-sync chat session failed:', error);
  }
}

/**
 * Auto-save check-in to cloud (if logged in)
 */
export async function autoSyncCheckin(
  mood: number,
  notes: string | null,
  date: string
): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    // Check if already exists
    const existing = await SupabaseService.getCheckinByDate(userId, date);
    
    if (existing) {
      // Update existing
      await SupabaseService.updateCheckin(existing.id, mood, notes);
    } else {
      // Create new
      await SupabaseService.createCheckin(userId, mood, notes, date);
    }
  } catch (error) {
    console.log('Auto-sync check-in failed:', error);
  }
}

/**
 * Auto-save journal entry to cloud (if logged in)
 */
export async function autoSyncJournalEntry(
  title: string,
  content: string
): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await SupabaseService.createJournalEntry(userId, title, content);
  } catch (error) {
    console.log('Auto-sync journal failed:', error);
  }
}

/**
 * Delete from cloud (if logged in)
 */
export async function autoSyncDeleteChatSession(chatId: string): Promise<void> {
  try {
    const isLoggedIn = await isUserLoggedIn();
    if (!isLoggedIn) return;

    await SupabaseService.deleteChatSession(chatId);
  } catch (error) {
    console.log('Auto-sync delete failed:', error);
  }
}

