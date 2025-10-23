# Therapy AI App

A mental wellness companion app that provides accessible, private, and immediate emotional support through AI-powered conversations, mood tracking, and journaling.

## Project Structure

This is a monorepo containing:

- **`therapy-ai-mobile/`**: React Native mobile app built with Expo
- **`config/`**: Shared ESLint and Prettier configuration
- **`docs/`**: Project documentation and proposal

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm or npm
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (Mac) or Android Studio (for emulators)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shang8024/therapy-ai-app.git
   cd therapy-ai-app
   ```

2. **Install dependencies**
   ```bash
   # Install mobile app dependencies
   cd therapy-ai-mobile
   npm install
   ```

3. **Start the development server**
   ```bash
   # From the therapy-ai-mobile directory
   npm start
   ```

### Running the App

Once the development server is running, you can:

- **Expo Go**: Scan the QR code with the Expo Go app on your phone
- **iOS Simulator**: Press `i` to open in iOS simulator (Mac only)
- **Android Emulator**: Press `a` to open in Android emulator
- **Developer Menu**: Press `m` to open developer options