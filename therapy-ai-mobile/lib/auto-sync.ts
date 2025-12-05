import { supabase } from './supabase';
import * as SupabaseService from './supabase-services';

export async function isUserLoggedIn(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  } catch {
    return false;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

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
    if (!userId) return;

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
  }
}

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

export async function autoSyncCheckin(
  mood: number,
  notes: string | null,
  date: string,
  checkin_id?: string
): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    let existing = checkin_id
      ? await SupabaseService.getCheckinByUuid(userId, checkin_id)
      : null;
    
    if (!existing) {
      existing = await SupabaseService.getCheckinByDate(userId, date);
    }
    
    if (existing) {
      await SupabaseService.updateCheckin(existing.id, mood, notes);
    } else {
      const uuid = checkin_id || generateUUID();
      await SupabaseService.createCheckin(userId, mood, notes, date, uuid);
    }
  } catch (error) {
    console.log('Auto-sync check-in failed:', error);
  }
}

export async function autoSyncJournalEntry(
  title: string,
  content: string,
  journal_id?: string
): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    let existing = journal_id
      ? await SupabaseService.getJournalEntryByUuid(userId, journal_id)
      : null;
    
    if (existing) {
      await SupabaseService.updateJournalEntry(existing.id, title, content);
    } else {
      const uuid = journal_id || generateUUID();
      await SupabaseService.createJournalEntry(userId, title, content, uuid);
    }
  } catch (error) {
    console.log('Auto-sync journal failed:', error);
  }
}

export async function autoSyncDeleteChatSession(chatId: string): Promise<void> {
  try {
    const isLoggedIn = await isUserLoggedIn();
    if (!isLoggedIn) return;

    await SupabaseService.deleteChatSession(chatId);
  } catch (error) {
    console.log('Auto-sync delete failed:', error);
  }
}

