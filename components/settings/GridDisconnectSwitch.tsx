/**
 * GridDisconnectSwitch
 * ====================
 * Toggle switch component for enabling/disabling grid disconnection notifications.
 *
 * Features:
 * - Simple on/off toggle for user preference
 * - Real-time Firestore synchronization
 * - Green active state, gray inactive state
 * - Large touch target for easy interaction
 */

import React, { use, useState } from 'react';
import { Box, HStack, Text, Switch } from '@gluestack-ui/themed';
import { updateGridDisconnect } from '@/db/firestoreSettings';

const FRIDGE_ID = 'fridge_1';

/* -------------------------------------------------------------------------- */
/*                             Type Definitions                               */
/* -------------------------------------------------------------------------- */

interface GridDisconnectSwitchProps {
  gridDisconnectBool?: boolean;  // Initial toggle state (default: false)
}

/* -------------------------------------------------------------------------- */
/*                             Component Definition                            */
/* -------------------------------------------------------------------------- */

const GridDisconnectSwitch: React.FC<GridDisconnectSwitchProps> = ({
  gridDisconnectBool,
}) => {
  /* -------------------------------------------------------------------- */
  /*                        State Management                               */
  /* -------------------------------------------------------------------- */

  // Tracks whether grid disconnect notifications are enabled
  const [isEnabled, setIsEnabled] = useState(gridDisconnectBool ?? false);

  /* -------------------------------------------------------------------- */
  /*                     Switch State Change Handler                       */
  /* -------------------------------------------------------------------- */

  /**
   * handleSwitchChange()
   * --------------------
   * Updates grid disconnect notification preference both locally and in Firestore.
   * Called immediately when user toggles the switch.
   *
   * Steps:
   * 1. Update local state for immediate UI feedback
   * 2. Persist to Firestore database
   * 3. Log success or catch errors
   */
  const handleSwitchChange = async (enabled: boolean) => {
    setIsEnabled(enabled);

    try {
      await updateGridDisconnect(FRIDGE_ID, enabled);
      console.log('Grid disconnect status updated in Firestore:', enabled);
    } catch (error) {
      console.error('Failed to update grid disconnect status:', error);
    }
  };

  return (
    <HStack width="100%" alignItems="center" bg="transparent">
      {/* Label text */}
      <Text color="white" fontSize="$lg" ml="$5">
        Notify When Grid Disconnects
      </Text>

      {/* Toggle switch (right-aligned) */}
      <Switch
        trackColor={{ false: '#d4d4d4', true: '#3ca14a' }}
        ml="auto"
        mr="$4"
        size="lg"
        onValueChange={handleSwitchChange}
        value={isEnabled}
      />
    </HStack>
  );
};

export default GridDisconnectSwitch;
