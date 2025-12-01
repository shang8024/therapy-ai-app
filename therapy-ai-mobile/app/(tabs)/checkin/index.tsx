import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { prettyDate } from "@/constants/checkin";
import { useCheckin } from "@/contexts/CheckinContext";
import { useTheme } from "@/contexts/ThemeContext";
import { checkinStyles } from "@/styles/checkin";

import CheckinRecord from "@/components/checkin/CheckInRecord";
import CheckinForm from "@/components/checkin/CheckInForm";
import LoadingScreen from "@/components/LoadingScreen";

export default function CheckinScreen() {
  const { date, loading, isEditing, record } = useCheckin();
  const { theme } = useTheme();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView
      style={[
        checkinStyles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={checkinStyles.scrollContent}>
        <View style={checkinStyles.header}>
          <View style={checkinStyles.headerIconContainer}>
            <Text style={checkinStyles.headerIcon}>📝</Text>
          </View>
          <View style={checkinStyles.headerTextContainer}>
            <Text style={[checkinStyles.title, { color: theme.colors.text }]}>
              Daily Check-in
            </Text>
            <Text
              style={[
                checkinStyles.subtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {prettyDate(date)}
            </Text>
          </View>
        </View>

        {!isEditing && record ? <CheckinRecord /> : <CheckinForm />}
      </ScrollView>
    </SafeAreaView>
  );
}
