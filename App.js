/**
 * App.js
 *
 * The root of the app. This file does two things:
 *  1. Wraps everything in GestureHandlerRootView (required for swipe gestures)
 *  2. Sets up React Navigation with a stack navigator
 *
 * A Stack Navigator means screens slide in from the right when you navigate
 * forward, and slide back when you go back — standard mobile navigation.
 *
 * We hide the default header (headerShown: false) so each screen can design
 * its own header with full control over the layout.
 */

import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import HomeScreen from './screens/HomeScreen';
import ResultScreen from './screens/ResultScreen';
import SavedScreen from './screens/SavedScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="Saved" component={SavedScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
