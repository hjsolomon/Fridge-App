import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

const db = firestore();

if (__DEV__) {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  firestore().useEmulator(host, 9090);
}

export default db;
