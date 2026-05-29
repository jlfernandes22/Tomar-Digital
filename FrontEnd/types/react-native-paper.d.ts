import type { MD3Theme } from "react-native-paper";

declare global {
  namespace ReactNativePaper {
    interface MD3Colors {
      surfaceContainerLowest: string;
      surfaceContainerLow: string;
      surfaceContainer: string;
      surfaceContainerHigh: string;
      surfaceContainerHighest: string;
      surfaceDim: string;
      surfaceBright: string;
      surfaceTint: string;
      primaryFixed: string;
      primaryFixedDim: string;
      onPrimaryFixed: string;
      onPrimaryFixedVariant: string;
      secondaryFixed: string;
      secondaryFixedDim: string;
      onSecondaryFixed: string;
      onSecondaryFixedVariant: string;
      tertiaryFixed: string;
      tertiaryFixedDim: string;
      onTertiaryFixed: string;
      onTertiaryFixedVariant: string;
    }
  }
}
