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
import { updateTemperatureRange } from '../../db/firestoreSettings';

interface TempRangeSelectorProps {
  minTemp?: number;
  maxTemp?: number;
}

const TempRangeSelector: React.FC<TempRangeSelectorProps> = ({
  minTemp,
  maxTemp,
}) => {
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<[number, number]>([
    minTemp ?? 2,
    maxTemp ?? 8,
  ]);

  const handleTempChange = async (values: number[]) => {
    const [min, max] = values;
    setTempRange([min, max]);

    try {
      await updateTemperatureRange(FRIDGE_ID, min, max);
      console.log('Temp range updated in Firestore:', min, max);
    } catch (error) {
      console.error('Failed to update temp range:', error);
    }
  };

  return (
    <Accordion
      type="single"
      width="100%"
      bg="transparent"
      onValueChange={value => {
        setOpen(value.includes('temp-range'));
      }}
    >
      <AccordionItem value="temp-range" bg="#282828ff"         rounded="$2xl"
>
        <AccordionHeader >
          <AccordionTrigger>
            <HStack width="100%" alignItems="center">
              <AccordionTitleText color="white" fontSize="$lg">
                Temperature Range
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
            Here you can set your preferred temperature range for the fridge. Notifications will be sent if the temperature goes outside this range.
          </AccordionContentText>
          <MultiSlider
            values={[0, 8]}
            min={0}
            max={10}
            step={0.5}
            allowOverlap={false}
            snapped
            onValuesChangeFinish={handleTempChange}
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
                    {e.oneMarkerValue}°C
                  </Text>
                </Box>

                {/* RIGHT LABEL */}
                <Box
                  style={{
                    position: 'absolute',
                    left: e.twoMarkerLeftPosition - 20,
                    backgroundColor: '#3ca14a',
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    {e.twoMarkerValue}°C
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

export default TempRangeSelector;
