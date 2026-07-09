// Minimal reanimated mock — enough so modules that import it don't crash.
const mock = {
  __esModule: true,
  default: {
    createAnimatedComponent: c => c,
    View: 'Animated.View',
    Text: 'Animated.Text',
    ScrollView: 'Animated.ScrollView',
    Image: 'Animated.Image',
    runOnJS: fn => fn,
    runOnUI: fn => fn,
    useSharedValue: v => ({ value: v }),
    useAnimatedStyle: fn => ({}),
    withTiming: v => v,
    withSpring: v => v,
    Easing: { linear: () => 0, ease: () => 0, inOut: () => 0 },
  },
  Easing: { linear: () => 0, ease: () => 0, inOut: () => 0 },
  useSharedValue: v => ({ value: v }),
  useAnimatedStyle: fn => ({}),
  withTiming: v => v,
  withSpring: v => v,
  runOnJS: fn => fn,
  runOnUI: fn => fn,
  createAnimatedComponent: c => c,
};
module.exports = mock;
module.exports.default = mock.default;
