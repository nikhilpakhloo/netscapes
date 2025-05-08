module.exports = {
  expo: {
    name: "insta",
    slug: "insta",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/instagram.png",
    scheme: "insta",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    extra: {
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/instagram.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.nikhilpakhloo.insta",
      googleServicesFile: "./google-services.json"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-google-signin/google-signin",
      "expo-dev-client",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/instagram.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    }
  }
};
