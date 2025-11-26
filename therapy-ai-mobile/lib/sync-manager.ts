import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { database } from '../utils/database.async';
import * as SupabaseService from './supabase-services';

const STORAGE_PREFIX = 'appv1';
const SYNC_KEYS = {
  lastSyncTime: 'sync:last_sync_time',
  syncEnabled: 'sync:enabled',
  pendingSync: 'sync:pending_operations',
};

const chatSessionsKey = (userId: string) => `${STORAGE_PREFIX}:${userId}:chatSessions`;
const chatMessagesKey = (userId: string, chatId: string) =>
  `${STORAGE_PREFIX}:${userId}:messages:${chatId}`;

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'chat' | 'message' | 'checkin' | 'journal';
  data: any;
  timestamp: string;
}

export async function isSyncEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(SYNC_KEYS.syncEnabled);
    return enabled === 'true';
  } catch {
    return false;
  }
}

export async function enableSync() {
  await AsyncStorage.setItem(SYNC_KEYS.syncEnabled, 'true');
}

export async function disableSync() {
  await AsyncStorage.setItem(SYNC_KEYS.syncEnabled, 'false');
}

export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const timestamp = await AsyncStorage.getItem(SYNC_KEYS.lastSyncTime);
    return timestamp ? new Date(timestamp) : null;
  } catch {
    return null;
  }
}

async function updateLastSyncTime() {
  await AsyncStorage.setItem(SYNC_KEYS.lastSyncTime, new Date().toISOString());
}

async function getPendingOperations(): Promise<PendingOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_KEYS.pendingSync);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function addPendingOperation(operation: PendingOperation) {
  const pending = await getPendingOperations();
  pending.push(operation);
  await AsyncStorage.setItem(SYNC_KEYS.pendingSync, JSON.stringify(pending));
}

async function clearPendingOperations() {
  await AsyncStorage.setItem(SYNC_KEYS.pendingSync, JSON.stringify([]));
}

