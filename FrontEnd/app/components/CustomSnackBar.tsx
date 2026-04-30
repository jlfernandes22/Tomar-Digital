import { StyleSheet } from "react-native";
import React from "react";
import { Portal, Snackbar, Text, useTheme } from "react-native-paper";

// Usar chavetas {} para receber as props.
const CustomSnackBar = ({
  visible,
  message,
  onDismiss,
}: {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}) => {
  // garante que não dá erro se a mensagem estiver vazia
  const isError = message?.includes("Erro") || message?.includes("Aviso");
  const theme = useTheme();

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss} // Chama a função que passarmos do ecrã principal
      duration={3000}
      style={{
        // CORES ESTÁTICAS: Vermelho para erros, Verde para sucesso
        backgroundColor: isError ? "#DC2626" : "#16A34A",
        borderRadius: 9999,
        marginHorizontal: 16,
        marginBottom: 20, // Margem de segurança
        zIndex: 9999,
        elevation: 9999,
      }}
      action={{
        label: "OK",
        textColor: "#ffffff",
        onPress: onDismiss, // Usa a mesma função para fechar
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: "500",
          color: "white",
        }}
      >
        {message}
      </Text>
    </Snackbar>
  );
};

export default CustomSnackBar;
