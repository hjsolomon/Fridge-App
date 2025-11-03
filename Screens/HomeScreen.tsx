import React, { useEffect, useState } from 'react';
import { Box, Text, HStack } from '@gluestack-ui/themed';

import TemperatureCircle from '../components/TemperatureReading';
import PowerSourceIcon from '../components/PowerSourceIcon';
import { Sun, Zap, Battery } from 'lucide-react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import BatteryBar from '@/components/BatteryReading';

import { getLatestSensorReading, SensorReading } from '../db/database';

/**
 * HomeScreen
 * -----------
 * Provides an at-a-glance overview of the refrigerator’s live status:
 *
 * - Current temperature (visualized in a circular indicator)
 * - Active power source (solar, grid, or battery)
 * - Current battery level (visualized with BatteryBar)
 *
 * Updates every 5 seconds to remain in sync with incoming sensor data.
 */

const FRIDGE_ID = 'fridge_1';

/* -------------------------------------------------------------------------- */
/*                         Component Definition & State                        */
/* -------------------------------------------------------------------------- */

const HomeScreen: React.FC = () => {
  // Latest temperature reading (defaults to a safe low temp)
  const [temp, setTemp] = useState(2.0);

  // Which power source is currently active (UI simulation)
  const [solar, setSolar] = useState(true);
  const [grid, setGrid] = useState(false);
  const [battery, setBattery] = useState(false);

  // Battery level (0–100)
  const [powerLevel, setPowerLevel] = useState(3);

  /* ------------------------------------------------------------------------ */
  /*                         Fetch Latest Sensor Data                         */
  /* ------------------------------------------------------------------------ */

  /**
   * fetchLatestReading()
   * ---------------------
   * Fetches the latest sensor reading from the database.
   * Updates:
   *  - Temperature
   *  - Battery level
   *  - Randomly simulated power source (for UI demo purposes)
   */
  const fetchLatestReading = async () => {
    try {
      const latestReading: SensorReading | null =
        await getLatestSensorReading(FRIDGE_ID);

      if (latestReading) {
        setTemp(latestReading.temperature);
        setPowerLevel(latestReading.battery_level);

        // Simulated power source rotation (placeholder logic)
        const sources = ['solar', 'grid', 'battery'];
        const randomSource = sources[Math.floor(Math.random() * sources.length)];

        setSolar(randomSource === 'solar');
        setGrid(randomSource === 'grid');
        setBattery(randomSource === 'battery');
      }
    } catch (err) {
      console.error('Failed to fetch latest sensor reading:', err);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                           Auto-Refresh Every 5s                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    fetchLatestReading(); // Initial load
    const interval = setInterval(fetchLatestReading, 5000); // Poll every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                UI Rendering                                */
  /* -------------------------------------------------------------------------- */

  return (
    <Box flex={1} bg="#1c1c1c" p="$4">
      {/* Header with info button */}
      <ScreenHeader
        title="Home"
        infoText="The Home screen provides a quick overview of the refrigerator's current status. Here you can view temperature readings, power source information, and battery levels at a glance."
      />

      {/* Temperature Circle Display */}
      <Box alignItems="center" mt="$1" mb="$7">
        <TemperatureCircle temperature={temp} />
      </Box>

      {/* Power Source Header */}
      <Text fontWeight="$light" color="white" fontSize="$2xl" textAlign="left">
        Power Source(s)
      </Text>

      {/* Power Source Icons */}
      <HStack justifyContent="space-around" my="$3" mb="$7">
        <PowerSourceIcon
          icon={<Sun size={48} color="white" />}
          label="Solar"
          bgColor="#5DB565"
          active={solar}
        />
        <PowerSourceIcon
          icon={<Zap size={48} color="white" />}
          label="Grid"
          bgColor="#5DB565"
          active={grid}
        />
        <PowerSourceIcon
          icon={<Battery size={48} color="white" />}
          label="Battery"
          bgColor="#5DB565"
          active={battery}
        />
      </HStack>

      {/* Battery Section Header */}
      <Text fontWeight="$light" color="white" fontSize="$2xl" textAlign="left">
        Battery Level
      </Text>

      {/* Battery Level Indicator */}
      <Box alignItems="center" mt="$1" mb="$7">
        <BatteryBar level={powerLevel} />
      </Box>
    </Box>
  );
};

export default HomeScreen;
