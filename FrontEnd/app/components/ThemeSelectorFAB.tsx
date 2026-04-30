import React, { useState } from "react";
import {
  FAB,
  Portal,
  Modal,
  Surface,
  Text,
  SegmentedButtons,
  useTheme,
} from "react-native-paper";
import { useAppTheme, ModeType, PaletteType } from "../../context/ThemeContext";

const ThemeSelectorFAB = () => {
  const [visible, setVisible] = useState(false);
  const { userMode, setUserMode, userPalette, setUserPalette } = useAppTheme();
  const theme = useTheme();

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  return (
    <>
      {/* O Portal garante que o Modal é desenhado acima de todos os outros elementos da interface */}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={{ padding: 20 }}
        >
          {/* Surface utiliza a cor de fundo apropriada do tema atual */}
          <Surface
            style={{
              backgroundColor: theme.colors.surfaceContainerHighest,
              padding: 24,
              borderRadius: 16,
            }}
          >
            <Text
              variant="titleLarge"
              style={{ color: theme.colors.onSurface, marginBottom: 16 }}
            >
              Aparência da Aplicação
            </Text>

            <Text
              variant="labelLarge"
              style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
            >
              Modo de Visualização
            </Text>
            <SegmentedButtons
              value={userMode}
              onValueChange={(value) => setUserMode(value as ModeType)}
              buttons={[
                { value: "system", label: "Auto" },
                { value: "light", label: "Claro" },
                { value: "dark", label: "Escuro" },
              ]}
              style={{ marginBottom: 24 }}
            />

            <Text
              variant="labelLarge"
              style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
            >
              Paleta de Cores
            </Text>
            <SegmentedButtons
              value={userPalette}
              onValueChange={(value) => setUserPalette(value as PaletteType)}
              buttons={[
                { value: "convento", label: "Convento" },
                { value: "mata", label: "Mata" },
                { value: "tabuleiros", label: "Tabuleiros" },
              ]}
              style={{ marginBottom: 24 }}
            />
          </Surface>
        </Modal>
      </Portal>

      {/* Botão flutuante fixado no canto inferior direito do ecrã */}
      <FAB
        icon="palette"
        style={{ 
          position: "absolute", 
          margin: 16, 
          right: 0, 
          bottom: 80,
          backgroundColor: theme.colors.primary
        }}
        onPress={showModal}
        color={theme.colors.onPrimary}
      />
    </>
  );
};

export default ThemeSelectorFAB;
