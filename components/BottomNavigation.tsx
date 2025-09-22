import React from 'react';
import { View, Button, ButtonIcon } from '@gluestack-ui/themed';
import { Home, Bluetooth, ChartSpline } from 'lucide-react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export default function BottomNav({ state, navigation }: BottomTabBarProps) {
  const icons: Record<string, any> = {
    Bluetooth: Bluetooth,
    Home: Home,
    Dashboard: ChartSpline,
  };

  return (
 <View
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      bg="#3A3A3A"
      px="$10"      
      py="$3"       
      mx="$4"       
      borderTopWidth={1}
      borderRadius="$full"
      position="absolute"
      bottom="$6"   
      left={0}
      right={0}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const Icon = icons[route.name];

        return (
          <Button
            key={route.key}
            w={64}
            h={64}
            borderRadius="$full"
            justifyContent="center"
            alignItems="center"
            bg={isFocused ? '#3a783eff' : 'transparent'}
            onPress={() => {
              if (!isFocused) {
                navigation.navigate(route.name);
              }
            }}
          >
            <ButtonIcon as={Icon} size="xl" color="#FFFFFF" />
          </Button>
        );
      })}
    </View>
  );
}
