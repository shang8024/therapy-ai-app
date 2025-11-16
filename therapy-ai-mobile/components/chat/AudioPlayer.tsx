/**
 * Audio Player Component
 * Plays AI voice responses
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useTheme } from '../../contexts/ThemeContext';

interface AudioPlayerProps {
  audioUri: string;
  autoPlay?: boolean;
}

export default function AudioPlayer({ audioUri, autoPlay = false }: AudioPlayerProps) {
  const { theme } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    loadSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUri]);

  useEffect(() => {
    if (autoPlay && sound && !isPlaying && !isLoading) {
      playSound();
    }
  }, [autoPlay, sound, isLoading]);

  const loadSound = async () => {
    try {
      console.log('🎵 Loading audio:', audioUri.substring(0, 50));
      setIsLoading(true);
      
      // Set audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsLoading(false);
      console.log('✅ Audio loaded successfully');
    } catch (error) {
      console.error('❌ Error loading audio:', error);
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const playSound = async () => {
    if (!sound) return;
    try {
      console.log('▶️ Playing audio...');
      await sound.playAsync();
    } catch (error) {
      console.error('❌ Error playing sound:', error);
    }
  };

  const pauseSound = async () => {
    if (!sound) return;
    try {
      await sound.pauseAsync();
    } catch (error) {
      console.error('Error pausing sound:', error);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseSound();
    } else {
      playSound();
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading audio...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Pressable
        style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
        onPress={togglePlayPause}
      >
        <Text style={styles.playButtonText}>
          {isPlaying ? '⏸️' : '▶️'}
        </Text>
      </Pressable>

      <View style={styles.infoContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.primary,
                width: `${duration > 0 ? (position / duration) * 100 : 0}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
          {formatTime(position)} / {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playButtonText: {
    fontSize: 16,
  },
  infoContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
  },
  timeText: {
    fontSize: 12,
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 8,
  },
});

