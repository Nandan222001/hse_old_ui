const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = path.resolve(__dirname);

const config = {
  projectRoot,
  watchFolders: [projectRoot],
  resolver: {
    nodeModulesPaths: [path.resolve(projectRoot, 'node_modules')],
    blockList: [
      // Exclude Android CMake build dirs to prevent Metro watcher crashes
      /android\/app\/.cxx\/.*/,
      /android\/app\/build\/.*/,
      /android\/build\/.*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);

