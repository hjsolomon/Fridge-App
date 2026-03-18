/**
 * SettingsScreen
 * ===============
 * Centralized settings and notification preferences.
 *
 * Features:
 * - Temperature range configuration (safe zone for alerts)
 * - Battery level threshold for low-battery alerts
 * - Inventory minimum for stock alerts
 * - Grid disconnection notifications toggle
 * - Scrollable layout with section dividers
 * - Safe area bottom padding for tab bar
 */

import React from 'react';
import { Box, Text, ScrollView } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';
import TempRangeSelector from '../components/settings/TempRangeSelector';
import GridDisconnectSwitch from '../components/settings/GridDisconnectSwitch';
import BatteryLevelSelector from '@/components/settings/BatteryLevelSelector';
import InventoryMinimumSelector from '@/components/settings/InventoryMinimumSelector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '@/components/BottomNavigation';

/* -------------------------------------------------------------------------- */
/*                         Component Definition                                */
/* -------------------------------------------------------------------------- */

/**
 * SettingsScreen
 * ---------------
 * Manages all app notification and feature preferences.
 * Uses accordion components for expandable settings sections.
 */
const SettingsScreen: React.FC = () => {


  return (
    <Box flex={1} p="$4">
      <ScreenHeader
        title="Settings"
        infoText="The Settings screen allows you to customize notification preferences regarding temperature ranges, battery levels, inventory minimums, and grid connectivity."
      />

      {/* Scrollable Settings Container */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        backgroundColor='transparent'
      >
        {/* Section Header */}
        <Text color="white" mb="$4">
          Notification Preferences
        </Text>

        {/* Settings Card with Accordions and Dividers */}
        <Box
          justifyContent="flex-start"
          bg="#282828ff"
          rounded="$2xl"
          py="$5"
          mb="$6"
        >
          {/* Temperature Range Selector */}
          <TempRangeSelector />
          <Box mt="$1" height={1} width="90%" bg="#FFFFFF" opacity={0.2} alignSelf="center" mb={16} />

          {/* Battery Level Selector */}
          <BatteryLevelSelector />
          <Box mt="$1" height={1} width="90%" bg="#FFFFFF" opacity={0.2} alignSelf="center" mb={16} />

          {/* Inventory Minimum Selector */}
          <InventoryMinimumSelector />
          <Box mt="$1" height={1} width="90%" bg="#FFFFFF" opacity={0.2} alignSelf="center" mb={16} />

          {/* Grid Disconnect Switch */}
          <GridDisconnectSwitch />
        </Box>
      </ScrollView>

      {/* Bottom Padding: Safe Area + Tab Bar Height */}
      <Box height={useSafeAreaInsets().bottom + TAB_BAR_HEIGHT} />
    </Box>
  );
};;

export default SettingsScreen;
