/**
 * Groq Audio Services
 * Handles Speech-to-Text (Whisper) and Text-to-Speech
 */

import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

/**
 * Convert speech to text using Groq Whisper
 */
export async function speechToText(audioUri: string): Promise<string> {
  try {
    console.log('Converting speech to text:', audioUri);

    // Get session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    // Read audio file as base64
    const audioData = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Call Groq Whisper API via Edge Function (to keep API key secure)
    const response = await fetch(
      `https://hhquqcuqeadsrozlrjpj.supabase.co/functions/v1/audio-transcribe`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          audioData,
          fileExtension: 'wav', // or detect from uri
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }

    const result = await response.json();
    console.log('Transcription result:', result.text);
    return result.text;
  } catch (error) {
    console.error('Speech-to-text error:', error);
    throw error;
  }
}

/**
 * Convert text to speech using Groq TTS
 */
export async function textToSpeech(text: string): Promise<string> {
  try {
    console.log('Converting text to speech:', text.substring(0, 50) + '...');

    // Get session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    // Call Groq TTS API via Edge Function
    const response = await fetch(
      `https://hhquqcuqeadsrozlrjpj.supabase.co/functions/v1/text-to-speech`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text,
          voice: 'Aaliyah-PlayAI', // Warm, empathetic voice for therapy
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS error:', errorText.substring(0, 200));
      throw new Error(`Failed to generate speech: ${errorText.substring(0, 100)}`);
    }

    // Get audio as base64
    const result = await response.json();
    
    if (!result.audioData) {
      console.error('No audio data in response:', result);
      throw new Error('No audio data returned from TTS service');
    }
    
    // Save to local file
    const audioUri = `${FileSystem.cacheDirectory}tts_${Date.now()}.wav`;
    await FileSystem.writeAsStringAsync(audioUri, result.audioData, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('TTS audio saved:', audioUri);
    return audioUri;
  } catch (error) {
    console.error('Text-to-speech error:', error);
    throw error;
  }
}

/**
 * Check if TTS is enabled in user settings
 */
export async function isTTSEnabled(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('notification_enabled') // Reuse this or add tts_enabled field
      .single();
    
    return data?.notification_enabled ?? false;
  } catch {
    return false;
  }
}

