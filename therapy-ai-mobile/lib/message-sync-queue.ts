/**
 * Message Sync Queue
 * Handles reliable background syncing of messages to Supabase
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SupabaseService from './supabase-services';

const SYNC_QUEUE_KEY = 'message_sync_queue';

interface QueuedMessage {
  userId: string;
  chatId: string;
  messageId: string;
  content: string;
  role: 'user' | 'assistant';
  messageType: 'text' | 'audio';
  audioUri: string | null;
  timestamp: string;
  retryCount: number;
}

/**
 * Add message to sync queue
 */
export async function queueMessageForSync(
  userId: string,
  chatId: string,
  messageId: string,
  content: string,
  role: 'user' | 'assistant',
  messageType: 'text' | 'audio' = 'text',
  audioUri: string | null = null
): Promise<void> {
  try {
    const queue = await getSyncQueue();
    
    // Check if message already in queue
    const exists = queue.some(m => m.messageId === messageId);
    if (exists) return;

    const queuedMessage: QueuedMessage = {
      userId,
      chatId,
      messageId,
      content,
      role,
      messageType,
      audioUri,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    queue.push(queuedMessage);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    
    // Try to process queue immediately
    processQueueInBackground();
  } catch (error) {
    console.error('Failed to queue message for sync:', error);
  }
}

/**
 * Get sync queue
 */
async function getSyncQueue(): Promise<QueuedMessage[]> {
  try {
    const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save sync queue
 */
async function saveSyncQueue(queue: QueuedMessage[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to save sync queue:', error);
  }
}

/**
 * Process sync queue in background
 */
export async function processQueueInBackground(): Promise<void> {
  // Don't await this - let it run in background
  processSyncQueue().catch(error => {
    console.log('Background sync queue processing failed:', error);
  });
}

/**
 * Process sync queue
 */
async function processSyncQueue(): Promise<void> {
  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  const processed: string[] = [];
  const failed: QueuedMessage[] = [];

  for (const item of queue) {
    try {
      // Try to sync message
      await SupabaseService.createMessage(
        item.userId,
        item.chatId,
        item.messageId,
        item.content,
        item.role,
        item.messageType,
        item.audioUri
      );
      
      // Success - mark for removal
      processed.push(item.messageId);
      console.log('✅ Synced message to cloud:', item.messageId);
    } catch (error: any) {
      // If duplicate key error, consider it synced (Edge Function probably saved it)
      if (error?.message?.includes('duplicate') || error?.message?.includes('unique')) {
        processed.push(item.messageId);
        console.log('✅ Message already in cloud:', item.messageId);
      } else {
        // Real error - retry up to 3 times
        if (item.retryCount < 3) {
          failed.push({ ...item, retryCount: item.retryCount + 1 });
          console.warn(`⚠️ Failed to sync message (retry ${item.retryCount + 1}/3):`, item.messageId);
        } else {
          // Give up after 3 retries
          console.error('❌ Failed to sync message after 3 retries, removing from queue:', item.messageId);
        }
      }
    }
  }

  // Remove processed messages and keep failed ones for retry
  const remainingQueue = queue.filter(
    item => !processed.includes(item.messageId)
  );
  
  await saveSyncQueue([...failed, ...remainingQueue]);
}

/**
 * Get sync queue status
 */
export async function getSyncQueueStatus(): Promise<{
  pendingCount: number;
  oldestTimestamp: string | null;
}> {
  const queue = await getSyncQueue();
  return {
    pendingCount: queue.length,
    oldestTimestamp: queue.length > 0 ? queue[0].timestamp : null,
  };
}

/**
 * Clear sync queue (for testing or manual cleanup)
 */
export async function clearSyncQueue(): Promise<void> {
  await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
}

