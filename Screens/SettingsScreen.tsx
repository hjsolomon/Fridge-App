import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';
import { Dimensions } from 'react-native';
import TempRangeSelector from '../components/settings/TempRangeSelector';
import GridDisconnectSwitch from '../components/settings/GridDisconnectSwitch';
import BatteryLevelSelector from '@/components/settings/BatteryLevelSelector';

const SettingsScreen: React.FC = () => {
  const { height } = Dimensions.get('window');
  const base = height;
  const cardPaddingTop = Math.round(base * 0.01);
  const spacingS = Math.round(base * 0.01);
  const spacingM = Math.round(base * 0.03);

  return (
    <Box flex={1} p="$4">
      <ScreenHeader
        title="Settings"
        infoText="The Settings screen will be implemented in future updates, allowing you to customize app preferences, notification settings, and other configurations related to the refrigerator system."
      />
      <Text color="white">Notification Preferences</Text>
      <Box
        justifyContent="flex-start"
        bg="#282828ff"
        rounded="$2xl"
        py="$5"
        style={{
          paddingTop: cardPaddingTop,
          marginVertical: spacingS,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 20,
        }}
      >
        <TempRangeSelector />
        <Box
          mt="$1"
          height={1}
          width="90%"
          bg="#FFFFFF"
          opacity={0.2}
          alignSelf="center"
          mb={spacingS}
        />
        <BatteryLevelSelector />
        <Box
          mt="$1"
          height={1}
          width="90%"
          bg="#FFFFFF"
          opacity={0.2}
          alignSelf="center"
          mb={spacingM}
        />
        <GridDisconnectSwitch />
      </Box>
    </Box>
  );
};

export default SettingsScreen;
