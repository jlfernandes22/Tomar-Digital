import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthContext";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { useColorScheme } from "react-native";
import "./globals.css";

const lightTheme = {
  ...MD3LightTheme,
  roundness: 10,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2D1F16", // Convento 900
    onPrimary: "#FFFFFF",
    secondary: "#FF6600", // Verão 500 (Accent)
    onSecondary: "#FFFFFF",
    background: "#FCFAF9", // Convento 50
    surface: "#FFFFFF",
    surfaceVariant: "#F4ECE7", // Convento 100
    error: "#CC0000", // Tabuleiros 600
    outline: "#946648", // Convento 600
    primaryContainer: "#E3D1C5", // Convento 200
    onPrimaryContainer: "#2D1F16",
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  roundness: 10,
  colors: {
    ...MD3DarkTheme.colors,
    // Invertemos o castanho: o primary passa a ser um tom claro para sobressair no fundo escuro
    primary: "#D2B5A3", // Convento 300
    onPrimary: "#2D1F16", // Texto escuro sobre botão claro

    // O laranja de destaque mantém-se brilhante!
    secondary: "#FF6600", // Verão 400 (Ligeiramente mais claro para ler melhor)
    onSecondary: "#FFFFFF",

    // Fundos ficam com os teus tons de castanho mais escuros
    background: "#2D1F16", // Convento 900 (O fundo geral da app)
    surface: "#503626", // Convento 800 (Fundo dos cartões e inputs)
    surfaceVariant: "#724E37", // Convento 700

    // Alertas precisam de ser mais brilhantes no escuro
    error: "#FF6666", // Tabuleiros 300

    outline: "#D2B5A3", // Convento 300
    outlineVariant: "#D2B5A3",
    primaryContainer: "#503626", // Convento 800
    onPrimaryContainer: "#D2B5A3",
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <AuthProvider>
      {/* 5. Injetamos o tema dinâmico! */}
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <Stack>
            <Stack.Screen
              name="(accountCreation)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaProvider>
      </PaperProvider>
    </AuthProvider>
  );
}
