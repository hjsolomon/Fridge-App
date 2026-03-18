/**
 * InventoryMinimumSelector
 * ========================
 * Accordion component for configuring the minimum inventory level threshold
 * at which the user receives low-inventory notifications.
 *
 * Features:
 * - Collapsible accordion UI for compact settings integration
 * - Slider control with 10-unit step increments (0-600 vials)
 * - Real-time label display above slider thumb
 * - Live Firestore synchronization on slider release
 * - Green gradient styling for interactive feedback
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
import { updateMinimumInventory } from '../../db/firestoreSettings';

/* -------------------------------------------------------------------------- */
/*                             Type Definitions                               */
/* -------------------------------------------------------------------------- */

interface InventoryMinimumSelectorProps {
  minInventory?: number;  // Initial minimum inventory level (default: 20 vials)
}

/* -------------------------------------------------------------------------- */
/*                             Component Definition                            */
/* -------------------------------------------------------------------------- */

const InventoryMinimumSelector: React.FC<InventoryMinimumSelectorProps> = ({
  minInventory,
}) => {
  /* -------------------------------------------------------------------- */
  /*                        State Management                               */
  /* -------------------------------------------------------------------- */

  // Tracks whether accordion is expanded
  const [open, setOpen] = useState(false);

  // Current selected minimum inventory level (0-600 vials)
  const [inventoryLevel, setInventoryLevel] = useState<number>(minInventory ?? 20);

  /* -------------------------------------------------------------------- */
  /*                   Inventory Level Change Handler                      */
  /* -------------------------------------------------------------------- */

  /**
   * handleInventoryChange()
   * ----------------------
   * Updates inventory threshold both locally and in Firestore.
   * Called when user releases the slider (onValuesChangeFinish).
   *
   * Steps:
   * 1. Update local state immediately for UI responsiveness
   * 2. Persist to Firestore database
   * 3. Log success or catch errors
   */
  const handleInventoryChange = async (value: number) => {
    setInventoryLevel(value);

    try {
      await updateMinimumInventory(FRIDGE_ID, value);
      console.log('Inventory range updated in Firestore:', value);
    } catch (error) {
      console.error('Failed to update inventory range:', error);
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
        {/* Accordion Header with Title and Chevron */}
        <AccordionHeader>
          <AccordionTrigger>
            <HStack width="100%" alignItems="center">
              <AccordionTitleText color="white" fontSize="$lg">
                Minimum Inventory Level
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

        {/* Accordion Body: Descriptive Text + Slider */}
        <AccordionContent alignItems='center'>
          <AccordionContentText color="white" fontSize="$md" pb="$4" mb="$7">
            Here you can set the minimum inventory level at which you would
            like to receive notifications.
          </AccordionContentText>

          {/* Multi-slider for inventory level selection (0-600 vials, step 10) */}
          <MultiSlider
            values={[inventoryLevel]}
            min={0}
            max={600}
            step={10}
            allowOverlap={false}
            snapped
            onValuesChangeFinish={vals => handleInventoryChange(vals[0])}
            enableLabel
            customLabel={e => (
              <Box
                style={{
                  position: 'absolute',
                  width: '100%',
                  top: -30, // move labels above markers
                }}
              >
                {/* Inventory count label */}
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
                    {e.oneMarkerValue}
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

export default InventoryMinimumSelector;
