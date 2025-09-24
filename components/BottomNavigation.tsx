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

export default function BottomNav({ state, navigation }: BottomTabBarProps) {
  const icons: Record<string, any> = {
    Bluetooth: Bluetooth,
    Settings: Settings,
    Home: Home,
    Dashboard: ChartSpline,
    Inventory: Syringe,
  };

  return (
    <View
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      bg="#3A3A3A"
      px="$3"
      py="$3"
      mx="$2"
      borderTopWidth={1}
      borderRadius="$full"
      position="absolute"
      bottom="$6"
      left={0}
      right={0}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const Icon = icons[route.name];

        return (
          <Button
            key={route.key}
            w={72}
            h={72}
            borderRadius="$full"
            justifyContent="center"
            alignItems="center"
            style={
              isFocused
                ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  }
                : undefined
            }
            bg={isFocused ? '#3a783eff' : 'transparent'}
            onPress={() => {
              if (!isFocused) {
                navigation.navigate(route.name);
              }
            }}
          >
            <ButtonIcon as={Icon} size="2xl" color="#FFFFFF" />
          </Button>
        );
      })}
    </View>
  );
}
