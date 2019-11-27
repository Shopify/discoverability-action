module.exports = function(api) {
  api.cache(true);
  const runtimePreset = [
    'babel-preset-shopify/node',
    {modules: 'commonjs', typescript: true},
  ];

  return {
    presets: [runtimePreset, ['babel-preset-shopify/react', {hot: false}]],
  };
};
