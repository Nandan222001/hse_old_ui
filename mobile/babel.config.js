module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          // Keep `@expo/vector-icons` imports working on bare React Native.
          '@expo/vector-icons': './src/shims/expoVectorIcons',
        },
      },
    ],
  ],
};
