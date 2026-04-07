/**
 * HomeScreen.tsx
 * ---------------
 * Displays a real-time overview of the fridge's current status, including:
 * - Current temperature (via TemperatureReading).
 * - Active power source(s): Solar, Grid, or Battery (via PowerSourceIcon).
 * - Battery level percentage (via BatteryReading).
 *
 * Data source: Firestore real-time listener via `getCurrentReadingFirestore`.
 * The power source shown is randomly simulated for demo purposes; in production
 * this would be driven by a dedicated field on the SensorReading document.
 */

import React, { useEffect, useState } from 'react';
import { Box, Text, HStack } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';

import TemperatureCircle from '../components/home/TemperatureReading';
import PowerSourceIcon from '../components/home/PowerSourceIcon';
import { Sun, Zap, Battery } from 'lucide-react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import BatteryBar from '@/components/home/BatteryReading';

import { getCurrentReadingFirestore } from '@/db/firestoreSensorReading';
import { SensorReading } from '../db/database';

const FRIDGE_ID = 'fridge_1';

/* -------------------------------------------------------------------------- */
/*                         Component Definition                                */
/* -------------------------------------------------------------------------- */

/**
 * HomeScreen
 * -----------
 * Screen component that subscribes to the latest fridge sensor reading on mount
 * and renders temperature, power source icons, and a battery level bar.
 * The Firestore listener is cleaned up on unmount.
 */
const HomeScreen: React.FC = () => {
  /* -------------------------- State Management ---------------------------- */
  const [temp, setTemp] = useState<number>(2.0);
  const [solar, setSolar] = useState(true);
  const [grid, setGrid] = useState(false);
  const [battery, setBattery] = useState(false);
  const [powerLevel, setPowerLevel] = useState<number>(3);

  /* --------------------------- Responsive Sizing --------------------------- */
  const { height, width } = Dimensions.get('window');

  const spacingS = Math.round(height * 0.01);
  const spacingM = Math.round(height * 0.02);
  const spacingL = Math.round(height * 0.04);
  const powerIconSize = Math.max(32, Math.round(width * 0.06));

  /* ---------------------- Firestore Real-time Listener -------------------- */
  useEffect(() => {
    const unsubscribe = getCurrentReadingFirestore(
      FRIDGE_ID,
      (reading: SensorReading | null) => {
        if (reading) {
          setTemp(reading.temperature);
          setPowerLevel(reading.battery_level ?? 0);

          // Simulate power source rotation (demo)
          const rotation = ['solar', 'grid', 'battery'];
          const random = rotation[Math.floor(Math.random() * rotation.length)];

          setSolar(random === 'solar');
          setGrid(random === 'grid');
          setBattery(random === 'battery');
        }
      },
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  /* ----------------------------- UI Layout ------------------------------ */
  return (
    <Box flex={1} p="$4">
      <ScreenHeader
        title="Home"
        infoText="The Home screen provides a quick overview of the refrigerator's current status. Here you can view the current temperature, power sources in use, and battery level."
      />

      {/* Temperature reading */}
      <Box
        alignItems="center"
        style={{ marginTop: spacingS, marginBottom: spacingL }}
      >
        <TemperatureCircle temperature={temp} />
      </Box>

      {/* Section header */}
      <Text color="white" mb="$4">Power Source(s)</Text>

      {/* Power Source Icons */}
      <HStack
        justifyContent="space-around"
        style={{
          marginTop: spacingS,
          marginBottom: spacingM,
        }}
      >
        <PowerSourceIcon
          icon={<Sun size={powerIconSize} color="white" />}
          label="Solar"
          active={solar}
        />
        <PowerSourceIcon
          icon={<Zap size={powerIconSize} color="white" />}
          label="Grid"
          active={grid}
        />
        <PowerSourceIcon
          icon={<Battery size={powerIconSize} color="white" />}
          label="Battery"
          active={battery}
        />
      </HStack>

      {/* Battery Level title */}
      <Text color="white" mb="$4">Battery Level</Text>

      {/* Battery Bar */}
      <Box alignItems="center" style={{ marginBottom: spacingL }}>
        <BatteryBar level={powerLevel} />
      </Box>
    </Box>
  );
};

export default HomeScreen;
