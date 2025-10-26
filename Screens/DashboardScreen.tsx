import React, { useState } from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';
import TempGraph from '../components/TempGraph';

const DashboardScreen: React.FC = () => {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>("");

  return (
    <Box flex={1} bg="#1C1C1C" p="$4">
        <ScreenHeader title="Insights" 
        infoText="The Insights screen provides an overview of recent refrigerator performance. Here you can view graphs of temperature trends over time. This screen helps you identify anomalies or system trends quickly."
/>

    <TempGraph onUpdateTime={setTimeSinceUpdate} />

        <Box alignItems="center" justifyContent="center" bg="#282828ff" pt="$3" my="$3" rounded="$2xl"               style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 20,
      }}>
            <Text color="white" fontSize="$2xl" fontWeight="$normal" pb="$2">
                Time Since Last Update
            </Text>
                    <Text color="white" fontSize="$4xl" fontWeight="$bold" pb="$2">
          {timeSinceUpdate || "Waiting..."}
        </Text>
        </Box>

                <Box alignItems="center" justifyContent="center" bg="#282828ff" pt="$3" my="$3" rounded="$2xl"               style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 20,
      }}>
            <Text color="white" fontSize="$2xl" fontWeight="$normal" pb="$2">
                Alerts
            </Text>
            
      </Box>

    </Box>





  );
};

export default DashboardScreen;
