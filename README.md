<img width="204" height="450" alt="image" src="https://github.com/user-attachments/assets/1ca93979-8e55-47c3-921f-ee2bf0ee54df" />
<img width="205" height="450" alt="image" src="https://github.com/user-attachments/assets/3c7aff3e-1bd0-41f8-8863-bb45879af84b" />
<img width="203" height="450" alt="image" src="https://github.com/user-attachments/assets/9fd787ef-b970-439e-bd18-0d8708eb8b7c" />


# FridgeApp

FridgeApp is a React Native mobile application designed to monitor refrigerator conditions and inventory using Bluetooth sensor data, local storage, and cloud synchronization. The app provides real-time temperature tracking, battery monitoring, inventory management, and configurable alerts to help maintain food safety and system reliability.

## Features 

### Monitoring

* Real-time temperature readings from Bluetooth sensors
* Battery level monitoring
* Power source status tracking
* Historical temperature graphs and insights
* Sensor data simulation support for testing

### Inventory Management

* Add and track fridge inventory items
* Inventory quantity visualization
* Minimum inventory alerts
* Local SQLite storage with optional Firebase sync

### Connectivity

* Bluetooth Low Energy (BLE) device connection
* Device scanning and pairing
* Connection status monitoring
* Android permission handling utilities

### Data & Analytics

* Temperature history visualization
* Inventory trend graphs
* Firebase Firestore cloud storage integration
* Local SQLite fallback database

### Settings & Configuration

* Temperature range configuration
* Battery alert thresholds
* Inventory minimum limits
* Grid disconnect detection toggle

## Tech Stack 🛠️

### Mobile

* React Native 0.81
* React 19
* TypeScript

### Navigation & UI

* React Navigation
* Gluestack UI
* NativeWind (Tailwind for React Native)
* Lucide Icons
* React Native Chart Kit

### Device Communication

* react-native-ble-plx (Bluetooth LE)

### Storage

* Firebase Firestore
* React Native SQLite Storage
* React Native FS


## Requirements 

Make sure your environment includes:

* Node.js ≥ 20
* React Native development environment
* Android Studio (for Android)
* Xcode (for iOS)
* CocoaPods (for iOS)
* Firebase project (optional but recommended)

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

## Running the App ▶️

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


