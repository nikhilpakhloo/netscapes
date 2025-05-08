import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor:"#000" }}>
          <StatusBar style="light"/>
          <Stack>
            <Stack.Screen name="(protected)" options={{ headerShown: false, animation: "none" }} />
            <Stack.Screen name="login" options={{ headerShown: false, animation: "none" }} />
            <Stack.Screen name="register" options={{ headerShown: false, animation: "none" }} />
          </Stack>
        </SafeAreaView>
      </SafeAreaProvider>
  );
}
