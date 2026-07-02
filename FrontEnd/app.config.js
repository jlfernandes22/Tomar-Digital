module.exports = {
  expo: {
    name: 'Tomar+Digital',
    slug: 'Tomar_Digital',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/Logos/TomarDigitalLogo.png',
    scheme: 'movies',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      bundleIdentifier: 'com.jlfernandes.TomarDigital',
      config: {
        googleMapsApiKey:
          process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'CHAVE_TEMPORARIA',
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Precisamos da tua localização para ter acesso a todas as funcionalidades.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Precisamos da tua localização para ter acesso a todas as funcionalidades.',
        NSPhotoLibraryUsageDescription:
          'Precisamos de acesso às tuas fotos para poder carregar fotos.',
        NSCameraUsageDescription:
          'Precisamos de acesso à câmara para tirares fotos às faturas.',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/Logos/TomarDigitalLogo.png',
        backgroundImage: './assets/Logos/TomarDigitalLogo.png',
        monochromeImage: './assets/Logos/TomarDigitalLogo.png',
      },
      config: {
        googleMaps: {
          apiKey:
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'CHAVE_TEMPORARIA',
        },
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
      ],
      package: 'com.jlfernandes.TomarDigital',
    },
    web: {
      output: 'static',
      bundler: 'metro',
    },
    plugins: [
      'expo-localization',
      'expo-router',
      'expo-web-browser',
      [
        'expo-image-picker',
        {
          photosPermission: 'To send photo to server',
          microphonePermission: false,
          colors: { cropToolbarColor: '#000000' },
          dark: { colors: { cropToolbarColor: '#000000' } },
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/Logos/TomarDigitalLogo.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: { backgroundColor: '#000000' },
        },
      ],
      'expo-secure-store',
      [
        'expo-file-system',
        {
          supportsOpeningDocumentsInPlace: true,
          enableFileSharing: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '39bcf77c-f4b7-45dc-bb23-3db18bdc0b2d',
      },
    },
  },
};
