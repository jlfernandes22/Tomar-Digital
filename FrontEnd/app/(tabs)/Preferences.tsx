import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const Preferences = () => {
  const { currentTheme: theme } = useAppTheme();

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.background }}>
      <View>
        <Text>Preferências</Text>
      </View>
    </SafeAreaView>
  );
};

export default Preferences;
