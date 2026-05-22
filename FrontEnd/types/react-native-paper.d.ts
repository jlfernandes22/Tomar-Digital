import type { MD3Colors as PaperMD3Colors, MD3Theme as PaperMD3Theme } from "react-native-paper";

declare module "react-native-paper" {
  export type CustomMD3Colors = PaperMD3Colors & {
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
  };

  export type CustomMD3Theme = Omit<PaperMD3Theme, "colors"> & {
    colors: CustomMD3Colors;
  };
}
