import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appThemes } from "../constants/themes";

export type ModeType = "system" | "light" | "dark";
export type PaletteType = "convento" | "mata" | "tabuleiros";

interface ThemeContextType {
  userMode: ModeType;
  setUserMode: (mode: ModeType) => Promise<void>;
  userPalette: PaletteType;
  setUserPalette: (palette: PaletteType) => Promise<void>;
  currentTheme: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Chaves utilizadas para guardar os dados no armazenamento do dispositivo
const STORAGE_MODE_KEY = "@app_theme_mode";
const STORAGE_PALETTE_KEY = "@app_theme_palette";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemMode = useColorScheme();

  const [userMode, setUserModeState] = useState<ModeType>("system");
  const [userPalette, setUserPaletteState] = useState<PaletteType>("convento");

  // Hook executado na montagem para recuperar as configurações salvas anteriormente
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_MODE_KEY);
        const savedPalette = await AsyncStorage.getItem(STORAGE_PALETTE_KEY);

        if (savedMode) setUserModeState(savedMode as ModeType);
        if (savedPalette) setUserPaletteState(savedPalette as PaletteType);
      } catch (error) {
        console.error("Erro ao carregar tema do AsyncStorage:", error);
      }
    };
    loadSavedTheme();
  }, []);

  // Funções encapsuladas que atualizam o estado React e gravam no dispositivo em simultâneo
  const setUserMode = async (mode: ModeType) => {
    setUserModeState(mode);
    await AsyncStorage.setItem(STORAGE_MODE_KEY, mode);
  };

  const setUserPalette = async (palette: PaletteType) => {
    setUserPaletteState(palette);
    await AsyncStorage.setItem(STORAGE_PALETTE_KEY, palette);
  };

  let activeMode: "light" | "dark" = "light";
  if (userMode === "system") {
    activeMode = systemMode === "dark" ? "dark" : "light";
  } else {
    activeMode = userMode;
  }

  const currentModeThemes = appThemes[activeMode];
  const themeRecord = currentModeThemes as Record<string, any>;

  const safePalette: PaletteType = themeRecord[userPalette]
    ? userPalette
    : "convento";

  const currentTheme = themeRecord[safePalette];

  return (
    <ThemeContext.Provider
      value={{
        userMode,
        setUserMode,
        userPalette,
        setUserPalette,
        currentTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useAppTheme deve ser usado dentro de um ThemeProvider");
  }
  return context;
};
