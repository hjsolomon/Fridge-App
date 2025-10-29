import React, { useEffect, useState } from 'react';
import { Box, Text, HStack } from '@gluestack-ui/themed';
import TemperatureCircle from '../components/TemperatureReading';
import PowerSourceIcon from '../components/PowerSourceIcon';
import { Sun, Zap, Battery } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import BatteryBar from '@/components/BatteryReading';
import {
  getLatestSensorReading,
  insertSensorReading,
  SensorReading,
} from '../db/database';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const FRIDGE_ID = 'fridge_1';

const HomeScreen: React.FC = () => {
  const [temp, setTemp] = useState(2.0);
  const [solar, setSolar] = useState(true);
  const [grid, setGrid] = useState(false);
  const [battery, setBattery] = useState(false);
  const [powerLevel, setPowerLevel] = useState(3);

  useEffect(() => {
    const fetchLatestReading = async () => {
      try {
        const latestReading: SensorReading | null =
          await getLatestSensorReading(FRIDGE_ID);
        if (latestReading) {
          setTemp(latestReading.temperature);
          setPowerLevel(latestReading.battery_level);
        }
      } catch (err) {
        console.error('Failed to fetch latest sensor reading:', err);
      }
    };

    fetchLatestReading();

    const interval = setInterval(async () => {
      try {
        const precision = 10;
        const randomTemp =
          Math.floor(
            Math.random() * (12 * precision + 4 * precision) - 4 * precision,
          ) /
          (1 * precision);
        const randomPower = Math.floor(Math.random() * 101);
        const timestamp = new Date().toISOString();

        const newReading: SensorReading = {
          reading_id: uuidv4(),
          fridge_id: FRIDGE_ID,
          temperature: randomTemp,
          battery_level: randomPower,
          timestamp,
          synced: 1,
        };

        await insertSensorReading(newReading);

        await fetchLatestReading();

        const sources = ['solar', 'grid', 'battery'];
        const randomSource =
          sources[Math.floor(Math.random() * sources.length)];

        if (randomSource === 'solar') setSolar(prev => !prev);
        if (randomSource === 'grid') setGrid(prev => !prev);
        if (randomSource === 'battery') setBattery(prev => !prev);
      } catch (err) {
        console.error('Failed to insert or fetch sensor reading:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box flex={1} bg="#1c1c1c" p="$4">
      <ScreenHeader
        title="Home"
        infoText="The Home screen provides a quick overview of the refrigerator's current status. Here you can view temperature readings, power source information, and battery levels at a glance."
      />

      <Box alignItems="center" mt="$1" mb="$7">
        <TemperatureCircle temperature={temp} />
      </Box>

      <Text fontWeight="$light" color="white" fontSize="$2xl" textAlign="left">
        Power Source(s)
      </Text>

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

      <Text fontWeight="$light" color="white" fontSize="$2xl" textAlign="left">
        Battery Level
      </Text>

      <Box alignItems="center" mt="$1" mb="$7">
        <BatteryBar level={powerLevel} />
      </Box>
    </Box>
  );
};

export default HomeScreen;