export async function syncChatSessionsToCloud(userId: string) {
  try {
    const localSessions = await AsyncStorage.getItem(chatSessionsKey(userId));
    if (!localSessions) return;

    const sessions = JSON.parse(localSessions);

    for (const session of sessions) {
      await SupabaseService.createChatSession(userId, session.id, session.title);
      
      const localMessages = await AsyncStorage.getItem(chatMessagesKey(userId, session.id));
      
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

export async function syncChatSessionsFromCloud(userId: string) {
  try {
    const cloudSessions = await SupabaseService.getChatSessions(userId);

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

    await AsyncStorage.setItem(chatSessionsKey(userId), JSON.stringify(localSessions));

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
        chatMessagesKey(userId, session.id),
        JSON.stringify(localMessages)
      );
    }

    console.log('Chat sessions synced from cloud');
  } catch (error) {
    console.error('Error syncing from cloud:', error);
    throw error;
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

export async function syncCheckinsToCloud(userId: string) {
  try {
    const localCheckins = await database.getAllCheckinEntries();

    for (const checkin of localCheckins) {
      try {
        let existing = checkin.checkin_id 
          ? await SupabaseService.getCheckinByUuid(userId, checkin.checkin_id)
          : null;
        
        if (!existing) {
          existing = await SupabaseService.getCheckinByDate(userId, checkin.date);
        }
        
        if (existing) {
          await SupabaseService.updateCheckin(existing.id, checkin.mood, checkin.notes);
          console.log(`[Sync Manager] Updated check-in for date ${checkin.date} (ID: ${existing.id})`);
        } else {
          const checkinId = checkin.checkin_id || generateUUID();
          await SupabaseService.createCheckin(
            userId,
            checkin.mood,
            checkin.notes,
            checkin.date,
            checkinId
          );
          console.log(`[Sync Manager] Created check-in for date ${checkin.date} (UUID: ${checkinId})`);
        }
      } catch (error) {
        console.error(`[Sync Manager] Error syncing check-in ${checkin.id}:`, error);
      }
    }

    console.log('Check-ins synced to cloud');
  } catch (error) {
    console.error('Error syncing check-ins:', error);
    throw error;
  }
}

export async function syncCheckinsFromCloud(userId: string) {
  try {
    const cloudCheckins = await SupabaseService.getCheckins(userId);
    console.log(`Fetched ${cloudCheckins.length} check-ins from cloud`);
  } catch (error) {
    console.error('Error syncing check-ins from cloud:', error);
    throw error;
  }
}

export async function syncJournalToCloud(userId: string) {
  try {
    const localEntries = await database.getAllJournalEntries();

    for (const entry of localEntries) {
      try {
        let existing = entry.journal_id
          ? await SupabaseService.getJournalEntryByUuid(userId, entry.journal_id)
          : null;
        
        if (existing) {
          await SupabaseService.updateJournalEntry(existing.id, entry.title, entry.content);
          console.log(`[Sync Manager] Updated journal entry: ${entry.title} (ID: ${existing.id})`);
        } else {
          const journalId = entry.journal_id || generateUUID();
          await SupabaseService.createJournalEntry(
            userId,
            entry.title,
            entry.content,
            journalId
          );
          console.log(`[Sync Manager] Created journal entry: ${entry.title} (UUID: ${journalId})`);
        }
      } catch (error) {
        console.error(`[Sync Manager] Error syncing journal entry ${entry.id}:`, error);
      }
    }

    console.log('Journal entries synced to cloud');
  } catch (error) {
    console.error('Error syncing journal:', error);
    throw error;
  }
}

export async function syncJournalFromCloud(userId: string) {
  try {
    const cloudEntries = await SupabaseService.getJournalEntries(userId);
    console.log(`Fetched ${cloudEntries.length} journal entries from cloud`);
  } catch (error) {
    console.error('Error syncing journal from cloud:', error);
    throw error;
  }
}

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

export async function performBidirectionalSync(userId: string) {
  try {
    await performFullSyncToCloud(userId);
    await performFullSyncFromCloud(userId);
    
    console.log('Bidirectional sync completed');
  } catch (error) {
    console.error('Bidirectional sync failed:', error);
    throw error;
  }
}

let networkSubscription: any = null;
let appStateListener: any = null;
let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;

export async function performBackgroundSync(): Promise<void> {
  if (isSyncing) {
    console.log('[Sync Manager] Sync already in progress, skipping...');
    return;
  }

  try {
    isSyncing = true;

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('[Sync Manager] No network connection, skipping sync');
      return;
    }

    const userId = await SupabaseService.getCurrentUserId();
    if (!userId) {
      console.log('[Sync Manager] No user logged in, skipping sync');
      return;
    }

    console.log('[Sync Manager] Starting background sync...');
    
    await Promise.all([
      syncCheckinsToCloud(userId),
      syncJournalToCloud(userId),
    ]);
    
    await updateLastSyncTime();
    
    console.log('[Sync Manager] Background sync completed successfully');
  } catch (error) {
    console.error('[Sync Manager] Background sync failed:', error);
  } finally {
    isSyncing = false;
  }
}

export function startBackgroundSync(): void {
  stopBackgroundSync();

  console.log('[Sync Manager] Starting background sync service...');

  performBackgroundSync();

  networkSubscription = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      console.log('[Sync Manager] Network connected, triggering sync...');
      performBackgroundSync();
    } else {
      console.log('[Sync Manager] Network disconnected');
    }
  });

  appStateListener = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      console.log('[Sync Manager] App came to foreground, triggering sync...');
      performBackgroundSync();
    }
  });

  syncInterval = setInterval(() => {
    performBackgroundSync();
  }, 30000);
}

export function stopBackgroundSync(): void {
  if (networkSubscription) {
    networkSubscription();
    networkSubscription = null;
  }

  if (appStateListener) {
    appStateListener.remove();
    appStateListener = null;
  }

  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }

  console.log('[Sync Manager] Background sync service stopped');
}

export async function triggerManualSync(): Promise<void> {
  console.log('[Sync Manager] Manual sync triggered');
  await performBackgroundSync();
}

