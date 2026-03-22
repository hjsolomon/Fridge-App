/**
 * HomeScreen
 * ===========
 * Dashboard overview of current fridge status.
 *
 * Features:
 * - Real-time temperature display in circular indicator
 * - Power source status (solar, grid, battery)
 * - Battery level bar with color coding
 * - Auto-refresh every 5 seconds
 * - Responsive typography and spacing
 */

import React, { useEffect, useState } from 'react';
import { Box, Text, HStack } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';

import TemperatureCircle from '../components/home/TemperatureReading';
import PowerSourceIcon from '../components/home/PowerSourceIcon';
import { Sun, Zap, Battery } from 'lucide-react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import BatteryBar from '@/components/home/BatteryReading';

// import { getLatestSensorReading, SensorReading } from '../db/database';
import { SensorReading } from '../db/database';
import { getCurrentReadingFirestore } from '@/db/firestoreSensorReading';

const FRIDGE_ID = 'fridge_1';

/* -------------------------------------------------------------------------- */
/*                         Component Definition                                */
/* -------------------------------------------------------------------------- */

const HomeScreen: React.FC = () => {
  /* -------------------------------------------------------------------- */
  /*                        State Management                               */
  /* -------------------------------------------------------------------- */

  // Current temperature reading
  const [temp, setTemp] = useState(2.0);

  // Power source active states
  const [solar, setSolar] = useState(true);
  const [grid, setGrid] = useState(false);
  const [battery, setBattery] = useState(false);

  // Battery charge percentage
  const [powerLevel, setPowerLevel] = useState(3);

  /* -------------------------------------------------------------------- */
  /*                        Responsive Sizing                              */
  /* -------------------------------------------------------------------- */

  const { height, width } = Dimensions.get('window');

  // Typography sizing
  const sectionTitleFontSize = Math.max(18, Math.round(height * 0.022));

  // Spacing constants
  const spacingS = Math.round(height * 0.01);
  const spacingM = Math.round(height * 0.02);
  const spacingL = Math.round(height * 0.04);

  // Icon sizing
  const powerIconSize = Math.max(32, Math.round(width * 0.06));

  /* -------------------------------------------------------------------- */
  /*                      Fetch Latest Sensor Data                         */
  /* -------------------------------------------------------------------- */

  /**
   * fetchLatestReading()
   * --------------------
   * Gets current sensor data from database.
   *
   * Updates:
   * - Temperature
   * - Battery level
   * - Active power source (simulated rotation)
   */
  const fetchLatestReading = async () => {
    try {
      const latestReading = await getCurrentReadingFirestore(FRIDGE_ID);

      if (latestReading) {
        setTemp(latestReading.temperature);
        setPowerLevel(latestReading.battery_level);

        // Simulate power source rotation (demo)
        const rotation = ['solar', 'grid', 'battery'];
        const random = rotation[Math.floor(Math.random() * rotation.length)];

        setSolar(random === 'solar');
        setGrid(random === 'grid');
        setBattery(random === 'battery');
      }
    } catch (err) {
      console.error('Failed to fetch latest sensor reading:', err);
    }
  };

  /* -------------------------------------------------------------------- */
  /*                    Auto-fetch on Mount & Interval                     */
  /* -------------------------------------------------------------------- */

  /**
   * Fetch sensor data on mount and set 5-second refresh interval.
   * Cleanup interval on unmount.
   */
  useEffect(() => {
    fetchLatestReading();
    const interval = setInterval(fetchLatestReading, 5000);
    return () => clearInterval(interval);
  }, []);

  /* -------------------------------------------------------------------- */
  /*                              UI Layout                                */
  /* -------------------------------------------------------------------- */

  return (
    <Box flex={1} style={{ padding: spacingM }}>
      <ScreenHeader
        title="Home"
        infoText="The Home screen provides a quick overview of the refrigerator's current status. Here you can view the current temperature, power sources in use, and battery level."
      />

      {/* Temperature reading */}
      <Box alignItems="center" style={{ marginTop: spacingS, marginBottom: spacingL }}>
        <TemperatureCircle temperature={temp} />
      </Box>

      {/* Section header */}
      <Text
        color="white"
        style={{
          fontSize: sectionTitleFontSize,
          fontWeight: '300',
        }}
      >
        Power Source(s)
      </Text>

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
      <Text
        color="white"
        style={{
          fontSize: sectionTitleFontSize,
          fontWeight: '300',
        }}
      >
        Battery Level
      </Text>

      {/* Battery Bar */}
      <Box alignItems="center" style={{ marginBottom: spacingL }}>
        <BatteryBar level={powerLevel} />
      </Box>
    </Box>
  );
};

export default HomeScreen;
