import { curiosidades } from '@/constants/curiosities';
import { useState } from 'react';
import { useAppTheme } from '@/context/ThemeContext';
import { ActivityIndicator, Surface, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import CustomButton from './CustomButton';

/**
 * Helper function to pick a random curiosity string.
 * Moved outside the component to avoid being redefined on every render.
 */
const getRandomPhrase = () => {
  return curiosidades[Math.floor(Math.random() * curiosidades.length)];
};

/**
 * LoadingScreen Component
 *
 * Displays a full-screen loading indicator. To improve user experience during
 * potentially long data fetches, it includes an interactive "Did you know?"
 * button that displays random facts about the city of Tomar.
 */
const LoadingScreen = () => {
  // --- Hooks ---
  const { currentTheme: theme } = useAppTheme();
  const { t } = useTranslation();

  // --- State ---
  // We use lazy initialization (passing the function directly, not calling it)
  // so getRandomPhrase only runs on the initial render, not on every update.
  const [randomPhrase, setRandomPhrase] = useState(getRandomPhrase);

  // --- Handlers ---
  /** Generates a new random phrase and updates the state. */
  const handleNewPhrase = () => {
    setRandomPhrase(getRandomPhrase());
  };

  // --- Render ---
  return (
    <Surface
      className="items-center justify-center p-6"
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={{ marginBottom: 20 }}
      />

      <Text
        variant="titleLarge"
        style={{
          fontWeight: 'bold',
          color: theme.colors.primary,
          marginBottom: 10,
        }}
      >
        {t('dashboard.preparing_data', {
          defaultValue: 'A preparar os dados...',
        })}
      </Text>

      <CustomButton
        labelStyle={{ textAlign: 'center' }}
        onPress={handleNewPhrase}
        accessibilityLabel={t('accessibility.discover_curiosity', {
          defaultValue: 'Descobrir curiosidade',
        })}
        accessibilityHint={t('accessibility.view_other_curiosity', {
          defaultValue: 'Clica para ver outra curiosidade',
        })}
      >
        {t('dashboard.did_you_know', { defaultValue: 'Sabias que...' })}
        {'\n '}
        {t(randomPhrase)}
      </CustomButton>
    </Surface>
  );
};

export default LoadingScreen;
