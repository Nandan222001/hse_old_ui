// Minimal react-native mock. Only what's used by the code under test.
const React = require('react');
const RN = {
  Platform: { OS: 'android', select: obj => obj.android ?? obj.default },
  StyleSheet: { create: obj => obj, flatten: s => s },
  Dimensions: { get: () => ({ width: 360, height: 800 }), addEventListener: jest.fn(), removeEventListener: jest.fn() },
  PixelRatio: { get: () => 2, getFontScale: () => 1, getPixelSizeForLayoutSize: s => s * 2 },
  AppState: { addEventListener: jest.fn(), removeEventListener: jest.fn() },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  Image: 'Image',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  Pressable: 'Pressable',
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: jest.fn() },
  Linking: { openURL: jest.fn(), addEventListener: jest.fn() },
  Keyboard: { addListener: jest.fn(), removeListener: jest.fn() },
  StatusBar: { setBarStyle: jest.fn(), setBackgroundColor: jest.fn() },
  NativeModules: {},
  requireNativeComponent: () => 'NativeComponent',
  UIManager: { measure: jest.fn() },
};
module.exports = RN;
module.exports.default = RN;
