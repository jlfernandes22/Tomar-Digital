import React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";

// Definimos o que o botão pode receber
interface PrimaryButtonProps {
  children: React.ReactNode; // O texto
  onPress: () => void; // A função que corre ao clicar
  className?: string; // Para adicionar margens extra
  loading?: boolean; // para mostrar a rodinha de carregamento
  buttonColor?: string;
  icon?: any;
  labelStyle?: any;
  accessibilityRole?: any;
  accessibilityLabel?: any;
  disabled?: boolean;
}

const CustomButton = ({
  children,
  onPress,
  className,
  loading,
  buttonColor,
  icon,
  labelStyle,
  accessibilityRole,
  accessibilityLabel,
  disabled,
}: PrimaryButtonProps) => {
  return (
    <View className={` ${className || ""}`}>
      <Button
        mode="contained"
        buttonColor={buttonColor ? buttonColor : "#FF8533"}
        textColor="#FFFFFF"
        onPress={onPress}
        loading={loading}
        labelStyle={[{ fontSize: 18, fontWeight: "bold" }, labelStyle]}
        rippleColor={"#D2B5A3"}
        icon={icon}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
      >
        {children}
      </Button>
    </View>
  );
};

export default CustomButton;
