module.exports = function(api) {
  api.cache(true);

  return {
    presets: [['babel-preset-shopify/web', {modules: false, typescript: true}]],
  };
};
