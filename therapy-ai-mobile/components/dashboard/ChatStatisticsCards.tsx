import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatStatistics } from '../../contexts/DashboardContext';

interface ChatStatisticsCardsProps {
  statistics: ChatStatistics | null;
  loading: boolean;
}

export const ChatStatisticsCards: React.FC<ChatStatisticsCardsProps> = ({ 
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
          <Text style={styles.errorText}>No chat data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardIcon}>💬</Text>
        <Text style={styles.cardValue}>{statistics.totalMessages}</Text>
        <Text style={styles.cardLabel}>Total Messages</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardIcon}>📝</Text>
        <Text style={styles.cardValue}>{statistics.totalSessions}</Text>
        <Text style={styles.cardLabel}>Chat Sessions</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardIcon}>📊</Text>
        <Text style={styles.cardValue}>{statistics.averageMessagesPerSession.toFixed(1)}</Text>
        <Text style={styles.cardLabel}>Avg per Session</Text>
        <Text style={styles.cardSubtext}>
          Last 7 days: {statistics.messagesLast7Days}
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

