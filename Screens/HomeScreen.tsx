import React, { useEffect, useState } from 'react';
import { Box, Text, HStack } from '@gluestack-ui/themed';
import  TemperatureCircle  from '../components/TemperatureReading';
import PowerSourceIcon from '../components/PowerSourceIcon';
import { Sun, Zap, Battery } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import BatteryBar from '@/components/BatteryReading';

const HomeScreen: React.FC = () => {
  const [temp, setTemp] = useState(2.0);
  const [solar, setSolar] = useState(true);
  const [grid, setGrid] = useState(false);
  const [battery, setBattery] = useState(false);
  const [powerLevel, setPowerLevel] = useState(3);


  useEffect(() => {
    const interval = setInterval(() => {
      var precision = 10;
      var randomnum =
        Math.floor(
          Math.random() * (12 * precision + 4 * precision) - 4 * precision,
        ) /
        (1 * precision);
      setTemp(randomnum);

      setPowerLevel(Math.floor(Math.random() * 101));




      const sources = ['solar', 'grid', 'battery'];
      const randomSource = sources[Math.floor(Math.random() * sources.length)];

      if (randomSource === 'solar') setSolar(prev => !prev);
      if (randomSource === 'grid') setGrid(prev => !prev);
      if (randomSource === 'battery') setBattery(prev => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);
  return (
    <Box flex={1} bg="#1c1c1c" p="$4">
      <ScreenHeader title="Home" />
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
