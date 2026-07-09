const React = require('react');
const make = (name) => {
  const C = ({ children }) => React.createElement(React.Fragment, null, children);
  C.displayName = name;
  return C;
};
module.exports = {
  __esModule: true,
  createStackNavigator: () => ({ Navigator: make('StackNavigator'), Screen: make('StackScreen') }),
  createBottomTabNavigator: () => ({ Navigator: make('TabNavigator'), Screen: make('TabScreen') }),
  createDrawerNavigator: () => ({ Navigator: make('DrawerNavigator'), Screen: make('DrawerScreen') }),
  createMaterialTopTabNavigator: () => ({ Navigator: make('MatTopNavigator'), Screen: make('MatTopScreen') }),
};
