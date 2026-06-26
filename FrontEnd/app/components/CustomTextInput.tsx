import { useAppTheme } from '@/context/ThemeContext';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import {
  Button,
  Dialog,
  HelperText,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import {
  hasInvisibleChars,
  isValidText,
  stripInvisibleChars,
} from '@/utils/textValidation';

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

  // Estado para o dialog de caracteres invisíveis
  const [dialogVisible, setDialogVisible] = useState(false);

  // Estado para controlar a visibilidade da palavra-passe
  const [isSecureEntry, setIsSecureEntry] = useState(isPassword || false);

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

  const hasError = required ? !isValidText(value) : false;

  const handleChangeText = (text: string) => {
    if (hasInvisibleChars(text)) {
      setDialogVisible(true);
    }
    const cleanedText = stripInvisibleChars(text);
    onChangeText(cleanedText);
  };

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
        onChangeText={handleChangeText}
        // Usa o estado dinâmico em vez do prop fixo
        secureTextEntry={isSecureEntry}
        autoCapitalize={isEmail || isPassword ? 'none' : 'sentences'}
        keyboardType={keyboardType}
        maxLength={currentMaxLength}
        error={hasError}
        // Adiciona o ícone do olho à direita se for um campo de palavra-passe
        right={
          isPassword ? (
            <TextInput.Icon
              icon={isSecureEntry ? 'eye-closed' : 'eye'}
              onPress={() => setIsSecureEntry(!isSecureEntry)}
              accessibilityLabel={
                isSecureEntry
                  ? t('accessibility.show_password', {
                      defaultValue: 'Mostrar palavra-passe',
                    })
                  : t('accessibility.hide_password', {
                      defaultValue: 'Ocultar palavra-passe',
                    })
              }
            />
          ) : null
        }
      />
      {hasError && (
        <HelperText type="error" visible={hasError}>
          {t('common.obrigatorio')}
        </HelperText>
      )}

      {/* Dialog de aviso de caracteres invisíveis */}
      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.error }}>
            {t('common.error_alert', { defaultValue: 'Erro' })}
          </Dialog.Title>
          <Dialog.Content>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurface }}
            >
              {t('validation.invisible_chars_removed', {
                defaultValue:
                  'Foram detetados e removidos caracteres invisíveis do texto.',
              })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setDialogVisible(false)}
              textColor={theme.colors.primary}
            >
              {t('common.ok', { defaultValue: 'OK' })}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default CustomTextInput;
