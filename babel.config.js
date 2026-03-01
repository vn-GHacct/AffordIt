/**
 * babel.config.js
 *
 * Babel is a JavaScript compiler that transforms modern JS into
 * something React Native can run. The reanimated plugin MUST be
 * listed last — this is a requirement from the react-native-reanimated
 * library (used for swipe animations in SavedCard).
 */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for react-native-reanimated (swipe gestures)
      // Must always be the last plugin in the list
      'react-native-reanimated/plugin',
    ],
  };
};
