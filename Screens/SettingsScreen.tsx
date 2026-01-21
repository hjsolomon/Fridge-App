import React from 'react';
import { Box, Text, ScrollView } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';
import TempRangeSelector from '../components/settings/TempRangeSelector';
import GridDisconnectSwitch from '../components/settings/GridDisconnectSwitch';
import BatteryLevelSelector from '@/components/settings/BatteryLevelSelector';
import InventoryMinimumSelector from '@/components/settings/InventoryMinimumSelector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '@/components/BottomNavigation';

const SettingsScreen: React.FC = () => {


  return (
    <Box flex={1} p="$4">
      <ScreenHeader
        title="Settings"
        infoText="The Settings screen allows you to customize app preferences..."
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        <Text color="white" mb="$4">Notification Preferences</Text>

        <Box
          justifyContent="flex-start"
          bg="#282828ff"
          rounded="$2xl"
          py="$5"
          mb="$6"
          style={{
            paddingTop: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 20,
          }}
        >
          <TempRangeSelector />
          <Box mt="$1" height={1} width="90%" bg="#FFFFFF" opacity={0.2} alignSelf="center" mb={16} />
          <BatteryLevelSelector />
          <Box mt="$1" height={1} width="90%" bg="#FFFFFF" opacity={0.2} alignSelf="center" mb={16} />
          <InventoryMinimumSelector />
          <Box mt="$1" height={1} width="90%" bg="#FFFFFF" opacity={0.2} alignSelf="center" mb={16} />
          <GridDisconnectSwitch />
        </Box>
      </ScrollView>
      <Box height={useSafeAreaInsets().bottom + TAB_BAR_HEIGHT} />
    </Box>
  );
};

export default SettingsScreen;
