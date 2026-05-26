import React from "react";
import { View } from "react-native";
import { TextInput } from "react-native-paper";

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
}

const CustomTextInput = ({
  label,
  value,
  multiline,
  numberOfLines,
  className,
  onChangeText,
  isPassword,
  isEmail,
  isNumber,
  isNIF,
}: CustomTextInputProps) => {
  let currentMaxLength = undefined;
  if (isNIF) {
    currentMaxLength = 9;
  }

  const keyboardType = isEmail
    ? "email-address"
    : isNumber || isNIF
      ? "numeric"
      : "default";

  return (
    <View className={`${className || ""}`} style={{ borderRadius: 9999 }}>
      <TextInput
        multiline={multiline}
        numberOfLines={numberOfLines}
        mode="outlined"
        label={label}
        value={value}
        textAlignVertical={multiline ? "top" : "center"}
        style={multiline ? { minHeight: 400, height: 'auto' } : {}}
        onChangeText={onChangeText}
        secureTextEntry={isPassword}
        autoCapitalize={isEmail || isPassword ? "none" : "sentences"}
        keyboardType={keyboardType}
        maxLength={currentMaxLength}
      />
    </View>
  );
};

export default CustomTextInput;
