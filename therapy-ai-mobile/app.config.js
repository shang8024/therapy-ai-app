export default {
  expo: {
    name: 'therapy-ai',
    slug: 'therapy-ai',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'therapy-ai',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    plugins: [
      [
        'expo-av',
        {
          microphonePermission:
            'This app uses the microphone to record voice messages for your therapy sessions.',
        },
      ],
      ['expo-sqlite'],
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.anonymous.therapyai',
      infoPlist: {
        NSUserNotificationUsageDescription:
          'We use notifications to remind you to do your daily check-in.',
        NSMicrophoneUsageDescription:
          'This app uses the microphone to record voice messages for your therapy sessions.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.anonymous.therapyai',
      permissions: ['android.permission.RECORD_AUDIO'],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: 'e4c8f020-1526-4800-b970-e58ae407a033',
      },
    },
  },
};

