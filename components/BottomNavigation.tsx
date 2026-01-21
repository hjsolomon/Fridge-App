import React from 'react';
import { View, Button, ButtonIcon } from '@gluestack-ui/themed';
import {
  Home,
  Bluetooth,
  ChartSpline,
  Syringe,
  Settings,
} from 'lucide-react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const TAB_BAR_HEIGHT =
  width * 0.17 +
  16 +
  12;

export default function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const icons: Record<string, any> = {
    Bluetooth,
    Settings,
    Home,
    Dashboard: ChartSpline,
    Inventory: Syringe,
  };

  const buttonSize = width * 0.17;
  const iconSize = width * 0.2;
  const maxWidth = 500;

  return (
    <View
      alignItems="center"
      position="absolute"
      left={0}
      right={0}
      style={{ bottom: insets.bottom + 12 }}
    >
      <View
        flexDirection="row"
        justifyContent="space-around"
        alignItems="center"
        bg="#282828ff"
        px="$3"
        py="$2"
        mx="$2"
        mb="$1"
        borderRadius="$full"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
          width: '95%',
          maxWidth,
        }}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const Icon = icons[route.name];

          return (
            <Button
              key={route.key}
              w={buttonSize}
              h={buttonSize}
              borderRadius="$full"
              justifyContent="center"
              alignItems="center"
              bg={isFocused ? '#3a783eff' : 'transparent'}
              onPress={() => {
                if (!isFocused) navigation.navigate(route.name);
              }}
            >
              <MotiView
                animate={{
                  scale: isFocused ? 1.2 : 1,
                  opacity: isFocused ? 1 : 0.6,
                }}
                transition={{ type: 'timing', duration: 250 }}
              >
                <ButtonIcon
                  as={Icon}
                  size="2xl"
                  style={{ width: iconSize, height: iconSize }}
                  color={isFocused ? '#FFFFFF' : '#cdcdcdff'}
                />
              </MotiView>
            </Button>
          );
        })}
      </View>
    </View>
  );
}
