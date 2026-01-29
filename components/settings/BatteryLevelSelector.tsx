import React, { use, useState } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionTitleText,
  AccordionContent,
  AccordionContentText,
  Box,
  HStack,
  Text,
} from '@gluestack-ui/themed';
import { ChevronDown } from 'lucide-react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
const FRIDGE_ID = 'fridge_1';
import { updateBatteryLevel } from '../../db/firestoreSettings';

interface BatteryLevelSelectorProps {
  minBattery?: number;
}

const BatteryLevelSelector: React.FC<BatteryLevelSelectorProps> = ({
  minBattery,
}) => {
  const [open, setOpen] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number>(minBattery ?? 20);

  const handleBatteryChange = async (value: number) => {
    setBatteryLevel(value);

    try {
      await updateBatteryLevel(FRIDGE_ID, value);
      console.log('Battery range updated in Firestore:', value);
    } catch (error) {
      console.error('Failed to update battery range:', error);
    }
  };

  return (
    <Accordion
      type="single"
      width="100%"
      bg="transparent"
      onValueChange={value => {
        setOpen(value.includes('battery-level'));
      }}
    >
      <AccordionItem value="battery-level" bg="#282828ff" rounded="$2xl">
        <AccordionHeader>
          <AccordionTrigger>
            <HStack width="100%" alignItems="center">
              <AccordionTitleText color="white" fontSize="$lg">
                Minimum Battery Level
              </AccordionTitleText>

              <Box
                ml="auto"
                mr="$2"
                transform={[{ rotate: open ? '180deg' : '0deg' }]}
              >
                <ChevronDown size={20} color="white" />
              </Box>
            </HStack>
          </AccordionTrigger>
        </AccordionHeader>

        <AccordionContent alignItems='center'>
          <AccordionContentText color="white" fontSize="$md" pb="$4" mb="$7">
            Here you can set the minimum battery level at which you would like to receive notifications.
          </AccordionContentText>
          <MultiSlider
            values={[batteryLevel]}
            min={0}
            max={100}
            step={5}
            allowOverlap={false}
            snapped
            onValuesChangeFinish={vals => handleBatteryChange(vals[0])}
            enableLabel
            customLabel={e => (
              <Box
                style={{
                  position: 'absolute',
                  width: '100%',
                  top: -30, // move labels above markers
                }}
              >
                {/* LEFT LABEL */}
                <Box
                  style={{
                    position: 'absolute',
                    left: e.oneMarkerLeftPosition - 20,
                    backgroundColor: '#3ca14a',
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    {e.oneMarkerValue}%
                  </Text>
                </Box>
              </Box>
            )}
            containerStyle={{ alignSelf: 'center', width: '90%' }}
            selectedStyle={{ backgroundColor: '#3ca14a' }}
            unselectedStyle={{ backgroundColor: '#9a9a9aff' }}
            markerStyle={{
              backgroundColor: '#ffffffff',
              borderWidth: 1,
              borderColor: '#3ca14a',
              height: 24,
              width: 24,
            }}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default BatteryLevelSelector;
