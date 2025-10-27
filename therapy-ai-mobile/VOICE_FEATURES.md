# Voice Recording Feature

## Overview
The therapy AI app now supports voice messaging functionality, allowing users to record audio messages that are converted to text for processing.

## Features Implemented

### 🎤 Voice Recording
- **Microphone Button**: Appears when text input is empty
- **Recording State**: Visual feedback during recording with red border and stop button
- **Permission Handling**: Requests microphone permission with user-friendly alerts

### 🔄 UI State Management
- **Dynamic Button Display**: 
  - Shows microphone button when input is empty
  - Shows send button when text exists or recording is active
- **Recording Indicators**: Visual feedback during recording state
- **Permission Alerts**: Informative messages when microphone access is denied

### 📱 Platform Configuration
- **iOS**: Configured with `NSMicrophoneUsageDescription` 
- **Android**: Added `RECORD_AUDIO` permission
- **Expo Plugin**: Configured `expo-av` plugin for microphone access

## How It Works

1. **Empty Input State**: User sees microphone button
2. **Recording**: 
   - Tap microphone → starts recording (button becomes red stop button)
   - Tap stop → ends recording and processes audio
3. **Text Input**: When user types, microphone button disappears and send button appears
4. **Permission Flow**: If permission denied, shows alert with option to enable

## Technical Implementation

### Dependencies Added
```json
{
  "expo-av": "Latest version for audio recording"
}
```

### Components Modified
- `components/chat/ChatInput.tsx`: Enhanced with voice recording capability
- `app.json`: Added microphone permissions for iOS and Android

### Key Functions
- `startRecording()`: Handles permission check and starts audio recording
- `stopRecording()`: Stops recording and triggers speech-to-text processing
- `simulateSpeechToText()`: Placeholder for real speech-to-text service integration

## Future Enhancements

### Speech-to-Text Integration
Currently uses simulated text. Can be enhanced with:
- Google Speech-to-Text API
- AWS Transcribe
- Azure Speech Services
- OpenAI Whisper API

### Audio Playback
- Option to play recorded audio before sending
- Audio message history

### Advanced Features
- Voice activity detection
- Background noise reduction
- Multiple language support

## Usage Instructions

1. **First Time**: App will request microphone permission
2. **Recording**: Tap microphone icon to start recording
3. **Stopping**: Tap red stop button to end recording
4. **Text Conversion**: Audio is automatically converted to text
5. **Sending**: Use send button to send the converted message

## Permissions Required

- **iOS**: Microphone access for voice recording
- **Android**: `android.permission.RECORD_AUDIO`

## Error Handling

- Permission denied: Shows alert with instructions
- Recording failure: User-friendly error messages
- Automatic cleanup: Prevents memory leaks from recording objects