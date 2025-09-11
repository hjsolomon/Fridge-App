import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Bluetooth'>;

const BluetoothScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Connection</Text>
      <Text style={styles.subtitle}>
        Connect to your vaccine fridge to start monitoring.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
});

export default BluetoothScreen;
