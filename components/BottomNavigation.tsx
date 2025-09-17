import React from 'react';
import { HStack, Button, ButtonIcon } from '@gluestack-ui/themed';
import { Home, Bluetooth, ChartSpline } from 'lucide-react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../Navigation/AppNavigator';

export default function BottomNav() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <HStack
      justifyContent="space-around"
      alignItems="center"
      bg="$backgroundLight50"
      px="$4"
      py="$2"
      borderTopWidth={1}
      borderColor="$backgroundLight200"
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      >
        {/* Bluetooth */}
      <Button
        variant="link"
        onPress={() => navigation.navigate('Bluetooth')}
      >
        <ButtonIcon as={Bluetooth} size="xl" color="$primary500" />
      </Button>
      {/* Home */}
      <Button
        variant="link"
        onPress={() => navigation.navigate('Home')}
      >
        <ButtonIcon as={Home} size="xl" color="$primary500" />
      </Button>
    {/* Dashboard */}
      <Button
        variant="link"
        onPress={() => navigation.navigate('Dashboard')}
      >
        <ButtonIcon as={ChartSpline} size="xl" color="$primary500" />
      </Button>


    </HStack>
  );
}
