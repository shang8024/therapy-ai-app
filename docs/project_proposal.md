# **Therapy AI**

#

# **Proposal**

##

## **Motivation**

Have you ever felt the need to talk to someone, not a friend, not a doctor, but simply a calm, non-judgmental listener only to realize that help is either unavailable, too formal, or hidden behind paywalls and waiting lists? Many people experience moments of stress, anxiety, or loneliness where they just want to be heard and gently guided toward healthier thinking. Yet most mental health apps today are either clinical in tone, overloaded with features, or require heavy data sharing that makes users uneasy.

**Therapy AI** addresses this gap by providing a lightweight, always-available companion that listens, encourages reflection, and promotes well-being through conversational nudges rooted in cognitive behavioral therapy (CBT) techniques. The app emphasizes simplicity, privacy, and immediacy. You can talk or type anytime, receive thoughtful responses, and log your mood privately on your own device.

This project is worth pursuing because it fills a growing need for accessible but private mental wellness support. While therapy and social connections are invaluable, not everyone can or wants to engage with them daily. Therapy AI serves as a bridge: a comforting tool that helps users develop self-awareness, track emotions over time, and practice evidence-based coping strategies, all without friction or fear of judgment.

**Target users include:**

- Individuals seeking emotional support or guided self-reflection outside formal therapy
- Students and professionals managing stress, burnout, or isolation
- People in regions or situations where access to therapy is limited or stigmatized
- ## Users who value mental-health tools that protect privacy and require minimal setup

  ## **Objective and Key Features**

The objective is to provide a friendly, always on companion that listens, nudges healthy thinking in a CBT-inspired way, and protects user privacy. We'll keep v1 focused and achievable: text-based chat with ElevenLabs AI, local journaling, mood tracking, and daily reminders. Voice and cloud sync are stretch goals after proving core functionality.

### **Core Features**

**1\. Text-Based Chat Interface**

- Type messages to interact with an AI companion trained in CBT techniques
- AI provides empathetic responses, thought reframing, and gentle guidance
- **Implementation:** Chat screen built with React Native components (TextInput, Pressable, FlatList), integrated with ElevenLabs Conversational AI API via WebSocket for responsive replies

**2\. Daily Mood Check-Ins**

- Quick emoji-based mood selector (1-5 scale) with optional text notes
- Helps users build awareness of emotional patterns over time
- **Implementation:** Dedicated check-in screen with emoji picker and text input, data stored locally

**3\. Private Local Journaling**

- All conversations and check-ins automatically saved on-device
- No cloud sync required for privacy-conscious users
- **Implementation:** React Native AsyncStorage with JSON serialization, versioned keys (e.g., `appv1:*`) for safe upgrades

**4\. Mood Visualization Dashboard**

- View 7-day and 30-day mood trend charts
- Track engagement streaks to maintain consistency
- **Implementation:** Dashboard screen using react-native-chart-kit for visualization, data read from AsyncStorage

**5\. Daily Smart Reminders**

- Gentle push notification to check in on your mood
- Deep-links directly to check-in screen when tapped
- **Implementation:** Expo Notifications with scheduled repeating notifications at user-preferred time

**6\. Safety & Crisis Detection**

- On-device keyword detection for crisis-related terms (e.g., "suicide," "self-harm")
- Instant modal displaying region-specific crisis resources (\<3 seconds)
- **Prominent UI placement:** Crisis resources accessible from Settings and displayed clearly when triggered
- **Implementation:** JavaScript keyword matching function \+ React Native Modal with local JSON file containing hotline numbers, text lines, and chat URLs by region

**7\. Disclaimers & Boundaries**

- Clear, visible disclaimers that the app is not a replacement for professional therapy
- Displayed during onboarding and accessible in Settings
- **Implementation:** Dedicated informational screens and in-app disclosure text

**8\. Onboarding Flow**

- Quick 3-step setup: permissions → reminder time → first check-in (under 60 seconds)
- **Implementation:** Multi-screen flow using Expo Router, preferences saved to AsyncStorage

  ### **Navigation Structure**

We will use **Expo Router** for file-based navigation:

- **Home (`/`):** Dashboard with 7/30-day mood trends, streak counter, quick links to Chat and Check-In
- **Chat (`/chat`):** Main text chat interface with AI companion
- **Chat Session (`/chat/[chatId]`):** View specific past conversation threads
- **Check-In (`/checkin`):** Emoji mood selector and optional note entry
- **Settings (`/settings/*`):** Nested routes for account details, reminder scheduling, privacy policy, app disclaimers, crisis resources, accessibility options

All screens support TypeScript-typed route parameters for data passing (e.g., chatId for viewing specific conversations).

