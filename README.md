# Therapy AI App

## Team Information

- Gaurav Kashyap: 1003971053 gaurav.kashyap@mail.utoronto.ca
- Patrick Chamaa: 1012574233 p.chamaa@mail.utoronto.ca
- Jiale Shang: 1006580022 jiale.shang@mail.utoronto.ca
- Jingxian Hou: 1001159710 jingxian.hou@mail.utoronto.ca

## Motivation

Have you ever felt the need to talk to someone, not a friend, not a doctor, but simply a calm, non-judgmental listener only to realize that help is either unavailable, too formal, or hidden behind paywalls and waiting lists? Many people experience moments of stress, anxiety, or loneliness where they just want to be heard and gently guided toward healthier thinking. Yet most mental health apps today are either clinical in tone, overloaded with features, or require heavy data sharing that makes users uneasy.

**Therapy AI** addresses this gap by providing a lightweight, always-available companion that listens, encourages reflection, and promotes well-being through conversational nudges rooted in cognitive behavioral therapy (CBT) techniques. The app emphasizes simplicity, privacy, and immediacy. You can talk or type anytime, receive thoughtful responses, and log your mood privately on your own device.

This project is worth pursuing because it fills a growing need for accessible but private mental wellness support. While therapy and social connections are invaluable, not everyone can or wants to engage with them daily. Therapy AI serves as a bridge: a comforting tool that helps users develop self-awareness, track emotions over time, and practice evidence-based coping strategies, all without friction or fear of judgment.

**Target users include:**

- Individuals seeking emotional support or guided self-reflection outside formal therapy
- Students and professionals managing stress, burnout, or isolation
- People in regions or situations where access to therapy is limited or stigmatized
- Users who value mental-health tools that protect privacy and require minimal setup

## Objectives

The objective is to provide a friendly, always-on companion that listens, nudges healthy thinking in a CBT-inspired way. We aimed to prioritize privacy, simplicity, and immediacy by enabling a local-first private moode tracking and journaling, along with a quick response conversational AI conpanion supporting voice chat.

## Technical Stack

- **Mobile App:** React Native with Expo (TypeScript)
  **Navigation:** Expo Router (file-based routing via `app/` directory):
  - Navigation is structured to handle user state:
    - `/index` & `/legal`: Entry and legal terms screens.
    - `/(auth)`: Authentication screens (login, signup) shown if not signed in.
    - `/(tabs)`: Main app screens (chat, dashboard, check-in, journal, settings) shown after authentication and legal acceptance.
      - `/(tabs)/chat/[chatId]`: Dynamic route for individual chat sessions. On the chat screen, users can navigate to a specific history chat session.
  - The root `_layout.tsx` files coordinate navigation flow, so users see the correct screens before/after authentication and before/after accepting legal terms.
- **State Management:** We manage state with the React Context API under the `contexts/` directory:
  - AuthContext: Handles authentication state and user session.
  - DatabaseContext: Provides access to the local database helpers.
  - CheckinContext: Manages mood check-in data and logic.
  - DashboardContext: Supplies dashboard stats and trends.
  - ChatContext: Manages chat sessions, messages, and uses `useReducer` for complex chat state updates (e.g., message queue, session switching).

  All Context providers are stacked and wrapped in an `AppProviders` component at the root of the app, so all screens and components have access to the necessary state and actions.

- **Persistence with AsyncStorage:** We implemented local-first data retention for chat history, journals, and check-ins:
  - Data is stored per user using keys like `appv1:{userId}:journal_entries` and `appv1:{userId}:checkin_entries`.
  - Each entry includes metadata (user, timestamps, UUID for sync).
  - On app start or login, the app tries to fetch the latest data from the cloud (Supabase). If online, the cloud data is synced to local storage; if offline, the app uses local data.
  - All create, update, and delete operations work offline and queued for sync when device is back online.

- **Notifications:** We use Expo Notifications to push immediate and scheduled notifications with deep linking.
  - Notification data structure: `{ title, body (message), data: { target: <deeplink route> } }`
  - When a notification is tapped, the app reads the `target` route from the notification data and navigates to the correct screen using logic in the root `_layout.tsx` file.
