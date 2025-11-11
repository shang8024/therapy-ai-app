/**
 * Groq AI Service
 * Handles communication with Supabase Edge Function for AI chat
 */

import { supabase } from './supabase';
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamResponse {
  content: string;
  done: boolean;
}

/**
 * Send message to AI and get streaming response
 */
export async function sendMessageToAI(
  message: string,
  chatId: string,
  userId: string,
  conversationHistory: ChatMessage[] = [],
  onChunk: (content: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: Error) => void
) {
  try {
    console.log('Sending message to AI:', { message, chatId, userId, historyLength: conversationHistory.length });
    
    // Get session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }
    
    console.log('Session valid, calling edge function...');

    // Use XMLHttpRequest for streaming support in React Native
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let fullResponse = '';
      let lastIndex = 0;

      xhr.open('POST', 'https://hhquqcuqeadsrozlrjpj.supabase.co/functions/v1/Groq-LLM', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);

      xhr.onprogress = () => {
        const text = xhr.responseText;
        const newData = text.substring(lastIndex);
        lastIndex = text.length;

        if (newData) {
          const lines = newData.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                console.log('Stream completed, full response:', fullResponse);
                onComplete(fullResponse);
                resolve();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullResponse += parsed.content;
                  onChunk(parsed.content);
                }
              } catch (e) {
                console.error('Error parsing chunk:', e, 'Data:', data);
              }
            }
          }
        }
      };

      xhr.onload = () => {
        console.log('XHR onload, status:', xhr.status);
        if (xhr.status === 200) {
          if (fullResponse) {
            onComplete(fullResponse);
            resolve();
          } else {
            const error = new Error('No response received from AI');
            onError(error);
            reject(error);
          }
        } else {
          let errorMessage = 'Failed to get AI response';
          try {
            const errorJson = JSON.parse(xhr.responseText);
            errorMessage = errorJson.error || xhr.responseText;
          } catch (e) {
            errorMessage = xhr.responseText || `HTTP ${xhr.status}`;
          }
          console.error('Edge function error:', errorMessage);
          const error = new Error(errorMessage);
          onError(error);
          reject(error);
        }
      };

      xhr.onerror = () => {
        console.error('XHR error');
        const error = new Error('Network error while calling AI service');
        onError(error);
        reject(error);
      };

      xhr.ontimeout = () => {
        console.error('XHR timeout');
        const error = new Error('Request timeout');
        onError(error);
        reject(error);
      };

      const requestBody = JSON.stringify({
        message,
        chatId,
        userId,
        conversationHistory: conversationHistory.slice(-10),
      });

      console.log('Sending XHR request...');
      xhr.send(requestBody);
    });
  } catch (error) {
    console.error('AI service error:', error);
    const err = error instanceof Error ? error : new Error('Unknown error');
    onError(err);
    throw err;
  }
}

/**
 * Check if AI service is available
 */
export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const response = await fetch(
      `https://hhquqcuqeadsrozlrjpj.supabase.co/functions/v1/Groq-LLM`,
      {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}

