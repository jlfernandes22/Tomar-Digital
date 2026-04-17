import React from "react";
import { View } from "react-native";
import { Chip, useTheme } from "react-native-paper";

interface CustomChipProps {
  children: string;
  isSelected: boolean;
  onPress: () => void;
  className?: string;
  icon?: string;
  disabled?: boolean;
}

const CustomChip = ({
  children,
  isSelected,
  onPress,
  className,
  icon,
  disabled,
}: CustomChipProps) => {
  const theme = useTheme();

  return (
    <View className={className}>
      <Chip
        mode="outlined"
        selected={isSelected}
        onPress={onPress}
        icon={icon}
        showSelectedCheck={false}
        // ESTILO DO CONTAINER
        style={{
          // Se selecionado: Laranja. Se não: Branco.
          backgroundColor: isSelected
            ? theme.colors.primaryContainer
            : theme.colors.background,
          // Se selecionado: Laranja. Se não: mantém a borda do tema (ou use 'white' para esconder)
          borderColor: isSelected
            ? theme.colors.onSurfaceVariant
            : theme.colors.outline,
          borderRadius: 12,
          height: 40,
          justifyContent: "center",
        }}
        // ESTILO DO TEXTO
        textStyle={{
          // Se selecionado: Branco. Se não: Cor de texto padrão do tema (escuro)
          color: isSelected ? theme.colors.background : theme.colors.onSurface,
          fontWeight: isSelected ? "bold" : "500",
          fontSize: 14,
          marginVertical: 0,
          paddingHorizontal: 4,
        }}
      >
        {children}
      </Chip>
    </View>
  );
};

export default CustomChip;