- **Backend Integration:**
  - The app uses Supabase for authentication, database, and cloud sync (BaaS).
  - For AI chat, audio transcription, and text-to-speech, the app communicates with custom REST APIs implemented as Supabase Edge Functions. These are called using `fetch` or `XMLHttpRequest` from the mobile app.
  - All API requests are authenticated using the Supabase session token.
  - Example REST endpoints:
    - `/functions/v1/Groq-LLM` (AI chat)
    - `/functions/v1/audio-transcribe` (speech-to-text)
    - `/functions/v1/text-to-speech` (text-to-speech)
  - Data sync (chat, check-ins, journals) uses both direct Supabase client calls and RESTful endpoints.
- **AI Integration:** Groq API (chat, audio transcription, text-to-speech via Supabase Edge Functions)
- **Audio:** expo-av, expo-audio (voice recording/playback)
- **Charts/Visualization:** react-native-chart-kit
- **Build/Deploy:** Expo EAS Build
- **Linting/Formatting:** ESLint, Prettier

## Features

- **Chat Session List:** User can view, pin, continue or delete their past chat sessions in a list. They can view summary (number of messages, last message date) of each chat session.
- **AI Chat:** Users can engage in natural conversations with a CBT-inspired, empathetic AI agent using both text and voice input.
- **Mood Check-Ins:** Users can create or edit today's emoji-based mood check-in on a 1-5 scale with an optional note.
- **Journaling:** Users can view, create, edit, or delete their private, locally stored journals.
- **Statistics Dashboard:** Users can view their mood trend charts (7/30 days) and chat engagement streaks on the dashboard screen.
- **Daily Reminders:** Users can opt in or out of daily push notifications from the settings screen. Reminders are scheduled at 9am and 9pm every day, with deep linking to the `/checkin` screen for a quick mood check-in.
- **Onboarding Flow:** On first launch, or whenever the user terms update, users must accept legal terms to access the app.
- **Theme Toggle:** User can switch between light and dark mode in the settings screen.
- **Crisis Detection:** On keyword detection, the chat agent will reply with crisis resources.
- **User Authentication:** Secure sign-up, login, and session management using Supabase Auth. Supports email/password authentication and session persistence across app restarts. User data is isolated and encrypted per account.
- **Offline Support:** Users can complete most core features (check-ins, journals, dashboard statistics) without an internet connection. Data is stored locally and changes are queued for sync. Users can access and update their data anytime, even when offline.
- **Cloud Sync:** Automatic background synchronization with Supabase when connectivity is restored. Local changes are merged with the cloud, ensuring data consistency across devices. Sync status and conflicts are handled seamlessly for a smooth user experience.

### How This App Fulfills Course Project Requirements

The app is built entirely with TypeScript React Native and Expo, implementing a multi-screen structure with seven main screens: Onboarding/Legal, Login/Signup, Chat, Check-In, Dashboard, Journal, and Settings.

Navigation is implemented using Expo Router, leveraging file-based routing and dynamic routes (e.g., `[chatId].tsx`).

We managed app state with React Context API and useReducer. Each Context is responsible for pulling and pushing data from/to the cloud database first, then using local storage as a fallback when offline or if sync fails.

We use Expo Notifications to schedule and handle daily reminders for mood check-ins.

The app also integrates with Supabase (BaaS) for authentication, database, cloud sync, and Edge Functions for chat-related features (AI chat, text-to-speech, speech-to-text).

The app is built and deployed using Expo EAS Build, with testable builds for iOS and Android.

### Advanced Features Implemented

**1. User Authentication:**

- Secure sign-up, login, and session management are implemented using Supabase Auth, supporting email/password authentication and session persistence. User data is isolated and encrypted per account.

**2. Offline Support:**

- All core features (check-ins, journals, dashboard statistics) are available offline. Data is stored locally and changes are queued for sync, ensuring seamless user experience regardless of connectivity.

**3. Push Notifications:**

- Daily reminders are implemented using Expo Notifications, with opt-in/opt-out flows, permission handling, and deep linking to relevant screens.

**4. Integration with External Services:**

- The app integrates with Groq API for AI chat, text-to-speech, and speech-to-text, providing advanced conversational and accessibility features.

**Summary**

This project meets and exceeds the core technical requirements by implementing robust navigation, state management, local persistence, notifications, backend integration, and deployment. Advanced features such as secure authentication, offline support, real-time AI chat, push notifications, and analytics ensure the app is both technically comprehensive and user-centric, directly supporting the project’s objectives of privacy, accessibility, and mental wellness support.

