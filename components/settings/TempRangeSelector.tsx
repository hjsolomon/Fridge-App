/**
 * TempRangeSelector
 * =================
 * Accordion component for configuring the safe temperature range for the fridge.
 * Users receive notifications if temperature goes outside this range.
 *
 * Features:
 * - Collapsible accordion UI for compact settings integration
 * - Dual-slider control for min/max bounds
 * - 0.5°C step increments (0-10°C range)
 * - Real-time dual label display above sliders
 * - Live Firestore synchronization on slider release
 * - Green gradient styling for interactive feedback
 * - Safe range: 2-8°C (UNESCO standard for vaccine storage)
 */

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

/* -------------------------------------------------------------------------- */
/*                             Type Definitions                               */
/* -------------------------------------------------------------------------- */

interface TempRangeSelectorProps {
  minTemp?: number;  // Initial minimum temperature (default: 2°C)
  maxTemp?: number;  // Initial maximum temperature (default: 8°C)
}

/* -------------------------------------------------------------------------- */
/*                             Component Definition                            */
/* -------------------------------------------------------------------------- */

const TempRangeSelector: React.FC<TempRangeSelectorProps> = ({
  minTemp,
  maxTemp,
}) => {
  /* -------------------------------------------------------------------- */
  /*                        State Management                               */
  /* -------------------------------------------------------------------- */

  // Tracks whether accordion is expanded
  const [open, setOpen] = useState(false);

  // Min and max temperature bounds as tuple [minTemp, maxTemp]
  const [tempRange, setTempRange] = useState<[number, number]>([
    minTemp ?? 2,
    maxTemp ?? 8,
  ]);

  /* -------------------------------------------------------------------- */
  /*                   Temperature Range Change Handler                    */
  /* -------------------------------------------------------------------- */

  /**
   * handleTempChange()
   * ------------------
   * Updates temperature range bounds both locally and in Firestore.
   * Called when user releases either slider (onValuesChangeFinish).
   *
   * Steps:
   * 1. Extract min and max from slider values
   * 2. Update local state immediately for UI responsiveness
   * 3. Persist range to Firestore database
   * 4. Log success or catch errors
   */
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
      <AccordionItem value="temp-range" bg="#282828ff" rounded="$2xl">
        {/* Accordion Header with Title and Chevron */}
        <AccordionHeader>
          <AccordionTrigger>
            <HStack width="100%" alignItems="center">
              <AccordionTitleText color="white" fontSize="$lg">
                Temperature Range
              </AccordionTitleText>

              {/* Rotating chevron indicator */}
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

        {/* Accordion Body: Descriptive Text + Dual Slider */}
        <AccordionContent alignItems='center'>
          <AccordionContentText color="white" fontSize="$md" pb="$4" mb="$7">
            Here you can set your preferred temperature range for the fridge. Notifications will be sent if the temperature goes outside this range.
          </AccordionContentText>

          {/* Dual-slider for temperature range selection (0-10°C, step 0.5°C) */}
          <MultiSlider
            values={[tempRange[0], tempRange[1]]}
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
                {/* LEFT LABEL: Minimum temperature */}
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

                {/* RIGHT LABEL: Maximum temperature */}
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
