import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { useAuthStore } from "./src/store/authStore";
import { bootstrapAuth } from "./src/firebase/auth";
import HomeScreen from "./src/screens/HomeScreen";
import LobbyScreen from "./src/screens/LobbyScreen";
import GameScreen from "./src/screens/GameScreen";
import JoinScreen from "./src/screens/JoinScreen";

export type RootStackParamList = {
  Home: undefined;
  Join: undefined;
  Lobby: { roomId: string };
  Game: { roomId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { initializing, setInitializing } = useAuthStore();

  useEffect(() => {
    (async () => {
      try {
        await bootstrapAuth();
      } finally {
        setInitializing(false);
      }
    })();
  }, [setInitializing]);

  if (initializing) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: "XO Online" }} />
          <Stack.Screen name="Join" component={JoinScreen} options={{ title: "Join Room" }} />
          <Stack.Screen name="Lobby" component={LobbyScreen} options={{ title: "Lobby" }} />
          <Stack.Screen name="Game" component={GameScreen} options={{ title: "Game" }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