### **State Management and Persistence**

We will use **Context API** for app-wide state management with the following contexts:

- **UI/Theme Context:** Dark mode, color-blind palettes, visual preferences
- **Session Context:** Current chat thread ID, message buffer, user input state
- **Check-In Context:** Selected mood, note input, recent check-in history
- **Preferences Context:** Reminder time, accessibility settings

All data persists locally using **React Native AsyncStorage**, serialized as JSON with versioned keys for safe schema upgrades. On launch, contexts hydrate from AsyncStorage to restore user state seamlessly across app restarts.

### **Notification Setup**

On first launch, the app requests notification permissions. Once granted, it schedules a daily repeating local notification using `expo-notifications`. At the user's preferred time, a friendly reminder appears prompting them to check in, with deep-linking directly to the `/checkin` screen upon tap.

###

###

### **Backend Integration Details**

Our backend architecture uses **Supabase** as our primary Backend-as-a-Service (BaaS) platform, providing authentication, real-time database, and storage capabilities.

**Authentication System:**

- **Supabase Auth** for optional user accounts (stretch goal after MVP)
- Email/password authentication
- Secure token-based session management with automatic refresh
- Row-level security (RLS) policies ensuring users only access their own data

**Database Schema (for cloud sync \- Phase 2):**

- User profiles: preferences (theme, reminder time)
- Chat sessions: conversation threads with timestamps
- Messages: chat history with role (user/assistant), content, inferred mood
- Check-ins: mood entries (emoji, level, notes, timestamp)
- Coping scripts: AI-generated or user-saved personalized strategies

All tables have RLS policies enabled for privacy and security.

**Real-Time Communication:**

- Custom **Node.js/Express backend** with WebSocket endpoint (`/ws/chat`)
- Deployed on **Railway** or **Render** for zero-config HTTPS deployment
- Integration with **ElevenLabs Conversational AI API** for natural language processing
- **Streaming architecture:** AI responses delivered word-by-word for immediate feedback (target \<2.5s latency)

**WebSocket Flow:**

1. Client authenticates with Supabase token
2. Backend fetches recent conversation context from Supabase (or AsyncStorage in local-first v1)
3. Generate CBT-informed prompts combining user message with context
4. Stream AI responses in real-time to client
5. Persist conversation to Supabase (Phase 2\) or AsyncStorage (Phase 1\)

**API Architecture:**

- REST endpoints for CRUD operations (user preferences, check-ins, coping scripts)
- WebSocket for real-time AI chat streaming
- Proper error handling, loading states, and retry logic in React Native client

**Safety & Crisis Detection:** On-device JavaScript keyword detection triggers immediate crisis resource modal from local JSON file (sub-3 second response, no network required). High-risk messages optionally flagged in backend for pattern review.

### **Deployment Plan with Expo EAS Build**

We will use **Expo Application Services (EAS)** for building and deploying to iOS and Android.

**EAS Build Configuration (`eas.json`):**

**Development Profile:**

- Internal distribution for team testing
- Development client enabled for live reloading
- Connected to Supabase development environment
- Distributed via Expo Go or development builds

**Preview Profile:**

- Internal distribution for user testing
- Production-like build with staging Supabase instance
- Distributed via TestFlight (iOS) and Internal Testing (Android)
- Used for pilot user feedback (5-10 testers)

**Production Profile:**

- App Store and Google Play distribution
- Connected to production Supabase
- Optimized builds with minification and tree-shaking
- Environment variables secured via EAS Secrets (Supabase keys, ElevenLabs API key)

**Build Process:**

1. Initialize EAS: `eas build:configure`
2. Store sensitive keys using EAS Secrets
3. Generate builds: `eas build --platform all --profile production`
4. Test on iOS (simulator \+ 1-2 physical devices) and Android (emulator \+ 1-2 physical devices)
5. Distribute preview builds for testing via TestFlight/Internal Testing
6. (Optional) Submit to stores: `eas submit --platform all`

**Backend Deployment:**

- Node.js/Express WebSocket server deployed to **Railway** or **Render**
- Zero-config deployment from GitHub with automatic HTTPS
- Environment variables configured via dashboard
- Health check endpoint (`/health`) for monitoring
- Automatic deployments on push to `main` branch

**Timeline:**

- **Week 1-2:** Initial EAS setup, development builds for team testing
- **Week 3-4:** Preview builds for pilot user feedback
- **Week 5-6:** Production builds ready for demo and submission

**Monitoring & Updates:**

- **EAS Update** for over-the-air JavaScript/React updates (minor bug fixes)
- Supabase dashboard for database monitoring
- Railway/Render metrics for backend uptime

  ### **Advanced Features (Course Requirement: 2 minimum)**

