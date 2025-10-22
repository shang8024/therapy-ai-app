import React from 'react';
import {
  Text,
  View,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView >
      <ScrollView >
        <View >
          <Text >Settings</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
