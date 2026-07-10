import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingScreen from "../screens/OnboardingScreen";
import WordListScreen from "../screens/WordListScreen";
import WordDetailScreen from "../screens/WordDetailScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { loadSettings } from "../store/storage";

export type RootStackParamList = {
  Onboarding: undefined;
  WordList: undefined;
  WordDetail: { id: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [initialRouteName, setInitialRouteName] =
    useState<keyof RootStackParamList>("Onboarding");

  useEffect(() => {
    void loadSettings().then((settings) => {
      setInitialRouteName(
        settings?.hasCompletedOnboarding ? "WordList" : "Onboarding",
      );
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ title: "Get Started" }}
        />
        <Stack.Screen
          name="WordList"
          component={WordListScreen}
          options={{ title: "Vocabulary" }}
        />
        <Stack.Screen
          name="WordDetail"
          component={WordDetailScreen}
          options={{ title: "Word Detail" }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "Settings" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
