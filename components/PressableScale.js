/**
 * PressableScale.js
 *
 * A reusable button wrapper that scales down to 0.96 on press and
 * springs back on release using React Native's built-in Animated API.
 *
 * Props:
 *   onPress   {function} - Called when the press is released
 *   style     {object}   - Additional styles for the outer Animated.View
 *   disabled  {boolean}  - When true, skips the animation and press handler
 *   children  {node}     - Inner content
 */

import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

export default function PressableScale({ onPress, style, disabled, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
