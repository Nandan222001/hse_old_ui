const React = require('react');
module.exports = {
  __esModule: true,
  NavigationContainer: ({ children }) => React.createElement(React.Fragment, null, children),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn(), replace: jest.fn() }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn(),
  useIsFocused: () => true,
  DefaultTheme: {},
  DarkTheme: {},
};