**1\. User Authentication** _(Phase 2 \- Stretch Goal)_

- Supabase Auth for account creation, login, logout
- Secure token handling and authentication state management
- Enables cloud sync of conversations and mood history across devices

**2\. Real-Time Updates** _(Core to MVP)_

- WebSocket-based streaming for AI chat responses
- Word-by-word response delivery for natural conversation feel
- Persistent connection for instant messaging experience
- Significantly reduces perceived latency compared to request/response pattern

These two features fulfill the course's advanced feature requirement and demonstrate mastery of authentication systems and real-time communication protocols.

---

## **Scope and Feasibility**

This project fulfills all core technical requirements: React Native/Expo with TypeScript, 5+ screens with Expo Router, Context API for state management, AsyncStorage for persistence, Expo Notifications, backend integration (Supabase \+ custom WebSocket server \+ ElevenLabs API), and EAS Build deployment.

**By the end of the term, we will deliver:**

- Functional Expo app (iOS & Android) with text-based AI chat, mood tracking, and journaling
- Local-first architecture with AsyncStorage persistence
- ElevenLabs integration via custom WebSocket backend server
- Daily push notifications for mood check-ins
- Safety disclaimers and crisis resources prominently displayed in UI
- Pilot testing with 5-10 users and feedback summary

**Phased Approach for Feasibility:**

**Phase 1 (MVP \- Weeks 1-4):** Local-first core

- Text chat interface with AsyncStorage persistence
- Daily check-ins and mood dashboard
- On-device crisis detection
- Daily reminders
- WebSocket backend for AI streaming
- EAS development builds for team testing

**Phase 2 (Weeks 5-6):** Cloud sync (stretch goal)

- Supabase Auth integration
- Cloud database sync for cross-device access
- Preview builds for pilot user testing

**Phase 3 (If time permits):** Polish

- Voice input/output via ElevenLabs TTS
- Smart exercise suggestions
- Context memory for personalized AI responses
- Dark mode and accessibility enhancements

This phased approach keeps v1 lightweight and deliverable within the term while maintaining clear boundaries between must-have and nice-to-have features. We prioritize core chat, mood tracking, and journaling first (instructor's feedback), ensuring a functional and meaningful product even if advanced features are limited.

The project is ambitious but achievable by:

- Starting with text-only chat (voice as stretch goal)
- Prioritizing local storage before cloud sync
- Using established platforms (Supabase, Railway, ElevenLabs) instead of building from scratch
- ## Clear division of responsibilities across four team members

  ## **Tentative Plan**

Our team of four will divide responsibilities as follows:

**Jiale \- Dev1: UI/UX Foundation & Core Navigation**

- Initialize React Native (Expo) project with TypeScript
- Implement navigation using Expo Router with all screen files (`/`, `/chat`, `/chat/[chatId]`, `/checkin`, `/settings/*`)
- Build onboarding flow (permissions, reminder setup)
- Implement theme management (Context API for dark mode, color-blind palettes)
- Create safety flow UI (crisis resource modal with prominent disclaimers)

**Patrick \- Dev2: Core Interaction & AI Integration**

- Build chat interface (TextInput, Pressable, FlatList for message history)
- Integrate ElevenLabs Conversational AI API via WebSocket client
- Implement AI-driven features:
  - Post-session micro-reflection summaries
  - Smart exercise suggestions based on context
  - Personalized coping script generation
- Handle loading states and error messages for AI interactions

**Jingxian \- Dev3: Data Persistence & Visualization**

- Implement AsyncStorage for all local data (conversations, check-ins, preferences)
- Build dashboard screen with statistics display
- Create mood trend chart using react-native-chart-kit (7/30-day views)
- Implement streak calculation and display logic
- Build journal/history view screen for browsing past sessions

**Gaurav \- Dev4: Backend, User Lifecycle & Advanced Features**

- Set up Node.js/Express WebSocket server for AI streaming
- Deploy backend to Railway/Render with environment variables
- Integrate Supabase Auth for user accounts (Phase 2\)
- Implement Expo Notifications for daily reminders with deep-linking
- Configure EAS Build profiles (development, preview, production)
- Generate and distribute builds for testing
- Monitor backend health and performance

**Collaboration Points:**

- Weekly sync meetings to integrate frontend (Dev1-3) with backend (Dev4)
- Shared Context API contracts defined upfront
- Git workflow with feature branches and code reviews
- Pilot testing coordinated by all members in Week 5-6

This plan is achievable within the \~7-week timeline by focusing on MVP features first, with clear individual ownership and well-defined integration points. Each member's work can progress in parallel with minimal blocking dependencies.
