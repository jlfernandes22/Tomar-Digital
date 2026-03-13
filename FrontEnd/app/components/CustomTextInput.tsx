import React from 'react';
import { View } from 'react-native';
import { TextInput } from 'react-native-paper';

// Definimos o que o botão pode receber
interface CustomTextInputProps {
    label: string; // O texto 
    value: string;
    className?: string;        // Para adicionar margens extra 
    onChangeText: (text: string) => void;
    isPassword?: boolean;
    isEmail?: boolean;
    isNumber?: boolean;
    isNIF?: boolean;
}

const CustomTextInput = ({ label, value, className, onChangeText, isPassword, isEmail, isNumber, isNIF }: CustomTextInputProps) => {

    
    let currentMaxLength = undefined;
    if (isNIF) {
        currentMaxLength = 9;
    }

   
    const keyboardType = isEmail ? 'email-address' : (isNumber || isNIF) ? 'numeric' : 'default';

    return (
        <View className={`${className || ''}`}>
            <TextInput 
              mode="outlined"
              label={label} 
              value={value} 
              onChangeText={onChangeText}
              secureTextEntry={isPassword} 
              autoCapitalize={isEmail || isPassword ? 'none' : 'sentences'}
              keyboardType={keyboardType}
              maxLength={currentMaxLength} 
            />
        </View>
    );
};

export default CustomTextInput;