/**
 * Sync Manager
 * 
 * Handles synchronization between local AsyncStorage and Supabase cloud.
 * Provides offline-first functionality with cloud backup.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../utils/database.async';
import * as SupabaseService from './supabase-services';

// ============================================================================
// SYNC CONFIGURATION
// ============================================================================

const SYNC_KEYS = {
  lastSyncTime: 'sync:last_sync_time',
  syncEnabled: 'sync:enabled',
  pendingSync: 'sync:pending_operations',
};

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'chat' | 'message' | 'checkin' | 'journal';
  data: any;
  timestamp: string;
}

// ============================================================================
// SYNC STATUS
// ============================================================================

/**
 * Check if cloud sync is enabled
 */
export async function isSyncEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(SYNC_KEYS.syncEnabled);
    return enabled === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable cloud sync
 */
export async function enableSync() {
  await AsyncStorage.setItem(SYNC_KEYS.syncEnabled, 'true');
}

/**
 * Disable cloud sync
 */
export async function disableSync() {
  await AsyncStorage.setItem(SYNC_KEYS.syncEnabled, 'false');
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const timestamp = await AsyncStorage.getItem(SYNC_KEYS.lastSyncTime);
    return timestamp ? new Date(timestamp) : null;
  } catch {
    return null;
  }
}

/**
 * Update last sync timestamp
 */
async function updateLastSyncTime() {
  await AsyncStorage.setItem(SYNC_KEYS.lastSyncTime, new Date().toISOString());
}

// ============================================================================
// PENDING OPERATIONS QUEUE
// ============================================================================

/**
 * Get pending sync operations
 */
async function getPendingOperations(): Promise<PendingOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_KEYS.pendingSync);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Add operation to pending queue
 */
async function addPendingOperation(operation: PendingOperation) {
  const pending = await getPendingOperations();
  pending.push(operation);
  await AsyncStorage.setItem(SYNC_KEYS.pendingSync, JSON.stringify(pending));
}

/**
 * Clear pending operations
 */
async function clearPendingOperations() {
  await AsyncStorage.setItem(SYNC_KEYS.pendingSync, JSON.stringify([]));
}

// ============================================================================
// CHAT SESSION SYNC
// ============================================================================

/**
 * Sync chat sessions from local to cloud
 */
export async function syncChatSessionsToCloud(userId: string) {
  try {
    const localSessions = await AsyncStorage.getItem('appv1:chatSessions');
    if (!localSessions) return;

    const sessions = JSON.parse(localSessions);

    for (const session of sessions) {
      await SupabaseService.createChatSession(userId, session.id, session.title);
      
      // Sync messages for this session
      const messagesKey = `appv1:messages:${session.id}`;
      const localMessages = await AsyncStorage.getItem(messagesKey);
      
      if (localMessages) {
        const messages = JSON.parse(localMessages);
        for (const message of messages) {
          await SupabaseService.createMessage(
            userId,
            session.id,
            message.id,
            message.content,
            message.role,
            message.messageType || 'text',
            message.audioUri || null
          );
        }
      }
    }

    console.log('Chat sessions synced to cloud');
  } catch (error) {
    console.error('Error syncing chat sessions:', error);
    throw error;
  }
}

/**
 * Sync chat sessions from cloud to local
 */
export async function syncChatSessionsFromCloud(userId: string) {
  try {
    const cloudSessions = await SupabaseService.getChatSessions(userId);

    // Transform cloud data to local format
    const localSessions = cloudSessions.map(session => ({
      id: session.id,
      title: session.title,
      createdAt: session.created_at,
      lastMessage: session.last_message,
      lastMessageAt: session.last_message_at,
      messageCount: session.message_count,
      isPinned: session.is_pinned,
      pinnedAt: session.pinned_at,
    }));

    await AsyncStorage.setItem('appv1:chatSessions', JSON.stringify(localSessions));

    // Sync messages for each session
    for (const session of cloudSessions) {
      const cloudMessages = await SupabaseService.getMessages(session.id);
      
      const localMessages = cloudMessages.map(msg => ({
        id: msg.id,
        chatId: msg.chat_id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.created_at,
        messageType: msg.message_type,
        audioUri: msg.audio_uri,
      }));

      await AsyncStorage.setItem(
        `appv1:messages:${session.id}`,
        JSON.stringify(localMessages)
      );
    }

    console.log('Chat sessions synced from cloud');
  } catch (error) {
    console.error('Error syncing from cloud:', error);
    throw error;
  }
}

