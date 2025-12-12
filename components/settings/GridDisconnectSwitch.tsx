import React, { use, useState } from 'react';
import { Box, HStack, Text, Switch } from '@gluestack-ui/themed';
import { updateGridDisconnect } from '@/db/firestoreSettings';

const FRIDGE_ID = 'fridge_1';

interface GridDisconnectSwitchProps {
  gridDisconnectBool?: boolean;
}

const GridDisconnectSwitch: React.FC<GridDisconnectSwitchProps> = ({
  gridDisconnectBool,
}) => {
  const [isEnabled, setIsEnabled] = useState(gridDisconnectBool ?? false);
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
      <Text color="white" fontSize="$lg" ml="$5">
        Notify When Grid Disconnects
      </Text>
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
