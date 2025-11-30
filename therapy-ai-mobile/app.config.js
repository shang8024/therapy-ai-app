export default {
  expo: {
    name: "therapy-ai",
    slug: "therapy-ai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "therapy-ai",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#8B5CF6",
    },
    plugins: [
      [
        "expo-av",
        {
          microphonePermission:
            "This app uses the microphone to record voice messages for your therapy sessions.",
        },
      ],
      ["expo-sqlite"],
    ],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSUserNotificationUsageDescription:
          "We use notifications to remind you to do your daily check-in.",
        NSMicrophoneUsageDescription:
          "This app uses the microphone to record voice messages for your therapy sessions.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#8B5CF6",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.anonymous.therapyai",
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.POST_NOTIFICATIONS",
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "therapy-ai",
              host: "*",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: "c8682878-53e6-4a0d-81fc-548b9dee1f8b",
      },
    },
  },
};
