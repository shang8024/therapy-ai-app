import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ChatTrendData } from '../../contexts/DashboardContext';

interface ChatMetricsChartProps {
  chatTrend7Days: ChatTrendData | null;
  chatTrend30Days: ChatTrendData | null;
  selectedTimeRange: '7days' | '30days';
  onTimeRangeChange: (range: '7days' | '30days') => void;
  loading: boolean;
}

const screenWidth = Dimensions.get('window').width;

export const ChatMetricsChart: React.FC<ChatMetricsChartProps> = ({
  chatTrend7Days,
  chatTrend30Days,
  selectedTimeRange,
  onTimeRangeChange,
  loading,
}) => {
  const currentData = selectedTimeRange === '7days' ? chatTrend7Days : chatTrend30Days;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages Per Day</Text>
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.loadingText}>Loading chart...</Text>
        </View>
      </View>
    );
  }

  if (!currentData || (currentData.data.every(value => value === 0) && 
      (!currentData.activeUsers || currentData.activeUsers.every(value => value === 0)))) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chat Metrics</Text>
          <View style={styles.timeRangeSelector}>
            <TouchableOpacity
              style={[
                styles.timeRangeButton,
                selectedTimeRange === '7days' && styles.timeRangeButtonActive,
              ]}
              onPress={() => onTimeRangeChange('7days')}
            >
              <Text
                style={[
                  styles.timeRangeButtonText,
                  selectedTimeRange === '7days' && styles.timeRangeButtonTextActive,
                ]}
              >
                7 Days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeRangeButton,
                selectedTimeRange === '30days' && styles.timeRangeButtonActive,
              ]}
              onPress={() => onTimeRangeChange('30days')}
            >
              <Text
                style={[
                  styles.timeRangeButtonText,
                  selectedTimeRange === '30days' && styles.timeRangeButtonTextActive,
                ]}
              >
                30 Days
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.noDataText}>No chat data available</Text>
          <Text style={styles.noDataSubtext}>
            Start chatting to see your message activity trends
          </Text>
        </View>
      </View>
    );
  }

  const hasGlobalData = currentData.activeUsers && currentData.activeUsers.some(v => v > 0);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(155, 89, 182, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(127, 140, 141, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: '#ecf0f1',
    },
  };

  // Prepare datasets for the chart
  const datasets = [
    {
      data: currentData.data,
      color: (opacity = 1) => `rgba(155, 89, 182, ${opacity})`, // Purple for user messages
      strokeWidth: 3,
    },
  ];

  // Add global metrics if available
  if (hasGlobalData && currentData.activeUsers && currentData.avgMessagesPerUser) {
    datasets.push(
      {
        data: currentData.activeUsers,
        color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`, // Blue for active users
        strokeWidth: 2,
      },
      {
        data: currentData.avgMessagesPerUser,
        color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`, // Green for avg messages per person
        strokeWidth: 2,
      }
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat Metrics</Text>
        <View style={styles.timeRangeSelector}>
          <TouchableOpacity
            style={[
              styles.timeRangeButton,
              selectedTimeRange === '7days' && styles.timeRangeButtonActive,
            ]}
            onPress={() => onTimeRangeChange('7days')}
          >
            <Text
              style={[
                styles.timeRangeButtonText,
                selectedTimeRange === '7days' && styles.timeRangeButtonTextActive,
              ]}
            >
              7 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeRangeButton,
              selectedTimeRange === '30days' && styles.timeRangeButtonActive,
            ]}
            onPress={() => onTimeRangeChange('30days')}
          >
            <Text
              style={[
                styles.timeRangeButtonText,
                selectedTimeRange === '30days' && styles.timeRangeButtonTextActive,
              ]}
            >
              30 Days
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={{
            labels: currentData.labels,
            datasets: datasets,
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withDots={true}
          withShadow={false}
          withScrollableDot={false}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={true}
          withHorizontalLines={true}
        />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#9b59b6' }]} />
          <Text style={[styles.legendText, { marginLeft: 6 }]}>Your Messages</Text>
        </View>
        {hasGlobalData && (
          <>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#3498db' }]} />
              <Text style={[styles.legendText, { marginLeft: 6 }]}>Active Users</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
              <Text style={[styles.legendText, { marginLeft: 6 }]}>Avg Msgs/Person</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 2,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeRangeButtonActive: {
    backgroundColor: '#9b59b6',
  },
  timeRangeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  timeRangeButtonTextActive: {
    color: '#ffffff',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#7f8c8d',
    fontWeight: '500',
  },
});

