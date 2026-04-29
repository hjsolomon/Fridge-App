<img width="2170" height="926" alt="image" src="https://github.com/user-attachments/assets/cf4d1fbe-8c87-46cf-a9fc-e0224554d821" />


# FridgeApp

FridgeApp is a React Native mobile application designed to monitor refrigerator conditions and inventory using Bluetooth sensor data, local storage, and cloud synchronization. The app provides real-time temperature tracking, battery monitoring, inventory management, and configurable alerts to help maintain food safety and system reliability.

## Features

### Monitoring

- Real-time temperature readings from Bluetooth sensors
- Battery level monitoring
- Power source status tracking
- Historical temperature graphs and insights
- Sensor data simulation support for testing

### Inventory Management

- Add and track fridge inventory items
- Inventory quantity visualization
- Minimum inventory alerts
- Local SQLite storage with optional Firebase sync

### Connectivity

- Bluetooth Low Energy (BLE) device connection
- Device scanning and pairing
- Connection status monitoring
- Android permission handling utilities

### Data & Analytics

- Temperature history visualization
- Inventory trend graphs
- Firebase Firestore cloud storage integration
- Local SQLite fallback database

### Settings & Configuration

- Temperature range configuration
- Battery alert thresholds
- Inventory minimum limits
- Grid disconnect detection toggle

## Tech Stack

### Mobile

- React Native 0.81
- React 19
- TypeScript

### Navigation & UI

- React Navigation
- Gluestack UI
- NativeWind (Tailwind for React Native)
- Lucide Icons
- React Native Chart Kit

### Device Communication

- react-native-ble-plx (Bluetooth LE)

### Storage

- Firebase Firestore
- React Native SQLite Storage
- React Native FS

## Requirements

Make sure your environment includes:

- Node.js ≥ 20
- React Native development environment
- Android Studio (for Android)
- Xcode (for iOS)
- CocoaPods (for iOS)
- Firebase project (optional but recommended)

React Native setup guide:
[https://reactnative.dev/docs/set-up-your-environment](https://reactnative.dev/docs/set-up-your-environment)

## Installation ⚙️

Clone the repository:

```bash
git clone <your-repo-url>
cd FridgeApp
```

Install dependencies:

```bash
npm install
```

## Running the App

### Start Metro

```bash
npm start
```

### Android

```bash
npm run android
```

### iOS

Install pods (first time only):

```bash
bundle install
bundle exec pod install
```

Run:

```bash
npm run ios
```

# Firebase Setup (Required)

This project does NOT include Firebase credentials.

To run this project you must create your own Firebase project.

## Steps:

1 Create Firebase project:
https://console.firebase.google.com/

2 Add Android App
Use package name:
com.fridgeapp

3 Enable Firestore Database

4 Download google-services.json

5 Place file here:
android/app/google-services.json

6 Install dependencies:

```bash
npm install
```

7 Run app:

```bash
npx react-native run-android
```

# WPI Major Qualifying Project

This application was developed as part of a Major Qualifying Project (MQP) at Worcester Polytechnic Institute (WPI). 
