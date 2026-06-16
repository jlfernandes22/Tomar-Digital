import { useAppTheme } from '@/context/ThemeContext';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { HelperText, Text, TextInput } from 'react-native-paper';

// Definimos o que o botão pode receber
interface CustomTextInputProps {
  label: string; // O texto
  value: string;
  multiline?: boolean;
  numberOfLines?: number;
  className?: string; // Para adicionar margens extra
  onChangeText: (text: string) => void;
  isPassword?: boolean;
  isEmail?: boolean;
  isNumber?: boolean;
  isNIF?: boolean;
  placeholder?: string;
  keyboardType?: string;
  lenght?: number;
  required?: boolean;
}

const CustomTextInput = ({
  label,
  value,
  multiline,
  numberOfLines,
  className,
  onChangeText,
  isPassword,
  placeholder,
  isEmail,
  isNumber,
  isNIF,
  lenght,
  required,
}: CustomTextInputProps) => {
  let currentMaxLength = lenght;
  if (isNIF) {
    currentMaxLength = 9;
  }
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();

  const keyboardType = isEmail
    ? 'email-address'
    : isNumber || isNIF
      ? 'numeric'
      : 'default';

  const LabelElement = (
    <Text>
      {label}
      {required && <Text style={{ color: theme.colors.error }}> *</Text>}
    </Text>
  );
  const hasError = required && value.length === 0;

  return (
    <View
      className={`${className || ''}`}
      style={{
        borderRadius: theme.roundness,
      }}
    >
      <TextInput
        multiline={multiline}
        numberOfLines={numberOfLines}
        mode="outlined"
        label={required ? LabelElement : label}
        value={value}
        placeholder={placeholder}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={multiline ? { minHeight: 300, height: 'auto' } : {}}
        onChangeText={onChangeText}
        secureTextEntry={isPassword}
        autoCapitalize={isEmail || isPassword ? 'none' : 'sentences'}
        keyboardType={keyboardType}
        maxLength={currentMaxLength}
        error={hasError ? true : false}
      />
      {hasError && (
        <HelperText type="error" visible={hasError}>
          {t('common.obrigatorio')}
        </HelperText>
      )}
    </View>
  );
};

export default CustomTextInput;
