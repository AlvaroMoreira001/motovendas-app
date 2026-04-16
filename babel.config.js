module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    // Com Reanimated 4 + react-native-worklets, o babel-preset-expo aplica
    // automaticamente react-native-worklets/plugin (não duplique react-native-reanimated/plugin).
  }
}
