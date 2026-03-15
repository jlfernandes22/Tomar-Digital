import { StyleSheet } from "react-native";
import React from "react";
import { Portal, Snackbar, Text } from "react-native-paper";

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

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss} // Chama a função que passarmos do ecrã principal
      duration={3000}
      style={{
        backgroundColor: isError ? "#DC2626" : "#16A34A",
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 20, // Margem de segurança
      }}
      action={{
        label: "OK",
        textColor: "white",
        onPress: onDismiss, // Usa a mesma função para fechar
      }}
    >
      <Text style={{ color: "white", fontSize: 15, fontWeight: "500" }}>
        {message}
      </Text>
    </Snackbar>
  );
};

export default CustomSnackBar;