// ============================================================================
// CHECK-IN SYNC
// ============================================================================

/**
 * Sync check-ins to cloud
 */
export async function syncCheckinsToCloud(userId: string) {
  try {
    const localCheckins = await database.getAllCheckinEntries();

    for (const checkin of localCheckins) {
      // Check if already exists in cloud
      const existing = await SupabaseService.getCheckinByDate(userId, checkin.date);
      
      if (!existing) {
        await SupabaseService.createCheckin(
          userId,
          checkin.mood,
          checkin.notes,
          checkin.date
        );
      }
    }

    console.log('Check-ins synced to cloud');
  } catch (error) {
    console.error('Error syncing check-ins:', error);
    throw error;
  }
}

/**
 * Sync check-ins from cloud
 */
export async function syncCheckinsFromCloud(userId: string) {
  try {
    const cloudCheckins = await SupabaseService.getCheckins(userId);

    // Note: This is a simplified version
    // In production, you'd want to merge with local data intelligently
    console.log(`Fetched ${cloudCheckins.length} check-ins from cloud`);
    
    // You can implement local storage update here if needed
  } catch (error) {
    console.error('Error syncing check-ins from cloud:', error);
    throw error;
  }
}

// ============================================================================
// JOURNAL SYNC
// ============================================================================

/**
 * Sync journal entries to cloud
 */
export async function syncJournalToCloud(userId: string) {
  try {
    const localEntries = await database.getAllJournalEntries();

    for (const entry of localEntries) {
      await SupabaseService.createJournalEntry(
        userId,
        entry.title,
        entry.content
      );
    }

    console.log('Journal entries synced to cloud');
  } catch (error) {
    console.error('Error syncing journal:', error);
    throw error;
  }
}

/**
 * Sync journal entries from cloud
 */
export async function syncJournalFromCloud(userId: string) {
  try {
    const cloudEntries = await SupabaseService.getJournalEntries(userId);
    console.log(`Fetched ${cloudEntries.length} journal entries from cloud`);
  } catch (error) {
    console.error('Error syncing journal from cloud:', error);
    throw error;
  }
}

// ============================================================================
// FULL SYNC
// ============================================================================

/**
 * Perform full sync (upload local data to cloud)
 */
export async function performFullSyncToCloud(userId: string) {
  try {
    console.log('Starting full sync to cloud...');
    
    await syncChatSessionsToCloud(userId);
    await syncCheckinsToCloud(userId);
    await syncJournalToCloud(userId);
    
    await updateLastSyncTime();
    await clearPendingOperations();
    
    console.log('Full sync to cloud completed');
  } catch (error) {
    console.error('Full sync failed:', error);
    throw error;
  }
}

/**
 * Perform full sync (download cloud data to local)
 */
export async function performFullSyncFromCloud(userId: string) {
  try {
    console.log('Starting full sync from cloud...');
    
    await syncChatSessionsFromCloud(userId);
    await syncCheckinsFromCloud(userId);
    await syncJournalFromCloud(userId);
    
    await updateLastSyncTime();
    
    console.log('Full sync from cloud completed');
  } catch (error) {
    console.error('Sync from cloud failed:', error);
    throw error;
  }
}

/**
 * Sync in both directions (merge local and cloud)
 */
export async function performBidirectionalSync(userId: string) {
  try {
    // First upload local changes
    await performFullSyncToCloud(userId);
    
    // Then download any cloud changes
    await performFullSyncFromCloud(userId);
    
    console.log('Bidirectional sync completed');
  } catch (error) {
    console.error('Bidirectional sync failed:', error);
    throw error;
  }
}