## User Guide

1. **Onboarding:** Launch the app. On first use, review and accept the Terms of Service and Privacy Policy by toggling both switches. Optionally, enable "I want to receive daily reminders for journals & checkins" and grant notification permission when prompted.

   After clicking "Agree & Continue," if notifications are enabled, you will immediately receive a "Welcome" notification confirming setup.

   You will be redirected to the Login screen if not logged in and to the Dashboard screen if you already have an active user session.

2. **Sign Up / Login:**
   - **Sign Up:** On the Login screen, click on "Sign Up". On the Sign Up screen, fill in your email and password to create a new account. You will be redirected to the Dashboard screen once signed up.
   - **Login:** If you already have an account, enter your email and password on the Login screen and tap "Login". You will be redirected to the Dashboard screen after successful login.

3. **Check-In:** On the Check-In screen, you’ll see "Daily check-in" and today’s date. If you’ve already checked in today, your record will appear with an option to edit. If you haven’t checked in yet, a form will be shown. On the Check-In form, use the horizontal scroll bar to select an emoji mood and add an optional note.

4. **Journal:** On the Journal screen, you can browse past journals and refresh to pull from the cloud. You can create a journal or edit an existing journal using the top form with title and content input.

5. **Chat List:** On the Chat screen, you will see a list of all your chat sessions. Sessions are sorted with pinned chats at the top, followed by your most recent conversations. For each session, you can:
   - Tap to open and continue the conversation.
   - View a summary (title, last message, message count, last active date, and pin status).
   - Pin or unpin important sessions to keep them at the top.
   - Delete sessions you no longer need (with confirmation).

   To start a new conversation, tap the “New Chat” button.

6. **AI Chat:** Inside a chat session, you can send messages to the AI using either text input or by recording your voice. The AI responds with supportive, context-aware replies. When you send a voice message, it is transcribed and replied with both a text and an audio response. You will be asked for permission to access your microphone and audio features the first time you use voice messaging.

7. **Dashboard:** On the Dashboard screen, you can view your mental health progress at a glance. The dashboard displays:
   - **Mood Trend Chart:** Visualizes your mood check-ins over the past 7 or 30 days, with an interactive toggle to switch time ranges. Track how your mood changes over time.
   - **Statistics Cards:** See your total check-ins, current and longest streaks, and average mood (with emoji and label).
   - **Chat Statistics:** View total messages, chat sessions, and average messages per session, plus recent activity for the last 7 days.
   - **Chat Metrics Chart:** Analyze your daily chat activity and engagement trends over 7 or 30 days.

   Pull down to refresh and sync the latest data from the cloud. Use the quick links to jump to Chat or Check-In screens directly from the dashboard.

8. **Settings:** On the Settings screen, you can:
   - Toggle between light and dark mode for the app theme.
   - Enable or disable daily reminder notifications.
   - View disclaimers, Terms of Service, and Privacy Policy.
   - Log out of your account securely.

9. **Notifications:** If you enable daily reminders, you will receive push notifications at 9am and 9pm. Tapping a notification will take you directly to the Check-In screen for a quick mood check-in. You can manage notification preferences in Settings at any time.

## Development Guide

To get started, you will need:

- Node.js 18+
- pnpm or npm
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator, Android Studio, or Expo Go
- Supabase

Clone this repo:

```bash
git clone https://github.com/shang8024/therapy-ai-app.git
```

