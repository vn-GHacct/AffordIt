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
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import ResultScreen from './screens/ResultScreen';
import SavedScreen from './screens/SavedScreen';

// Create the navigator — think of this as defining the map of all screens
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // GestureHandlerRootView must wrap the entire app for swipe gestures to work
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false, // each screen handles its own header
            animation: 'slide_from_right', // standard iOS-style navigation
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
