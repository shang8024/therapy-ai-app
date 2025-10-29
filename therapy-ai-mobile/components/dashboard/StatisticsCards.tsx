import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DashboardStatistics } from '../../contexts/DashboardContext';
import { MOOD_LEVELS } from '../../constants/checkin';

interface StatisticsCardsProps {
  statistics: DashboardStatistics | null;
  loading: boolean;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ 
  statistics, 
  loading 
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, styles.loadingCard]}>
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </View>
    );
  }

  if (!statistics) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, styles.errorCard]}>
          <Text style={styles.errorText}>No data available</Text>
        </View>
      </View>
    );
  }

  const getMoodEmoji = (mood: number) => {
    const moodLevel = MOOD_LEVELS.find(level => level.value === Math.round(mood));
    return moodLevel?.emoji || '😐';
  };

  const getMoodLabel = (mood: number) => {
    const moodLevel = MOOD_LEVELS.find(level => level.value === Math.round(mood));
    return moodLevel?.label || 'Unknown';
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardIcon}>📊</Text>
        <Text style={styles.cardValue}>{statistics.totalCheckins}</Text>
        <Text style={styles.cardLabel}>Total Check-ins</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardIcon}>🔥</Text>
        <Text style={styles.cardValue}>{statistics.currentStreak}</Text>
        <Text style={styles.cardLabel}>Current Streak</Text>
        <Text style={styles.cardSubtext}>
          Best: {statistics.longestStreak} days
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardIcon}>{getMoodEmoji(statistics.averageMood)}</Text>
        <Text style={styles.cardValue}>{statistics.averageMood.toFixed(1)}</Text>
        <Text style={styles.cardLabel}>Average Mood</Text>
        <Text style={styles.cardSubtext}>
          {getMoodLabel(statistics.averageMood)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  loadingCard: {
    backgroundColor: '#f8f9fa',
  },
  errorCard: {
    backgroundColor: '#fee',
    borderColor: '#fcc',
  },
  cardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  cardSubtext: {
    fontSize: 10,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 2,
  },
  loadingText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
  },
});
