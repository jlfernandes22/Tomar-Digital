import { curiosidades } from '@/constants/curiosities';
import { useState } from 'react';
import { useAppTheme } from '@/context/ThemeContext';
import { ActivityIndicator, Surface, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import CustomButton from './CustomButton';

const LoadingScreen = () => {
  const handleRandomPhrase = () => {
    return curiosidades[Math.floor(Math.random() * curiosidades.length)];
  };
  const [randomPhrase, setRandomPhrase] = useState(handleRandomPhrase());
  const { currentTheme: theme } = useAppTheme();
  const { t, i18n } = useTranslation();
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
        onPress={() => setRandomPhrase(handleRandomPhrase())}
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
