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

interface InventoryMinimumSelectorProps {
  minInventory?: number;
}

const InventoryMinimumSelector: React.FC<InventoryMinimumSelectorProps> = ({
  minInventory,
}) => {
  const [open, setOpen] = useState(false);
  const [inventoryLevel, setInventoryLevel] = useState<number>(minInventory ?? 20);

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
        <AccordionHeader>
          <AccordionTrigger>
            <HStack width="100%" alignItems="center">
              <AccordionTitleText color="white" fontSize="$lg">
                Minimum Inventory Level
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
            Here you can set the minimum inventory level at which you would
            like to receive notifications.
          </AccordionContentText>
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