### Supabase Project & Env Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project.
   - Note your project ID (e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

2. **Deploy Edge Functions**
   - Install Supabase CLI if you haven't:
     ```bash
     npm install -g supabase
     ```
   - Login to Supabase:
     ```bash
     supabase login
     ```
   - Deploy each function from the `supabase/functions` directory:
     ```bash
     cd supabase/functions
     supabase functions deploy --project-ref <project-id>
     ```

3. **Set Environment Variables**
   - In the Supabase dashboard, go to Project Settings → API or Functions, and add any required secrets (API keys, etc.) for your Edge Functions.

4. **Apply Database Schema**
   - In the Supabase dashboard, open SQL Editor → New Query.
   - Copy and paste the contents of `supabase/schema.sql` and run it to create all tables, policies, and relationships.

5. **Configure Authentication**
   - In the Supabase dashboard, go to Authentication → Settings.
   - Enable email/password sign-in.

6. **Update App Config**
   - Set your Supabase URL and Anon Key in `therapy-ai-mobile/.env` file, as in `therapy-ai-mobile/.env.example`

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

Supabase backend is now ready for use with the Therapy AI app.

### Expo app setup

1. **Install dependencies**

   ```bash
   # Install mobile app dependencies
   cd therapy-ai-mobile
   npm install
   ```

2. **Start the development server**

   ```bash
   # From the therapy-ai-mobile directory
   npm start
   ```

3. **Once the development server is running, you can**
   - **Expo Go**: Scan the QR code with the Expo Go app on your phone
   - **iOS Simulator**: Press `i` to open in iOS simulator (Mac only)
   - **Android Emulator**: Press `a` to open in Android emulator
   - **Developer Menu**: Press `m` to open developer options

   Note: Audio and notifications may not work well in the Android emulator; use Expo Go or a development build to test.

## Deployment Information

Build with:

```
cd ./therapy-ai-mobile

eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"

eas build -p android --profile production
```

The Android apk can be downloaded at: https://expo.dev/artifacts/eas/jwHE8pVsJLKxfsZWxWbPvh.apk

## Individual Contributions

**Jiale:**

- Led the overall UI/UX design, ensuring a clean, accessible, and user-friendly experience across the app.
- Implemented navigation structure using Expo Router, including onboarding flow, legal screens, and protected routes.
- Developed the onboarding and legal acceptance flow, including notification opt-in and deep linking.
- Built the Check-In screen with emoji mood selection, note input, and edit functionality.
- Integrated and tested push notification scheduling, handling, and deep linking to Check-In.

**Patrick:**

- Designed and implemented the chat interface, including message bubbles, chat input, and session list.
- Developed voice recording and transcription features for chat, integrating with audio APIs and backend.
- Built chat session management: create, pin/unpin, delete, and continue conversations.
- Implemented theme switching (light/dark mode) and ensured UI/UX consistency in chat-related components.
- Contributed to error handling, user feedback, and responsive design for mobile devices.
- Set up and maintained EAS build and deployment pipelines for iOS/Android.

**Jingxian:**

- Architected and implemented local data persistence using AsyncStorage for chat, check-ins, and journals.
- Developed dashboard statistics and mood trend charts, including streaks and mood analytics.
- Built the journal feature: create, edit, and browse past entries, with cloud sync support.
- Integrated authentication flows and managed user session state.
- Implemented data synchronization logic between local storage and Supabase backend.

**Gaurav:**

- Led backend integration with Supabase for authentication, database, and cloud sync.
- Developed and deployed Supabase Edge Functions for AI chat (Groq API), text-to-speech (TTS), and speech-to-text (STT).
- Managed secure storage and usage of API keys and environment variables.
- Implemented advanced features such as crisis keyword detection and cloud sync conflict resolution.

## Lessons Learned and Concluding Remarks

### Technical Insights & Challenges

- **Version Compatibility:** We encountered several compatibility issues between different versions of Expo, npm, and React Native packages. For example, Expo Notifications did not work properly on Android emulators when using Expo Go with certain Expo versions. Similarly, expo-av had issues with audio playback in Android development builds.
- **Audio Storage on Android:** When attempting to store AI voice reply audio locally, we faced pathing and data access issues, especially on Android emulators and within Expo Go. This required additional debugging and highlighted the importance of testing on real devices and production builds.
- **Emulator vs. Real Device:** Some features (notifications, audio) worked inconsistently or not at all on emulators, emphasizing the need to test on both emulators and physical devices throughout development.
- **Error Handling & Logging:** These challenges taught us the importance of implementing robust error handling and logging throughout the app, so that issues can be detected, diagnosed, and resolved more efficiently during development and after deployment.

### Team & Process Insights

We learned that every team member has different expectations and work paces. In future projects, setting up a clear team agreement on expectations and communication at the beginning would help streamline collaboration and reduce misunderstandings.

Although there were some bumps at the beginning, we are working smoothly through openness and communication.

### Summary

This project provided valuable experience in building a full-stack, cross-platform mobile app with real-world constraints. We deepened our understanding of React Native, Expo, Supabase, and cloud sync patterns, and learned to troubleshoot platform-specific issues. Most importantly, we gained practical experience in collaborative software development, balancing technical challenges with teamwork and adaptability.

```

```
