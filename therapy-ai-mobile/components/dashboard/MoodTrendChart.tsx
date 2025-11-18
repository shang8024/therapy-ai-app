import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MoodTrendData } from '../../contexts/DashboardContext';
import { MOOD_LEVELS } from '../../constants/checkin';

interface MoodTrendChartProps {
  moodTrend7Days: MoodTrendData | null;
  moodTrend30Days: MoodTrendData | null;
  selectedTimeRange: '7days' | '30days';
  onTimeRangeChange: (range: '7days' | '30days') => void;
  loading: boolean;
}

const screenWidth = Dimensions.get('window').width;

export const MoodTrendChart: React.FC<MoodTrendChartProps> = ({
  moodTrend7Days,
  moodTrend30Days,
  selectedTimeRange,
  onTimeRangeChange,
  loading,
}) => {
  const currentData = selectedTimeRange === '7days' ? moodTrend7Days : moodTrend30Days;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mood Trend</Text>
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.loadingText}>Loading chart...</Text>
        </View>
      </View>
    );
  }

  if (!currentData || currentData.data.every(value => value === 0)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mood Trend</Text>
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
          <Text style={styles.noDataText}>No mood data available</Text>
          <Text style={styles.noDataSubtext}>
            Start checking in daily to see your mood trends
          </Text>
        </View>
      </View>
    );
  }

  const filteredData = currentData.data.filter(value => value > 0);
  const filteredLabels = currentData.labels.filter((_, index) => currentData.data[index] > 0);

  const chartData = filteredData.length >= 3 ? filteredData : currentData.data;
  const chartLabels = filteredData.length >= 3 ? filteredLabels : currentData.labels;

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(127, 140, 141, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#3498db',
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: '#ecf0f1',
    },
    formatYLabel: (value: string) => {
      const num = Math.round(parseFloat(value));
      return num >= 1 && num <= 5 ? num.toString() : "";
    },
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mood Trend</Text>
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
            labels: chartLabels,
            datasets: [
              {
                data: chartData,
                color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                strokeWidth: 3,
              },
            ],
          }}
          width={screenWidth - 40}
          height={220}
          yAxisInterval={1}
          segments={4}
          fromZero={false}
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

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Mood Scale:</Text>
        <View style={styles.legendItems}>
          {MOOD_LEVELS.map((level) => (
            <View key={level.value} style={styles.legendItem}>
              <Text style={styles.legendEmoji}>{level.emoji}</Text>
              <Text style={styles.legendText}>{level.value}</Text>
            </View>
          ))}
        </View>
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
    backgroundColor: '#3498db',
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
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 12,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  legendText: {
    fontSize: 10,
    color: '#95a5a6',
    fontWeight: '500',
  },
});
