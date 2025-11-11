import React, { useEffect, useState } from 'react';
import { Box, Text, HStack } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';

import TemperatureCircle from '../components/TemperatureReading';
import PowerSourceIcon from '../components/PowerSourceIcon';
import { Sun, Zap, Battery } from 'lucide-react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import BatteryBar from '@/components/BatteryReading';

import { getLatestSensorReading, SensorReading } from '../db/database';

const FRIDGE_ID = 'fridge_1';

const HomeScreen: React.FC = () => {
  const [temp, setTemp] = useState(2.0);

  const [solar, setSolar] = useState(true);
  const [grid, setGrid] = useState(false);
  const [battery, setBattery] = useState(false);

  const [powerLevel, setPowerLevel] = useState(3);



  const { height, width } = Dimensions.get('window');

  // Screen padding
  const screenPadding = Math.round(height * 0.02);

  // Typography
  const sectionTitleFontSize = Math.max(18, Math.round(height * 0.035));

  // Vertical spacing
  const spacingXS = Math.round(height * 0.005);
  const spacingS = Math.round(height * 0.01);
  const spacingM = Math.round(height * 0.02);
  const spacingL = Math.round(height * 0.04);

  const powerIconSize = Math.max(32, Math.round(width * 0.06));

  /* ------------------------------------------------------------------------ */
  /*                          Fetch Latest Sensor Data                        */
  /* ------------------------------------------------------------------------ */

  const fetchLatestReading = async () => {
    try {
      const latestReading: SensorReading | null =
        await getLatestSensorReading(FRIDGE_ID);

      if (latestReading) {
        setTemp(latestReading.temperature);
        setPowerLevel(latestReading.battery_level);

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

  useEffect(() => {
    fetchLatestReading();
    const interval = setInterval(fetchLatestReading, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                               UI Layout                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <Box flex={1} bg="#1c1c1c" style={{ padding: screenPadding }}>
      <ScreenHeader
        title="Home"
        infoText="The Home screen provides a quick overview of the refrigerator's current status. Here you can view temperature readings, power source information, and battery levels at a glance."
      />

      {/* Temperature reading */}
      <Box alignItems="center" style={{ marginTop: spacingS, marginBottom: spacingM }}>
        <TemperatureCircle temperature={temp} />
      </Box>

      {/* Section header */}
      <Text
        color="white"
        style={{
          fontSize: sectionTitleFontSize,
          fontWeight: '300',
          marginBottom: spacingS,
        }}
      >
        Power Source(s)
      </Text>

      {/* Power Source Icons */}
      <HStack
        justifyContent="space-around"
        style={{
          marginTop: spacingS,
          marginBottom: spacingS,
        }}
      >
        <PowerSourceIcon
          icon={<Sun size={powerIconSize} color="white" />}
          label="Solar"
          bgColor="#5DB565"
          active={solar}
        />
        <PowerSourceIcon
          icon={<Zap size={powerIconSize} color="white" />}
          label="Grid"
          bgColor="#5DB565"
          active={grid}
        />
        <PowerSourceIcon
          icon={<Battery size={powerIconSize} color="white" />}
          label="Battery"
          bgColor="#5DB565"
          active={battery}
        />
      </HStack>

      {/* Battery Level title */}
      <Text
        color="white"
        style={{
          fontSize: sectionTitleFontSize,
          fontWeight: '300',
          marginBottom: spacingXS,
        }}
      >
        Battery Level
      </Text>

      {/* Battery Bar */}
      <Box alignItems="center" style={{ marginTop: spacingXS, marginBottom: spacingL }}>
        <BatteryBar level={powerLevel} />
      </Box>
    </Box>
  );
};

export default HomeScreen;
