export default {
  expo: {
    name: "Tomar+Digital",
    slug: "Tomar_Digital",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/Logos/TomarDigitalLogo.png",
    scheme: "movies",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/Logos/TomarDigitalLogo.png",
        backgroundImage: "./assets/Logos/TomarDigitalLogo.png",
        monochromeImage: "./assets/Logos/TomarDigitalLogo.png",
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ["android.permission.RECORD_AUDIO"],
      package: "com.jlfernandes.TomarDigital",
    },
    web: {
      output: "static",
      favicon: "",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      [
        "expo-image-picker",
        {
          photosPermission: "To send photo to server",
          microphonePermission: "false",
          colors: {
            cropToolbarColor: "#000000",
          },
          dark: {
            colors: {
              cropToolbarColor: "#000000",
            },
          },
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/Logos/TomarDigitalLogo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-secure-store",
      // REPARA: O react-native-maps não está aqui nos plugins!
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "39bcf77c-f4b7-45dc-bb23-3db18bdc0b2d",
      },
    },
  },
};
